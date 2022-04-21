export class WindowNotPresentError extends Error {
  constructor() {
    super('The current active window does not belong to the Mail app.');
  }
}

export class NoTestToCaptureError extends Error {
  constructor() {
    super('No Test to screen capture.');
  }
}

/**
 * Allow Typescript to detect code that should never occur.
 */
export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${JSON.stringify(val)}`);
  }
}
