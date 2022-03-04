import fs from "fs";
import path from "path";
import os from "os";
import rimraf from "rimraf";
import sharp from "sharp";
import { interval, from, tap } from "rxjs";
import { mergeMap } from "rxjs/operators";
import axios from "axios";
import FormData from "form-data";
import childProcess from "child_process";

import logger from "./Logger.js";
import Logger from "./Logger.js";

import { GUID_REGEX } from "./constants.js";

/**
 * Get the root folder of the application.
 *
 * @return {String} an absolute path to the folder.
 */
export const getRootFolder = () => {
  return path.join(os.homedir(), "Documents", "applemail");
};

/**
 * Create an .eml file from the test contents.
 * @param {String} name - the expected file name.
 * @param {String} content - the base64 encoded string containing the email contents.
 *
 */
export const createEMLFile = (name, content) => {
  const root = getRootFolder();

  if (!fs.existsSync(root)) {
    fs.mkdirSync(root);
  }

  const dir = path.join(root, "eml");

  rimraf.sync(dir);

  fs.mkdirSync(dir);

  const decoded = Buffer.from(content, "base64").toString("utf8");

  fs.writeFileSync(path.join(dir, name), decoded);
};

/**
 * Resize the image to a full screenshot.
 *
 * @param {Buffer} screenshot - the original screenshot Buffer.
 *
 * @return {Buffer} the resulting image after resize.
 */
export const resizeFull = async (screenshot) => {
  const buffer = await sharp(screenshot).toBuffer();

  return buffer;
};

/**
 * Resize the image to a smalll thumbnail.
 *
 * @param {Buffer} screenshot - the original screenshot Buffer.
 * @param {Number} endWidth - the expected width of the thumbnail.
 * @param {Number} endHeight - the expected height of the thumbnail.
 *
 * @return {Buffer} the resulting image after resize.
 */
export const resizeSmall = async (screenshot, endWidth, endHeight) => {
  const buffer = await sharp(screenshot)
    .resize({
      width: endWidth,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      position: "left top",
    })
    .toBuffer();

  const { width, height } = await sharp(buffer).metadata();

  return sharp(buffer)
    .resize({ height, position: "left top" })
    .extract({
      top: 0,
      left: 0,
      width: width > endWidth ? endWidth : width,
      height: height > endHeight ? endHeight : height,
    })
    .toBuffer();
};

/**
 * Resize the image to a large thumbnail.
 *
 * @param {Buffer} screenshot - the original screenshot Buffer.
 * @param {Number} endWidth - the expected with of the Thumbnail.
 *
 * @return {Buffer} the resulting image after resize.
 */
export const resizeBig = async (screenshot, endWidth) => {
  const buffer = await sharp(screenshot)
    .resize({
      width: endWidth,
      position: "left top",
    })
    .toBuffer();

  return buffer;
};

/**
 * Resize original screeenshot to a thumbnail with fixed dimensions.
 *
 * @param {Buffer} screenshot - the original screenshot Buffer.
 * @param {Number} width - the small thumbnail width.
 * @param {Number} height - the small thumbnail height.
 * @param {Function} resize - the resize implementation.
 *
 * @return {Promise<Buffer>} the resulting resized image.
 */
export const createThumbnail = (screenshot, width, height, resize) => {
  return resize(screenshot, width, height);
};

/**
 * Divide the GUID into its different components.
 *
 * @param {String} guid - the legacy GUID Format.
 *
 * @return {Array}  a list of all the different parts.
 */
const extractAllPartsFromGuid = (guid) => {
  const result = GUID_REGEX.exec(guid);

  return result || [];
};

/**
 * Extract the zone from the GUID.
 *
 * @param {String} guid - the legacy GUID Format.
 *
 * @return {String} the zome if present, an empty string otherwise.
 */
const getZoneFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);

  return result[10] || "";
};

/**
 * Extract the test sent date from the GUID.
 *
 * @param {String} guid - the legacy GUID Format.
 *
 * @return {String} the sent date if present, an empty string otherwise.
 */
export const getDateFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);

  return result[2] || "";
};

/**
 * Extract the test sent time from the GUID.
 *
 * @param {String} guid - the legacy GUID Format.
 *
 * @return {String} the sent time if present, an empty string otherwise.
 */
export const getTestTimeFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);
  const time = result[8] || result[6];

  return (time || "").replace(/(.{2})/g, "$1:").slice(0, -1);
};

/**
 * Extract the member id from the legacy GUID.
 *
 * @param {String} guid - the legacy GUID Format.
 *
 * @return {String} the member id if present, an empty string otherwise.
 */
export const getMemberIdFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);

  return result[5] || "";
};

/**
 * Whether the test wants to check for Image Blocking.
 *
 * @param {String} guid - the legacy GUID Format.
 *
 * @return {String} - "Y" if is for image blocking, empty stirng otherwise.
 */
export const testHasBlockedImages = (guid) => {
  const hasImageBlock = guid.indexOf("_no_images") >= 0;

  return hasImageBlock ? "Y" : "";
};

/**
 * Format the screenshot URL to become the path at S3.
 *
 * @param {String} guid - the legacy GUID Format.
 * @param {String} ssGuid - the new SSGUID.
 * @param {String} clientFolder - the image folder identifier.
 * @param {String} imgFormat - the image type (png, jpg).
 * @param {String} suffix - the screenshot suffix depending on the image size.
 *
 * @return {String} the image path for S3.
 */
export const getFileName = (guid, ssGuid, clientFolder, imgFormat, suffix) => {
  const zone = getZoneFromGuid(guid);
  const hasImageBlock = guid.indexOf("_no_images") >= 0;

  return `${zone}/${ssGuid}/${clientFolder}${suffix}${
    hasImageBlock ? "_no_images" : ""
  }.${imgFormat}`;
};

export const notifyEmailProcessed = async ({
  reserveURL,
  logURL,
  zone,
  memberId,
  blockedImages,
  recordId,
  testTime,
  testDate,
  guid,
  test_guid,
  image_folder,
  clientId,
}) => {
  try {
    await axios.post(reserveURL, {
      zone,
      ss_id: clientId,
      record_id_array: [recordId],
    });

    const formData = new FormData();

    formData.append("block_images", blockedImages);
    formData.append("imap", "");
    formData.append("rppapi", "");
    formData.append("client", image_folder);
    formData.append("zone", zone);
    formData.append("test_date", `${testDate} ${testTime}`);
    formData.append("member_id", memberId);
    formData.append("useGuid", "true");
    formData.append("ss_record", recordId);
    formData.append("old_guid", guid);
    formData.append("guid", test_guid);

    await axios.post(logURL, formData, {
      headers: { ...formData.getHeaders() },
    });
  } catch (error) {
    logger.error(error);
  }
};

/**
 * Checkin to inform the dots app
 * about the server status.
 *
 * @param {number} clientId - the client server number.
 * @param {string} endpoint - the checkin url.
 */
export const checkIn = async (clientId, endpoint) => {
  const fullEndpoint = `${endpoint}${clientId}`;

  Logger.effect(`Checking In with Home for server ID: ${clientId}`);

  Logger.effect(fullEndpoint);

  try {
    await axios.get(fullEndpoint);
  } catch (error) {
    Logger.error(error);
  }
};

/**
 * Create the checkin interval to inform the dots app
 * about the server status.
 *
 * @param {number} clientId - the client server number.
 * @param {string} endpoint - the checkin url.
 * @param {number} intervalValue - the value for each iteration in milliseconds.
 */
export const startCheckInInterval = (clientId, endpoint, intervalValue) => {
  const fullEndpoint = `${endpoint}${clientId}`;
  interval(intervalValue)
    .pipe(
      tap(() => {
        Logger.effect(`Checking In with Home for server ID: ${clientId}`);
      }),
      mergeMap(() => from(axios.get(fullEndpoint)))
    )
    .subscribe();
};

/**
 * Set the resolution of the virtual machines
 * no need to do it locally.
 */
export const updateResolutionIfAvailable = () => {
  const path = path.join(os.homedir(), "Documents", "scripts", "resolution.sh");

  if (!fs.existsSync(root)) return;

  try {
    childProcess.execFileSync(path);
  } catch (error) {
    Logger.error("Error updating the screen resolution.");
    Logger.error(error);
  }
};
