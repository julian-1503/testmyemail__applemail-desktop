import EventEmitter from 'events';
import { timer } from 'rxjs';
import { mapTo } from 'rxjs/operators';
import { inject, injectable } from 'inversify';
import { TYPES } from '@applemail/config/src/inversify.types';
import { AppEvents, AppState, Orchestrating } from './types';
import { ProvisionData, ProvisionFetching } from '../provisioning/types';
import { StorageFetching } from '../storage-management';
import { EmailTest } from '../storage-management/types';
import { ScreenCapturable } from '../screen-capturing';
import { NoTestToCaptureError } from '@applemail/lib/src/errors';
import Logger from '@applemail/lib/src/logger';
import { CaptureEvents } from '../screen-capturing/types';
import { checkInWithHome } from '@applemail/lib/src/utils';

@injectable()
export default class App extends EventEmitter implements Orchestrating {
  private _state: AppState;

  private provisioningData?: ProvisionData;
  private processingTest?: EmailTest;
  private readonly serverId: string;

  private provisioningService: ProvisionFetching;
  private storageService: StorageFetching;
  private screenshotService: ScreenCapturable;

  constructor(
    @inject(TYPES.ServerID) serverId: string,
    @inject(TYPES.ProvisioningService) provisioningService: ProvisionFetching,
    @inject(TYPES.StorageService) storageService: StorageFetching,
    @inject(TYPES.ScreenshotService) screenshotService: ScreenCapturable
  ) {
    super();
    this._state = AppState.NotStarted;
    this.provisioningService = provisioningService;
    this.storageService = storageService;
    this.screenshotService = screenshotService;
    this.serverId = serverId;
  }

  set state(newState: AppState) {
    Logger.log(
      'debug',
      `[APP] Transitioning from state ${this.state} to new state: ${newState}`,
      { tags: 'state,app' }
    );
    this._state = newState;
  }

  get state() {
    return this._state;
  }

  /**
   * Start the Application loop.
   */
  async run() {
    this.transition(AppState.NotProvisioned);
  }

  async provision() {
    try {
      const data = await this.provisioningService.getProvisionSettings();

      Logger.log('debug', '[PROVISION] received provisioning data', {
        tags: 'provision,app',
        data,
      });

      this.provisioningData = data;
      this.transition(AppState.Provisioned);
    } catch {
      this.transition(AppState.ProvisionFailed);
    }
  }

  async connectToSource() {
    if (!this.provisioningData) {
      throw new Error('No Provisioning Data.');
    }

    try {
      await this.storageService.connect({
        port: this.provisioningData.ss_config.redis_server.port,
        host: this.provisioningData.ss_config.redis_server.host,
        database: this.provisioningData.ss_config.redis_server.database,
      });

      this.transition(AppState.ConnectedToSource);
    } catch (error) {
      if (error instanceof Error) {
        Logger.log('error', '[STORAGE] error connecting to source.', {
          tags: 'source,app',
          message: error.message,
          trace: error.stack,
        });
      }
      this.transition(AppState.ConnectToSourceFailed);
    }
  }

  async getNextTest() {
    try {
      this.processingTest = await this.storageService.getTest({
        from: this.provisioningData?.ss_config.image_folder ?? '',
      });

      Logger.log('debug', '[APP] next test received', {
        tags: 'test,app',
        test: this.processingTest.test_guid,
      });

      this.transition(AppState.Processing);
    } catch {
      this.transition(AppState.Idling);
    }
  }

  private removeListeners() {
    this.removeListener(CaptureEvents.error, this.handleOnError);
    this.removeListener(CaptureEvents.complete, this.handleOnComplete);
  }

  private handleOnError() {
    this.transition(AppState.ProcessingFailed);
    this.removeListeners();
  }

  private handleOnComplete() {
    this.transition(AppState.Processed);
    this.removeListeners();
  }

  async generateScreenshot() {
    if (!this.processingTest) {
      throw new NoTestToCaptureError();
    }

    this.screenshotService.once(
      CaptureEvents.error,
      this.handleOnError.bind(this)
    );

    this.screenshotService.once(
      CaptureEvents.complete,
      this.handleOnComplete.bind(this)
    );

    this.screenshotService.generateScreenshot(this.processingTest);
  }

  retryConnetToSource() {
    timer(3000)
      .pipe(mapTo(this.transition(AppState.NotConnectedToSource)))
      .subscribe();
  }

  retryProvision() {
    timer(3000)
      .pipe(mapTo(this.transition(AppState.NotProvisioned)))
      .subscribe();
  }

  async handleProcessingError() {
    try {
      await this.putTestBack();
    } catch (e) {
      if (e instanceof Error) {
        Logger.log('error', `[APP] Could not put test back`, {
          tags: 'app,recovery',
          error: e.message,
          trace: e.stack,
        });
      }
    } finally {
      this.transition(AppState.Idling);
    }
  }

  /**
   * Send the test back to storage for later processing.
   */
  private async putTestBack() {
    if (!this.processingTest) {
      throw new Error('No Test to store back');
    }

    if (!this.provisioningData?.ss_config.image_folder) {
      throw new Error('Missing Provision Data: [image_folder]');
    }

    return this.storageService.saveTest({
      test: this.processingTest,
      to: this.provisioningData?.ss_config.image_folder,
    });
  }

  /**
   * Transitions to a new state
   * States represent tasks the app performs over time.
   */
  private transition(newState: AppState) {
    if (this.provisioningData && this.serverId) {
      Logger.log(
        'debug',
        `[APP] Check In With Home - serverID: ${this.serverId}`,
        { tags: 'app,checkin' }
      );
      checkInWithHome(
        this.serverId,
        this.provisioningData?.ss_config.checkin_url ?? ''
      );
    }

    this.state = newState;

    this.emit(AppEvents.StateTransition, newState);
  }
}
