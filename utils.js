import fs from "fs";
import path from "path";
import os from "os";
import rimraf from "rimraf";
import sharp from "sharp";
import { propOr } from "ramda";
import logger from "./Logger.js";
import FormData from "form-data";
import axios from "axios";

const guidRegex =
  /^((\d{4}-\d{2}-\d{2})_(((\d+)_(\d+)(_(\d+))?)(_no_images)?)_([a-zA-Z]{2,4}))/;

export const getRootFolder = () => {
  return path.join(os.homedir(), "Documents", "applemail");
};

export const createEMLFile = (name, content) => {
  const dir = path.join(getRootFolder(), "eml");

  if (!fs.existsSync(dir)) {
    rimraf.sync(dir);
    fs.mkdirSync(dir);
  }

  const decoded = Buffer.from(content, "base64").toString("utf8");

  fs.writeFileSync(path.join(dir, name), decoded);
};

export const resizeFull = async (screenshot) => {
  const buffer = await sharp(screenshot).toBuffer();

  return buffer;
};

export const resizeSmall = async (screenshot, endWidth, endHeight) => {
  const buffer = await sharp(screenshot)
    .resize({
      width: endWidth,
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      position: "left top",
    })
    .toBuffer()
    .then((data) => {
      return sharp(data)
        .metadata()
        .then(({ width, height }) => {
          return sharp(data)
            .resize({ height, position: "left top" })
            .extract({
              top: 0,
              left: 0,
              width: width > endWidth ? endWidth : width,
              height: height > endHeight ? endHeight : height,
            })
            .toBuffer();
        });
    });

  return buffer;
};

export const resizeBig = async (screenshot, endWidth) => {
  const buffer = await sharp(screenshot)
    .resize({
      width: endWidth,
      position: "left top",
    })
    .toBuffer();

  return buffer;
};

export const createThumbnail = (screenshot, width, height, resize) => {
  return resize(screenshot, width, height);
};

const extractAllPartsFromGuid = (guid) => {
  const result = guidRegex.exec(guid);

  return result || [];
};

const getZoneFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);

  return result[10] || "";
};

export const getDateFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);

  return result[2] || "";
};

export const getTestTimeFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);
  const time = result[8] || result[6];

  return (time || "").replace(/(.{2})/g, "$1:").slice(0, -1);
};

export const getMemberIdFromGuid = (guid) => {
  const result = extractAllPartsFromGuid(guid);

  return result[5] || "";
};

export const testHasBlockedImages = (guid) => {
  const hasImageBlock = guid.indexOf("_no_images") >= 0;

  return hasImageBlock ? "Y" : "";
};

export const getFileName = (
  guid,
  test_guid,
  clientFolder,
  imgFormat,
  suffix
) => {
  const zone = getZoneFromGuid(guid);
  const hasImageBlock = guid.indexOf("_no_images") >= 0;

  return `${zone}/${test_guid}/${clientFolder}${suffix}${
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
