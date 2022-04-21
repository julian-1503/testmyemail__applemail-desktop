import path from 'path';
import { readdir, readFile } from 'fs/promises';
import sharp, { Blend } from 'sharp';

const build = async (rootPath: string, ssGuid: string) => {
  const images = [];
  let totalHeight = 0;
  let totalWidth = 0;

  const fullPath = path.join(rootPath, ssGuid);

  for (const file of await getFiles(fullPath)) {
    const image = await readFile(file);

    const metadata = await sharp(image).metadata();

    images.push({
      input: image,
      left: 0,
      top: totalHeight,
      blend: 'add' as Blend,
    });

    totalWidth = metadata.width ?? 0;
    totalHeight += metadata.height ?? 0;
  }

  const buffer = await sharp({
    create: {
      width: totalWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .png({ effort: 1, compressionLevel: 3, force: true, quality: 90 })
    .composite(images)
    .toBuffer();

  return buffer;
};

export const getFiles = async (dirPath: string) => {
  const files = await readdir(dirPath);

  return files
    .filter((file) => file.includes('.png'))

    .sort((a, b) => {
      const sortableA = a.match(/\d+/);
      const sortableB = b.match(/\d+/);

      if (!sortableA || !sortableB) {
        return 1;
      }

      return +sortableA[0] - +sortableB[0];
    })
    .map((file) => path.join(dirPath, file));
};

export default { build };
