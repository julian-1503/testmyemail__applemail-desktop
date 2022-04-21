import 'reflect-metadata';
import Chance from 'chance';
import { AppleScriptManager } from '.';
import * as utilsExports from '@applemail/lib/src/utils';

const chance = new Chance();

describe('AppleScriptManager', () => {
  let appleScriptManager: AppleScriptManager;
  let windowWidth: number;
  let topMostScrollPosition: number;
  let runAppleScriptMock: jest.SpyInstance;

  beforeEach(() => {
    runAppleScriptMock = jest.spyOn(utilsExports, 'runAppleScript');
    windowWidth = chance.integer({ min: 100, max: 1000 });
    topMostScrollPosition = 0;

    appleScriptManager = new AppleScriptManager(
      topMostScrollPosition,
      windowWidth
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('centerWindow', () => {
    test('centers the window with applescript', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.centerWindow();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('putMailAppToFront', () => {
    test('make the mail app the front most app', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.putMailAppToFront();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('getIsMailAppInFront', () => {
    test('make the mail app the front most app', async () => {
      runAppleScriptMock.mockResolvedValue('Mail');

      const result = await appleScriptManager.getIsMailAppInFront();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual(true);
    });
  });

  describe('startMailApp', () => {
    test('run the mail application', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.startMailApp();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('getIsMailAppRunning', () => {
    test('check whether the mail app is running', async () => {
      runAppleScriptMock.mockResolvedValue(false);

      const result = await appleScriptManager.getIsMailAppRunning();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual(false);
    });
  });

  describe('quitMailApp', () => {
    test('check whether the mail app is running', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.quitMailApp();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('getScrollDimensions', () => {
    test('fetch the scrolling dimensions from the mail window', async () => {
      const integerParams = { min: 1, max: 500 };
      const offsetX = chance.integer(integerParams);
      const offsetY = chance.integer(integerParams);
      const height = chance.integer(integerParams);
      const width = chance.integer(integerParams);

      runAppleScriptMock.mockResolvedValue(
        [offsetX, offsetY, width, height].join(', ')
      );

      const result = await appleScriptManager.getScrollDimensions();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual([offsetX, offsetY, width, height]);
    });
  });

  describe('getHeaderHeight', () => {
    test('fetch the height for the header portion of the test window', async () => {
      const integerParams = { min: 1, max: 500 };
      const height = chance.integer(integerParams);

      runAppleScriptMock.mockResolvedValue(height);

      const result = await appleScriptManager.getHeaderHeight();
      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual(height);
    });
  });

  describe('getWindowDimensions', () => {
    test('fetch the window dimensions for the test', async () => {
      const integerParams = { min: 1, max: 500 };
      const offsetX = chance.integer(integerParams);
      const offsetY = chance.integer(integerParams);
      const height = chance.integer(integerParams);
      const width = chance.integer(integerParams);

      runAppleScriptMock.mockResolvedValue(
        [offsetX, offsetY, width, height].join(', ')
      );

      const result = await appleScriptManager.getWindowDimensions();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual([offsetX, offsetY, width, height]);
    });
  });

  describe('moveCursorToBottom', () => {
    test('places the cursor to the bottom of the screen to prevent it from hovering over ui elements', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.moveCursorToBottom();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('scroll', () => {
    test('takes the scroll to the specified position', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.scroll({ to: 0.5 });

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('getWindowTitle', () => {
    test('get the title of the front most mail window', async () => {
      const title = chance.string();
      runAppleScriptMock.mockResolvedValue(title);

      const result = await appleScriptManager.getWindowTitle();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual(title);
    });
  });

  describe('closeWindow', () => {
    test('close the front most mail window', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.closeWindow();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('openTest', () => {
    test('opens the eml file at the specified path on the mail app', async () => {
      const path = chance.string();

      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.openTest({ at: path });

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('captureScreenPortion', () => {
    test('screen capture the specified portion', async () => {
      const integerParams = { min: 1, max: 500 };
      const offsetX = chance.integer(integerParams);
      const offsetY = chance.integer(integerParams);
      const height = chance.integer(integerParams);
      const width = chance.integer(integerParams);
      const portionId = chance.integer(integerParams);

      const spy = jest.spyOn(appleScriptManager, 'moveCursorToBottom');

      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.captureScreenPortion(
        {
          portionId,
          offsetX,
          offsetY,
          height,
          width,
        },
        ''
      );

      expect(spy).toHaveBeenCalledTimes(1);
      expect(runAppleScriptMock).toHaveReturnedTimes(2);
      expect(result).not.toBeDefined();
    });
  });

  describe('getAppNameForActiveWindow', () => {
    test('return the application name for the frontmost active window', async () => {
      runAppleScriptMock.mockResolvedValue('Mail');

      const result = await appleScriptManager.getAppNameForActiveWindow();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual('Mail');
    });
  });

  describe('resizeWindow', () => {
    test('resize the frontmost active window', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.resizeWindow();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });

  describe('scrollTop', () => {
    test('scroll to the top of the page', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const spy = jest.spyOn(appleScriptManager, 'scroll');

      const result = await appleScriptManager.scrollTop();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ to: topMostScrollPosition });
      expect(result).not.toBeDefined();
    });
  });

  describe('getWindowCount', () => {
    test('return the number of windows open for the Mail app', async () => {
      runAppleScriptMock.mockResolvedValue(3);

      const result = await appleScriptManager.getWindowCount();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).toEqual(3);
    });
  });

  describe('getWindowCount', () => {
    test('return the number of windows open for the Mail app', async () => {
      runAppleScriptMock.mockResolvedValue(undefined);

      const result = await appleScriptManager.prepareWindow();

      expect(runAppleScriptMock).toHaveReturnedTimes(1);
      expect(result).not.toBeDefined();
    });
  });
});
