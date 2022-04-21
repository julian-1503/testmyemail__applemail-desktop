import 'reflect-metadata';
import sharp from 'sharp';
import resizeScreenshot from './resize-screenshot';

describe('Resize Screenshot', () => {
  let imageMock: Buffer;

  beforeEach(async () => {
    imageMock = await sharp({
      create: {
        width: 300,
        height: 200,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
  });

  describe('addThumbnails', () => {
    test('returns the full size buffer along with the large and small thumbnails', async () => {
      const width = 100;
      const height = 200;

      const [, , full] = await resizeScreenshot.addThumbnails(
        imageMock,
        width,
        height
      );

      const dimensions = await sharp(full).metadata();

      expect(full).toEqual(imageMock);
      expect(dimensions.height).toEqual(200);
      expect(dimensions.width).toEqual(300);
    });

    test('returns the large thumbnail', async () => {
      const width = 100;
      const height = 200;

      const [large] = await resizeScreenshot.addThumbnails(
        imageMock,
        width,
        height
      );

      const dimensions = await sharp(large).metadata();

      expect(dimensions.height).toEqual(133);
      expect(dimensions.width).toEqual(200);
    });

    test('returns the small thumbnail', async () => {
      const width = 100;
      const height = 200;

      const [, small] = await resizeScreenshot.addThumbnails(
        imageMock,
        width,
        height
      );

      const dimensions = await sharp(small).metadata();

      expect(dimensions.height).toEqual(67);
      expect(dimensions.width).toEqual(width);
    });
  });
});
