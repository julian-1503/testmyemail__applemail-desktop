import path from 'path';
import { readFile } from 'fs/promises';
import rimraf from 'rimraf';
import { from } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';

import { ConfigData, ScreenshotComposer, TestMetadata } from './types';
import Logger from '@applemail/lib/src/logger';

import ComposeScreenshot from './compose-screenshot';
import ThumbnailModule from './resize-screenshot';
import UploadModule from './upload';
import NotifyModule from './notify';

import { TYPES } from '@applemail/config/src/inversify.types';
import Guid, { GuidExpressable } from '@applemail/lib/src/guid';

export const getMetadata = async (
  metadataPath: string
): Promise<TestMetadata> => {
  const content = await readFile(metadataPath);

  const metadata = JSON.parse(content.toString('utf8'));

  return metadata;
};

const composeScreenshotFromPieces = async (
  root: string,
  ssGuid: string,
  composer: ScreenshotComposer
) => {
  return await composer(root, ssGuid);
};

const unlinkProcessedFolder = async (
  rootPath: string,
  ssGuid: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    rimraf(path.join(rootPath, ssGuid), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

const notifyHome = async (configData: ConfigData, testData: TestMetadata) => {
  const { logURL, reserveURL, clientFolder, serverId } = configData;
  const { zone, test_guid, guid } = testData;

  const guidManager: GuidExpressable = new Guid(guid);
  const recordId = testData.guid_in_subject[clientFolder] ?? 0;

  return await Promise.all([
    NotifyModule.notifyEmailProcessed({
      logURL,
      zone,
      memberId: guidManager.getMemberId(),
      blockedImages: guidManager.hasImageBlocking(),
      recordId,
      testTime: guidManager.getTime(),
      testDate: guidManager.getDate(),
      guid,
      test_guid,
      image_folder: clientFolder,
    }),
    NotifyModule.markEmailAsProcessedByServer({
      zone,
      reserveURL,
      clientId: serverId,
      recordId,
    }),
  ]);
};

const process$ = (metadataPath: string, configData: ConfigData) => {
  let metadata: TestMetadata;

  return from(getMetadata(metadataPath)).pipe(
    tap((val: TestMetadata) => {
      Logger.log('debug', `[PROCESS] Test Metadata `, {
        tags: 'screenshot,metadata',
        metadata: val,
      });
    }),
    mergeMap((val: TestMetadata) => {
      metadata = val;
      return composeScreenshotFromPieces(
        configData.screenshotDir,
        metadata.test_guid,
        ComposeScreenshot.build
      );
    }),
    tap(() => {
      Logger.log(
        'debug',
        `[PROCESS] Screenshot Built: ${metadata.test_guid} `,
        {
          tags: 'screenshot,compose',
          ssGuid: metadata.test_guid,
        }
      );
    }),
    mergeMap((screenshot: Buffer) =>
      ThumbnailModule.addThumbnails(
        screenshot,
        +configData.width,
        +configData.height
      )
    ),
    tap(() => {
      Logger.log('debug', `[PROCESS] All Thumbnails have been Generated`, {
        tags: 'screenshot,thumbnails',
        ssGuid: metadata.test_guid,
      });
    }),
    mergeMap((screenshots) =>
      UploadModule.uploadScreenshots(screenshots, metadata, configData)
    ),
    tap(() => {
      Logger.log('debug', `[PROCESS] All Images have been Uploaded`, {
        tags: 'screenshot,upload',
        ssGuid: metadata.test_guid,
      });
    }),
    mergeMap(() => notifyHome(configData, metadata)),
    tap(() => {
      Logger.log('debug', `[PROCESS] Notified Home of screenshot processed`, {
        tags: 'screenshot,notify',
        ssGuid: metadata.test_guid,
      });
    }),
    mergeMap(() =>
      unlinkProcessedFolder(configData.screenshotDir, metadata.test_guid)
    ),
    tap(() => {
      Logger.log('debug', `[PROCESS] Processed folder unlinked`, {
        tags: 'screenshot,unlink',
        ssGuid: metadata.test_guid,
      });
    })
  );
};

export default process$;
