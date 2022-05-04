import { Zones } from '@applemail/lib/src/types';

export interface TestMetadata {
  ss_insert_id: string;
  guid: string;
  test_guid: string;
  zone: Zones;
  subject: string;
  test_id: string;
  guid_in_subject: Record<string, number>;
}

export interface ConfigData {
  screenshotDir: string;
  awsRegion: string;
  awsAcl: string;
  awsContentEncoding: string;
  awsStorageClass: string;
  imageFormat: string;
  awsBucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  clientFolder: string;
  width: string;
  height: string;
  logURL: string;
  reserveURL: string;
  serverId: string;
}

export type ScreenshotComposer = (
  rootPath: string,
  ssGuid: string
) => Promise<Buffer>;

export type LargeThumbnail = Buffer;
export type SmallThumbnail = Buffer;
export type FullScreenshot = Buffer;
