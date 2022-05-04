import { curry } from 'ramda';
import { Orchestrating, AppState } from '.';
import { UnreachableCaseError } from '@applemail/lib/src/errors';

export const handleStateChange = curry(
  (app: Orchestrating, newState: AppState) => {
    switch (newState) {
      case AppState.NotStarted:
      case AppState.NotProvisioned:
        app.provision();
        return;

      case AppState.Provisioned:
      case AppState.NotConnectedToSource:
        app.connectToSource();
        return;

      case AppState.ProvisionFailed:
        app.retryProvision();
        return;

      case AppState.ConnectToSourceFailed:
        app.retryConnetToSource();
        return;

      case AppState.Processed:
      case AppState.ConnectedToSource:
      case AppState.Idling:
        app.getNextTest();
        return;

      case AppState.Processing:
        app.generateScreenshot();
        return;

      case AppState.ProcessingFailed:
        app.handleProcessingError();
        return;

      default:
        throw new UnreachableCaseError(newState);
    }
  }
);
