import 'reflect-metadata';
import * as observables from 'rxjs';
import EventEmitter from 'events';
import Chance from 'chance';
import { ProvisionData, ProvisionFetching } from '../provisioning/types';
import App from './app';
import { AppState } from './types';
import { StorageFetching } from '../storage-management';
import { EmailTest } from '../storage-management/types';
import { ScreenCapturable } from '../screen-capturing';
import Logger from '@applemail/lib/src/logger';
import { CaptureEvents } from '../screen-capturing/types';
import * as utils from '@applemail/lib/src/utils';
import { AxiosResponse } from 'axios';

const chance = new Chance();

describe('Orchestrating', () => {
  let app: App;
  let provisioningService: ProvisioningServiceMock;
  let storageService: StorageServiceMock;
  let screenshotService: ScreenshotServiceMock;
  let serverId: string;

  beforeEach(() => {
    jest.spyOn(utils, 'checkInWithHome').mockResolvedValue({} as AxiosResponse);
    serverId = `${chance.integer({ min: 1, max: 100 })}`;
    provisioningService = new ProvisioningServiceMock();
    storageService = new StorageServiceMock();
    screenshotService = new ScreenshotServiceMock();

    app = new App(
      serverId,
      provisioningService,
      storageService,
      screenshotService
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('run', () => {
    test('app initial state is NotStarted', () => {
      expect(app.state).toEqual(AppState.NotStarted);
    });

    test('start the running loop by trantisioning to a NotProvisioned state', () => {
      const expected = AppState.NotProvisioned;

      app.run();

      expect(app.state).toEqual(expected);
    });
  });

  describe('provision', () => {
    test('fetch provisioning settings from service', async () => {
      const provisioningData = { ss_config: {} };

      jest
        .spyOn(provisioningService, 'getProvisionSettings')
        .mockResolvedValueOnce(provisioningData as ProvisionData);

      await app.provision();

      expect(app.state).toEqual(AppState.Provisioned);
    });

    test('provisioning failure transitions to a retriable state', async () => {
      jest
        .spyOn(provisioningService, 'getProvisionSettings')
        .mockRejectedValueOnce(new Error('Provision Failure'));

      await app.provision();

      expect(app.state).toEqual(AppState.ProvisionFailed);
    });
  });

  describe('connectedToSource', () => {
    test('connecting to the test source', async () => {
      await expect(app.connectToSource()).rejects.toThrowError(
        'No Provisioning Data.'
      );
    });

    test('connecting to the test source', async () => {
      const provisioningData = {
        ss_config: {
          redis_server: {
            host: chance.url(),
            port: chance.integer({ min: 1, max: 100 }),
            database: 0,
          },
        },
      };

      jest
        .spyOn(provisioningService, 'getProvisionSettings')
        .mockResolvedValueOnce(provisioningData as ProvisionData);

      await app.provision();
      await app.connectToSource();

      expect(app.state).toEqual(AppState.ConnectedToSource);
    });

    test('connecting to the test source failure transitions to a retriable state', async () => {
      const provisioningData = {
        ss_config: {},
      };

      jest
        .spyOn(provisioningService, 'getProvisionSettings')
        .mockResolvedValueOnce(provisioningData as ProvisionData);

      jest
        .spyOn(storageService, 'connect')
        .mockRejectedValueOnce(new Error('Storage Connection Failure'));

      await app.provision();
      await app.connectToSource();

      expect(app.state).toEqual(AppState.ConnectToSourceFailed);
    });
  });

  describe('getNextTest', () => {
    test('fetch the next test from storage', async () => {
      await app.getNextTest();

      expect(app.state).toEqual(AppState.Processing);
    });

    test('fetching next test failure transitions to a retriable state', async () => {
      jest
        .spyOn(storageService, 'getTest')
        .mockRejectedValueOnce(new Error('Fetch Next Test Failure'));
      await app.getNextTest();

      expect(app.state).toEqual(AppState.Idling);
    });
  });

  describe('generateScreenshot', () => {
    test('generate screenshot for the current processing test', async () => {
      await app.getNextTest();
      await app.generateScreenshot();

      screenshotService.emit(CaptureEvents.complete);

      expect(app.state).toEqual(AppState.Processed);
    });

    test('generating a screenshot failure transitions to a retriable state', async () => {
      await app.getNextTest();
      await app.generateScreenshot();

      screenshotService.emit(CaptureEvents.error);

      expect(app.state).toEqual(AppState.ProcessingFailed);
    });

    test('throw an error if no test is available to screen capture', async () => {
      expect(app.generateScreenshot()).rejects.toThrowError(
        'No Test to screen capture.'
      );
    });
  });

  describe('retryConnetToSource', () => {
    afterEach(() => {
      jest.resetAllMocks();
    });

    test('retry connecting to source after a short delay', async () => {
      jest
        .spyOn(screenshotService, 'generateScreenshot')
        .mockRejectedValueOnce(new Error('Capturing Test Failure'));

      jest
        .spyOn(observables, 'timer')
        .mockImplementation(() => observables.of(0));

      app.state = AppState.ConnectToSourceFailed;

      app.retryConnetToSource();

      expect(app.state).toEqual(AppState.NotConnectedToSource);
    });
  });

  describe('retryProvision', () => {
    test('retry provisioning after a short delay', async () => {
      jest
        .spyOn(screenshotService, 'generateScreenshot')
        .mockRejectedValueOnce(new Error('Capturing Test Failure'));

      jest
        .spyOn(observables, 'timer')
        .mockImplementation(() => observables.of(0));

      app.state = AppState.ProvisionFailed;

      app.retryProvision();

      expect(app.state).toEqual(AppState.NotProvisioned);
    });
  });

  describe('handleProcessingError', () => {
    test('handle no test to save error', async () => {
      const provisioningData = {
        ss_config: { image_folder: chance.string() },
      } as ProvisionData;
      jest
        .spyOn(provisioningService, 'getProvisionSettings')
        .mockResolvedValue(provisioningData);

      jest.spyOn(storageService, 'saveTest').mockResolvedValueOnce();

      const spy = jest.spyOn(Logger, 'log');

      app.state = AppState.ProcessingFailed;

      await app.provision();
      await app.handleProcessingError();

      expect(spy).toHaveBeenCalledWith(
        'error',
        '[APP] Could not put test back',
        expect.objectContaining({ error: 'No Test to store back' })
      );
    });

    test('handle provisioning data error', async () => {
      jest.spyOn(storageService, 'saveTest').mockResolvedValueOnce();

      const spy = jest.spyOn(Logger, 'log');

      app.state = AppState.ProcessingFailed;

      await app.getNextTest();
      await app.handleProcessingError();

      expect(spy).toHaveBeenCalledWith(
        'error',
        '[APP] Could not put test back',
        expect.objectContaining({
          error: 'Missing Provision Data: [image_folder]',
        })
      );
    });

    test('send the test back to storage for later processing', async () => {
      const provisioningData = {
        ss_config: { image_folder: chance.string() },
      } as ProvisionData;
      jest
        .spyOn(provisioningService, 'getProvisionSettings')
        .mockResolvedValue(provisioningData);

      const spy = jest
        .spyOn(storageService, 'saveTest')
        .mockResolvedValueOnce();

      app.state = AppState.ProcessingFailed;

      await app.provision();
      await app.getNextTest();
      await app.handleProcessingError();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('goes for the next test', async () => {
      jest.spyOn(storageService, 'saveTest').mockResolvedValue();

      app.state = AppState.ProcessingFailed;

      await app.handleProcessingError();

      expect(app.state).toEqual(AppState.Idling);
    });
  });
});

class ScreenshotServiceMock extends EventEmitter implements ScreenCapturable {
  async generateScreenshot(test: EmailTest) {
    test;
    return;
  }
}

class ProvisioningServiceMock implements ProvisionFetching {
  async getProvisionSettings() {
    return {} as ProvisionData;
  }
}

class StorageServiceMock implements StorageFetching {
  async connect() {
    return;
  }
  async getTest({ from }: { from: string }) {
    return { content: from } as EmailTest;
  }
  async saveTest() {
    return;
  }
}
