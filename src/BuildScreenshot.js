import os from "os";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import rimraf from "rimraf";

export async function buildScreenshot() {
  const dir = path.join(
    os.homedir(),
    "Documents",
    "applemail",
    "temp-captures"
  );

  const files = (await fs.promises.readdir(dir))
    .filter((file) => file.includes(".png"))
    .sort((a, b) => {
      let sortableA = +a.match(/\d+/)[0];
      let sortableB = +b.match(/\d+/)[0];

      return sortableA - sortableB;
    });

  let images = [];
  let totalHeight = 0;
  let totalWidth = 0;

  for (const file of files) {
    const image = await fs.promises.readFile(path.join(dir, file));

    const { width, height } = await sharp(image).metadata();

    images.push({ input: image, left: 0, top: totalHeight, blend: "add" });

    totalWidth = width;
    totalHeight += height;
  }

  const buffer = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png()
    .composite(images)
    .toBuffer();

  rimraf.sync(dir);

  return buffer;
}
