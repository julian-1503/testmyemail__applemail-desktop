import path from "path";
import EventEmitter from "events";
import { pathOr } from "ramda";
import { getProvisionSettings } from "./Provisioning.js";
import { createClient, commandOptions } from "redis";
import logger from "./Logger.js";
import { processTest } from "./ProcessTest.js";

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

    logger.label("Provisioning Data:");
    logger.dump(data);

    this.transitionState(states.provisioned);
  }

  async connectToSource() {
    const client = createClient({
      socket: {
        port: this.provisioningData.ss_config.redis_server.port,
        host: this.provisioningData.ss_config.redis_server.host,
      },
      database: this.provisioningData.ss_config.redis_server.database,
    });

    await client.connect();

    this.redisClient = client;

    this.transitionState(states.connectedToSource);
  }

  async getNextTest() {
    const next = await this.redisClient.blPop(
      commandOptions({ isIsolated: true }),
      this.provisioningData.ss_config.image_folder,
      0
    );

    return next;
  }

  async processNextTest() {
    this.transitionState(states.processing);

    const nextTest = await this.getNextTest();
    const parsedTest = JSON.parse(nextTest.element);

    logger.label("Next Test:");
    logger.dump(parsedTest);

    const { guid, test_guid: ssGuid, zone, content } = parsedTest;
    const { image_folder } = this.provisioningData.ss_config;

    const name = `${ssGuid}.eml`;
    createEMLFile(name, content);

    const filePath = path.join(getRootFolder(), "eml", name);

    const screenshot = await processTest(filePath);

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
      filename: getFileName(guid, ssGuid, image_folder, imageFormat, "_thumb"),
      body: bigThumbnail,
      imageFormat,
    });

    upload(uploader, {
      bucket,
      filename: getFileName(guid, ssGuid, image_folder, imageFormat, ""),
      body: fullThumbnail,
      imageFormat,
    });

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

    this.transitionState(states.idling);
  }
}
