import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@applemail/config/src/inversify.types';
import { App, Orchestrating } from './orchestrating';
import { ProvisioningService, ProvisionFetching } from './provisioning';
import { StorageFetching, StorageService } from './storage-management';
import FormDataService, { FormDatable } from '@applemail/lib/src/form-data';
import {
  AppleScriptManager,
  AppleScriptManaging,
  ScreenCapturable,
  ScreenshotService,
} from './screen-capturing';
import {
  CHUNK_TO_SCROLL,
  SCREENSHOT_FOLDER,
  SCREENSHOT_HEIGHT,
  TOP_MOST_SCROLL_POSITION,
  WINDOW_WIDTH,
  GUID_REGEX,
  EML_PATH,
} from '@applemail/config/src/constants';
import EML, { EmlExpressable } from '@applemail/lib/src/eml';

const container = new Container({ skipBaseClassChecks: true });

container.bind<string>(TYPES.EmlPath).toConstantValue(EML_PATH);
container.bind<string>(TYPES.ScreenshotDir).toConstantValue(SCREENSHOT_FOLDER);
container.bind<number>(TYPES.WindowWidth).toConstantValue(WINDOW_WIDTH);
container
  .bind<number>(TYPES.TopMostScrollPosition)
  .toConstantValue(TOP_MOST_SCROLL_POSITION);
container.bind<number>(TYPES.ChunkToScroll).toConstantValue(CHUNK_TO_SCROLL);
container
  .bind<number>(TYPES.ScreenshotHeight)
  .toConstantValue(SCREENSHOT_HEIGHT);
container
  .bind<string>(TYPES.ServerID)
  .toConstantValue(process.env.SERVER_ID ?? '');
container
  .bind<string>(TYPES.ProvisionURL)
  .toConstantValue(process.env.PROVISION_URL ?? '');
container
  .bind<string>(TYPES.EmailAddress)
  .toConstantValue(process.env.EMAIL_ADDRESS ?? '');
container
  .bind<string>(TYPES.UploadUser)
  .toConstantValue(process.env.UPLOAD_USER ?? '');
container
  .bind<string>(TYPES.UploadPassword)
  .toConstantValue(process.env.UPLOAD_PASSWORD ?? '');
container.bind<Orchestrating>(TYPES.Orchestrator).to(App).inSingletonScope();
container
  .bind<ProvisionFetching>(TYPES.ProvisioningService)
  .to(ProvisioningService)
  .inSingletonScope();
container
  .bind<StorageFetching>(TYPES.StorageService)
  .to(StorageService)
  .inSingletonScope();
container
  .bind<FormDatable>(TYPES.FormDataManager)
  .to(FormDataService)
  .inSingletonScope();
container
  .bind<ScreenCapturable>(TYPES.ScreenshotService)
  .to(ScreenshotService)
  .inSingletonScope();
container.bind<EmlExpressable>(TYPES.EmlManager).to(EML).inSingletonScope();
container
  .bind<AppleScriptManaging>(TYPES.AppleScriptManager)
  .to(AppleScriptManager)
  .inSingletonScope();

export default container;
