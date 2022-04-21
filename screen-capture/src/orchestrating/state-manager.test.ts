import 'reflect-metadata';
import EventEmitter from 'events';
import { AppState, Orchestrating, handleStateChange } from '.';

describe('State Manager', () => {
  describe('handleStateChange', () => {
    let app: Orchestrating;

    beforeEach(() => {
      app = new AppMock();
    });

    test('provision the app when not started', async () => {
      const nextState = AppState.NotStarted;
      const spy = jest.spyOn(app, 'provision');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('provision the app when not provisioned', async () => {
      const nextState = AppState.NotProvisioned;
      const spy = jest.spyOn(app, 'provision');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('connect to source once provisioned', async () => {
      const nextState = AppState.Provisioned;
      const spy = jest.spyOn(app, 'connectToSource');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('connect to source when not connected', async () => {
      const nextState = AppState.NotConnectedToSource;
      const spy = jest.spyOn(app, 'connectToSource');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('process next test once provisioned and connected to source', async () => {
      const nextState = AppState.ConnectedToSource;
      const spy = jest.spyOn(app, 'getNextTest');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('process next test when idling', async () => {
      const nextState = AppState.Idling;
      const spy = jest.spyOn(app, 'getNextTest');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('process next test when processed', async () => {
      const nextState = AppState.Processed;
      const spy = jest.spyOn(app, 'getNextTest');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('generate screenshot once a test is available', async () => {
      const nextState = AppState.Processing;
      const spy = jest.spyOn(app, 'generateScreenshot');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('retry connecting to source after a delay', async () => {
      const nextState = AppState.ConnectToSourceFailed;
      const spy = jest.spyOn(app, 'retryConnetToSource');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('retry connecting to source after a delay', async () => {
      const nextState = AppState.ConnectToSourceFailed;
      const spy = jest.spyOn(app, 'retryConnetToSource');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('retry provisioning  after a delay', async () => {
      const nextState = AppState.ProvisionFailed;
      const spy = jest.spyOn(app, 'retryProvision');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    test('upon processing failure store the test for later processing before going for the next', async () => {
      const nextState = AppState.ProcessingFailed;
      const spy = jest.spyOn(app, 'handleProcessingError');

      handleStateChange(app, nextState);

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

class AppMock extends EventEmitter implements Orchestrating {
  run() {
    return;
  }
  getNextTest() {
    return;
  }
  connectToSource() {
    return;
  }
  provision() {
    return;
  }
  generateScreenshot() {
    return;
  }
  retryConnetToSource() {
    return;
  }
  retryProvision() {
    return;
  }
  handleProcessingError() {
    return;
  }
}
