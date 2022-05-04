import sharp from 'sharp';
import { FullScreenshot, LargeThumbnail, SmallThumbnail } from './types';

const getSmallThumbnail = async (
  screenshot: Buffer,
  endWidth: number,
  endHeight: number
): Promise<Buffer> => {
  const buffer = await sharp(screenshot)
    .resize({
      width: endWidth,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      position: 'left top',
    })
    .toBuffer();

  const { width, height } = await sharp(buffer).metadata();

  return sharp(buffer)
    .resize({ height, position: 'left top' })
    .extract({
      top: 0,
      left: 0,
      width: (width ?? 0) > endWidth ? endWidth : width ?? 0,
      height: (height ?? 0) > endHeight ? endHeight : height ?? 0,
    })
    .toBuffer();
};

const getLargeThumbnail = async (
  screenshot: Buffer,
  endWidth: number
): Promise<Buffer> => {
  const buffer = await sharp(screenshot)
    .resize({
      width: endWidth,
      position: 'left top',
    })
    .toBuffer();

  return buffer;
};

const addThumbnails = async (
  screenshot: Buffer,
  width: number,
  height: number
): Promise<[LargeThumbnail, SmallThumbnail, FullScreenshot]> => {
  return [
    await getLargeThumbnail(screenshot, height),
    await getSmallThumbnail(screenshot, width, height),
    screenshot,
  ];
};

export default {
  addThumbnails,
};
