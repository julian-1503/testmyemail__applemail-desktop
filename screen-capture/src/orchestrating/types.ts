import EventEmitter from 'events';

export enum AppState {
  NotStarted = 'NotStarted',
  NotProvisioned = 'NotProvisioned',
  Provisioned = 'Provisioned',
  ProvisionFailed = 'ProvisionFailed',
  NotConnectedToSource = 'NotConnectedToSource',
  ConnectedToSource = 'ConnectedToSource',
  ConnectToSourceFailed = 'ConnectToSourceFailed',
  Processing = 'Processing',
  Processed = 'Processed',
  ProcessingFailed = 'ProcessingFailed',
  Idling = 'Idling',
}

export enum AppEvents {
  StateTransition = 'state-transition',
}

export interface Orchestrating extends EventEmitter {
  run: () => void;
  connectToSource: () => void;
  provision: () => void;
  getNextTest: () => void;
  generateScreenshot: () => void;
  retryConnetToSource: () => void;
  retryProvision: () => void;
  handleProcessingError: () => void;
}
