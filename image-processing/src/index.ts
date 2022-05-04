import dotenv from 'dotenv';
dotenv.config();

import { TYPES } from '@applemail/config/src/inversify.types';
import container from '@applemail/screen-capture/src/inversify.config';
import { Watcher, Watching } from './watching';
import { ProvisionFetching } from '@applemail/screen-capture/src/provisioning';
import { process$ } from './processing';
import {
  AWS_ACL,
  AWS_CONTENT_ENCODING,
  AWS_REGION,
  AWS_STORAGE_CLASS,
  IMAGE_FORMAT,
  SCREENSHOT_FOLDER,
} from '@applemail/config/src/constants';

async function main() {
  const provisioningService: ProvisionFetching = container.get(
    TYPES.ProvisioningService
  );

  const provisioningData = await provisioningService.getProvisionSettings();

  const configData = {
    screenshotDir: SCREENSHOT_FOLDER,
    awsRegion: AWS_REGION,
    awsAcl: AWS_ACL,
    awsContentEncoding: AWS_CONTENT_ENCODING,
    awsStorageClass: AWS_STORAGE_CLASS,
    imageFormat: IMAGE_FORMAT,
    awsBucket: provisioningData.ss_config.aws_eoa_bucket,
    accessKeyId: provisioningData.ss_config.aws_access_key,
    secretAccessKey: provisioningData.ss_config.aws_secret_key,
    clientFolder: provisioningData.ss_config.image_folder,
    width: provisioningData.ss_config.thumb_width,
    height: provisioningData.ss_config.thumb_height,
    logURL: provisioningData.ss_config.screenshot_log_url,
    reserveURL: provisioningData.ss_config.reserve_url,
    serverId: provisioningData.ss_config.os_email_client_version_id,
  };

  const watcher: Watching = new Watcher(configData.screenshotDir);

  watcher.watch().handleTestAdded((path) => {
    setImmediate(() => {
      process$(path, configData).subscribe();
    });
  });
}

main();
