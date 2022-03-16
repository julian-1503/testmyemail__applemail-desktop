import path from "path";
import EventEmitter from "events";
import { pathOr } from "ramda";
import { createClient, commandOptions } from "redis";
import { readFile } from "fs/promises";
import { getProvisionSettings } from "./Provisioning.js";
import Logger from "./Logger.js";
import ScreenshotModule, {
  quitMailApp,
  openTest,
  activateMailApp,
} from "./Screenshot.js";
import { startCheckInInterval, wait } from "./utils.js";

import {
  createEMLFile,
  getRootFolder,
  createThumbnail,
  resizeSmall,
  resizeBig,
  resizeFull,
  getFileName,
  notifyEmailProcessed,
  getMemberIdFromGuid,
  getTestTimeFromGuid,
  getDateFromGuid,
  testHasBlockedImages,
} from "./utils.js";

import { CHECK_INTERVAL } from "./constants.js";

import { getUploader, upload } from "./Upload.js";

export const states = {
  notProvisioned: "notProvisioned",
  provisioned: "provisioned",
  notConnectedToSource: "notConnectedToSource",
  connectedToSource: "connectedToSource",
  processing: "processing",
  idling: "idling",
};

export default class App extends EventEmitter {
  constructor() {
    super();
    this.state = states.notProvisioned;
    this.provisioningData = null;
    this.redisClient = null;
  }

  transitionState(newState) {
    if (states[newState]) {
      const oldState = this.state;

      this.state = newState;

      this.emit("state-transition", oldState, newState);
    }
  }

  async provision() {
    const data = await getProvisionSettings();

    this.provisioningData = data;

    Logger.label("Provisioning Data:");
    Logger.dump(data);

    startCheckInInterval(
      process.env.SERVER_ID,
      this.provisioningData.ss_config.checkin_url,
      CHECK_INTERVAL
    );

    this.transitionState(states.provisioned);
  }

  async connectToSource() {
    try {
      const client = createClient({
        socket: {
          port: this.provisioningData.ss_config.redis_server.port,
          host: this.provisioningData.ss_config.redis_server.host,
        },
        database: this.provisioningData.ss_config.redis_server.database,
      });

      await client.connect();

      this.redisClient = client;

      this.launchVersionScreen();

      this.transitionState(states.connectedToSource);
    } catch (error) {
      Logger.error("Error connecting to Redis.");
      Logger.error(error);
      this.transitionState(states.notConnectedToSource);
    }
  }

  async getNextTest() {
    const next = await this.redisClient.blPop(
      commandOptions({ isIsolated: true }),
      this.provisioningData.ss_config.image_folder,
      0
    );

    return next;
  }

  async putTestBack(test) {
    await this.redisClient.lPush(
      this.provisioningData.ss_config.image_folder,
      JSON.stringify(test)
    );
  }

  async processNextTest() {
    this.transitionState(states.processing);

    let nextTest;

    try {
      nextTest = await this.getNextTest();
    } catch {
      wait({ seconds: 5 });

      this.transitionState(states.idling);

      return;
    }

    const parsedTest = JSON.parse(nextTest.element);

    Logger.label("Next Test:");

    const { content: _, ...rest } = parsedTest;
    Logger.dump(rest);

    const { guid, test_guid: ssGuid, zone, content } = parsedTest;
    const { image_folder } = this.provisioningData.ss_config;

    const name = `${ssGuid}.eml`;
    createEMLFile(name, content);

    const filePath = path.join(getRootFolder(), "eml", name);

    try {
      const screenshot = await ScreenshotModule.main(filePath);

      const encoding = "base64";

      const width = +this.provisioningData.ss_config.thumb_width;
      const height = +this.provisioningData.ss_config.thumb_height;

      const smallThumbnail = await createThumbnail(
        Buffer.from(screenshot, encoding),
        width,
        height,
        resizeSmall
      );

      const bigThumbnail = await createThumbnail(
        Buffer.from(screenshot, encoding),
        width,
        height,
        resizeBig
      );

      const fullThumbnail = await createThumbnail(
        Buffer.from(screenshot, encoding),
        width,
        height,
        resizeFull
      );

      const bucket = this.provisioningData.ss_config.aws_eoa_bucket;
      const imageFormat = "png";

      const uploader = getUploader({
        accessKeyId: this.provisioningData.ss_config.aws_access_key,
        secretAccessKey: this.provisioningData.ss_config.aws_secret_key,
      });

      upload(uploader, {
        bucket,
        filename: getFileName(guid, ssGuid, image_folder, imageFormat, "_tn"),
        body: smallThumbnail,
        imageFormat,
      });

      upload(uploader, {
        bucket,
        filename: getFileName(
          guid,
          ssGuid,
          image_folder,
          imageFormat,
          "_thumb"
        ),
        body: bigThumbnail,
        imageFormat,
      });

      upload(uploader, {
        bucket,
        filename: getFileName(guid, ssGuid, image_folder, imageFormat, ""),
        body: fullThumbnail,
        imageFormat,
      })
        .then(() => {
          notifyEmailProcessed({
            reserveURL: this.provisioningData.ss_config.reserve_url,
            logURL: this.provisioningData.ss_config.screenshot_log_url,
            zone,
            memberId: getMemberIdFromGuid(guid),
            blockedImages: testHasBlockedImages(guid),
            recordId: pathOr(0, ["guid_in_subject", image_folder], parsedTest),
            testTime: getTestTimeFromGuid(guid),
            testDate: getDateFromGuid(guid),
            guid,
            test_guid: ssGuid,
            image_folder,
            clientId: process.env.SERVER_ID,
          });
        })
        .catch((error) => {
          if (parsedTest) {
            this.putTestBack(parsedTest);
          }

          Logger.error(`Could not upload screenshot for GUID: ${ssGuid}`);
          Logger.error(error);
        });
    } catch (error) {
      Logger.error(error);
      Logger.error(error.stack);

      if (parsedTest) {
        this.putTestBack(parsedTest);
      }

      await quitMailApp();
    } finally {
      this.transitionState(states.idling);
    }
  }

  async launchVersionScreen() {
    const name = "version.eml";
    const filePath = path.join(getRootFolder(), "eml", name);
    const packageJSON = JSON.parse(
      await readFile(new URL("../package.json", import.meta.url))
    );

    const content = Buffer.from(
      "Content-Type: text/html; charset=utf-8\r\n" +
        "Content-Transfer-Encoding: quoted-printable\r\n" +
        "X-Eoa-Zone: none\r\n" +
        "X-Eoa-ID: 0\r\n" +
        "From: AppleMail <support@emailonacid.com>\r\n" +
        "To: AppleMail <support@emailonacid.com>\r\n" +
        "Subject: App Version\r\n" +
        "Message-ID: <f3fdb2fc-bd33-5352-c053-d20959c79a51@appmail.emailonacid.com>\r\n" +
        "Date: Tue, 15 Mar 2022 23:53:43 +0000\r\n" +
        "MIME-Version: 1.0\r\n" +
        "\r\n" +
        '<h1 style=3D"font-size: 50px; text-align: center;margin-top: 100px">' +
        "Version: " +
        packageJSON.version +
        "</h1>\n" +
        '<p style=3D"font-size: 10px;font-style: italic;">' +
        "Do not close this window</p>\n" +
        "\n"
    ).toString("base64");

    Logger.debug(content);

    await activateMailApp();

    createEMLFile(name, content);

    await openTest({ at: filePath });
  }
}
