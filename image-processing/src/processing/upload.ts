import { curry } from 'ramda';
import AWS from 'aws-sdk';
import {
  ConfigData,
  FullScreenshot,
  LargeThumbnail,
  SmallThumbnail,
  TestMetadata,
} from '../processing/types';
import { ScreenshotSuffix } from '@applemail/lib/src/types';
import { getFileName } from '@applemail/lib/src/utils';

const getUploader = curry(
  (
    {
      awsRegion,
      awsAcl,
      awsContentEncoding,
      awsStorageClass,
      accessKeyId,
      secretAccessKey,
      awsBucket,
      imageFormat,
    }: {
      awsRegion: string;
      awsAcl: string;
      awsContentEncoding: string;
      awsStorageClass: string;
      accessKeyId: string;
      secretAccessKey: string;
      awsBucket: string;
      imageFormat: string;
    },
    { body, path }: { body: Uint8Array; path: string }
  ): Promise<void> => {
    const screenshotUploader = new AWS.S3({
      accessKeyId,
      secretAccessKey,
      region: awsRegion,
      maxRetries: 5,
    });

    return new Promise((resolve, reject) => {
      screenshotUploader.upload(
        {
          Bucket: awsBucket,
          Key: path,
          Body: body,
          ACL: awsAcl,
          ContentEncoding: awsContentEncoding,
          ContentType: `image/${imageFormat}`,
          StorageClass: awsStorageClass,
        },
        (error: Error) => {
          if (error) {
            return reject(error);
          }
          resolve();
        }
      );
    });
  }
);

const uploadScreenshots = async (
  screenshots: [LargeThumbnail, SmallThumbnail, FullScreenshot],
  testData: TestMetadata,
  configData: ConfigData
) => {
  const {
    awsRegion,
    awsAcl,
    awsContentEncoding,
    awsStorageClass,
    imageFormat,
    awsBucket,
    accessKeyId,
    secretAccessKey,
    clientFolder,
  } = configData;

  const { guid, test_guid, zone } = testData;

  const [largeThumbnail, smallThumbnail, fullScreenshot] = screenshots;
  const upload = getUploader({
    awsRegion,
    awsAcl,
    awsContentEncoding,
    awsStorageClass,
    accessKeyId,
    secretAccessKey,
    awsBucket,
    imageFormat,
  });

  const namer = getFileName(guid, test_guid, clientFolder, imageFormat, zone);

  return await Promise.all([
    upload({
      body: largeThumbnail,
      path: namer(ScreenshotSuffix.LargeThumbnail),
    }),
    upload({ body: smallThumbnail, path: namer(ScreenshotSuffix.Thumbnail) }),
    upload({ body: fullScreenshot, path: namer(ScreenshotSuffix.Full) }),
  ]);
};

export default { uploadScreenshots };
