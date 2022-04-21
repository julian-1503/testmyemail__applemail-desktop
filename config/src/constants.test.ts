import os from 'os';
import path from 'path';
import {
  CHECK_INTERVAL,
  COMPENSATION_PIXELS,
  GUID_REGEX,
  HEADER_HEIGHT,
  SCREENSHOT_FOLDER,
  SCREENSHOT_HEIGHT,
  SCREENSHOT_SUFFIX,
  TOP_MOST_SCROLL_POSITION,
  WINDOW_WIDTH,
  EML_PATH,
  AWS_ACL,
  AWS_CONTENT_ENCODING,
  AWS_REGION,
  AWS_STORAGE_CLASS,
  IMAGE_FORMAT,
} from './constants';

describe('Constants', () => {
  describe('HEADER_HEIGHT', () => {
    test('has the correct value', () => {
      expect(HEADER_HEIGHT).toEqual({
        768: 90,
        900: 180,
      });
    });
  });

  describe('COMPENSATION_PIXELS', () => {
    test('has the correct value', () => {
      expect(COMPENSATION_PIXELS).toEqual({
        768: 1,
        900: 5,
      });
    });
  });

  describe('SCREENSHOT_SUFFIX', () => {
    test('has the correct value', () => {
      expect(SCREENSHOT_SUFFIX).toEqual({
        smallThumbnail: '_tn',
        largeThumbnail: '_thumb',
        fullScreenshot: '',
      });
    });
  });

  describe('GUID_REGEX', () => {
    test('has the correct value', () => {
      expect(GUID_REGEX).toEqual(
        /^((\d{4}-\d{2}-\d{2})_(((\d+)_(\d+)(_(\d+))?)(_no_images)?)_([a-zA-Z]{2,4}))/
      );
    });
  });

  describe('TOP_MOST_SCROLL_POSITION', () => {
    test('has the correct value', () => {
      expect(TOP_MOST_SCROLL_POSITION).toEqual(0);
    });
  });

  describe('CHECK_INTERVAL', () => {
    test('has the correct value', () => {
      expect(CHECK_INTERVAL).toEqual(6000);
    });
  });

  describe('WINDOW_WIDTH', () => {
    test('has the correct value', () => {
      expect(WINDOW_WIDTH).toEqual(1048);
    });
  });

  describe('SCREENSHOT_HEIGHT', () => {
    test('has the correct value', () => {
      expect(SCREENSHOT_HEIGHT).toEqual(600);
    });
  });

  describe('SCREENSHOT_FOLDER', () => {
    test('has the correct value', () => {
      expect(SCREENSHOT_FOLDER).toEqual(
        path.join(os.homedir(), 'Documents', 'applemail', 'temp-captures')
      );
    });
  });

  describe('EML_PATH', () => {
    test('has the correct value', () => {
      expect(EML_PATH).toEqual(
        path.join(os.homedir(), 'Documents', 'applemail', 'eml')
      );
    });
  });

  describe('AWS_REGION', () => {
    test('has the correct value', () => {
      expect(AWS_REGION).toEqual('us-east-1');
    });
  });

  describe('AWS_ACL', () => {
    test('has the correct value', () => {
      expect(AWS_ACL).toEqual('public-read');
    });
  });

  describe('AWS_CONTENT_ENCODING', () => {
    test('has the correct value', () => {
      expect(AWS_CONTENT_ENCODING).toEqual('base64');
    });
  });

  describe('AWS_STORAGE_CLASS', () => {
    test('has the correct value', () => {
      expect(AWS_STORAGE_CLASS).toEqual('REDUCED_REDUNDANCY');
    });
  });

  describe('IMAGE_FORMAT', () => {
    test('has the correct value', () => {
      expect(IMAGE_FORMAT).toEqual('png');
    });
  });
});
