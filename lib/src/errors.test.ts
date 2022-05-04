import {
  NoTestToCaptureError,
  UnreachableCaseError,
  WindowNotPresentError,
} from './errors';

describe('Errors', () => {
  describe('WindowNotPresentError', () => {
    test('triggers the correct error message', () => {
      expect(new WindowNotPresentError().message).toEqual(
        'The current active window does not belong to the Mail app.'
      );
    });
  });

  describe('NoTestToCaptureError', () => {
    test('triggers the correct error message', () => {
      expect(new NoTestToCaptureError().message).toEqual(
        'No Test to screen capture.'
      );
    });
  });

  describe('UnreachableCaseError', () => {
    test('triggers the correct error message', () => {
      expect(new UnreachableCaseError('test' as never).message).toEqual(
        'Unreachable case: "test"'
      );
    });
  });
});
