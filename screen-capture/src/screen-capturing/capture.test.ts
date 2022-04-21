import 'reflect-metadata';
import Chance from 'chance';
import { EmailTest } from '../storage-management/types';
import ScreenshotService from './capture';
import { EmlExpressable } from '@applemail/lib/src/eml';
import { AppleScriptManaging } from './types';

const chance = new Chance();

describe('Screenshot Service', () => {
  let screenshotService: ScreenshotService;
  let topMostScrollPosition: number;
  let chunkToScroll: number;
  let screenshotHeight: number;
  jest.resetAllMocks();
  let emlManager: EMLMock;
  let appleScriptManager: AppleScriptManagerMock;

  beforeEach(() => {
    topMostScrollPosition = 0;
    chunkToScroll = chance.integer({ min: 100, max: 300 });
    screenshotHeight = chance.integer({ min: 100, max: 300 });
    emlManager = new EMLMock();
    appleScriptManager = new AppleScriptManagerMock();
    const screenshotFolder = '';

    screenshotService = new ScreenshotService(
      topMostScrollPosition,
      chunkToScroll,
      screenshotHeight,
      emlManager,
      appleScriptManager,
      screenshotFolder
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('desc', () => {
    test('test', () => {
      expect(true).toBe(true);
    });
  });
});

class EMLMock implements EmlExpressable {
  setTest(test: EmailTest) {
    test;
    return this;
  }

  async toEML() {
    return;
  }

  deleteEML() {
    return Promise.resolve();
  }

  getPath() {
    return '';
  }
}

class AppleScriptManagerMock implements AppleScriptManaging {
  async prepareWindow() {
    return;
  }

  async openTest({ at }: { at: string }) {
    at;
    return;
  }

  async getIsMailAppInFront() {
    return true;
  }
  async putMailAppToFront() {
    return;
  }
  async moveCursorToBottom() {
    return;
  }

  async getWindowTitle() {
    return 'Mail';
  }

  async startMailApp() {
    return;
  }

  async getIsMailAppRunning() {
    return true;
  }

  async closeWindow() {
    return;
  }

  async centerWindow() {
    return;
  }

  async quitMailApp() {
    return;
  }

  async resizeWindow() {
    return;
  }

  async scroll({ to }: { to: number }) {
    to;
    return;
  }

  async captureScreenPortion({
    offsetX,
    offsetY,
    width,
    height,
    portionId,
  }: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    portionId: number;
  }) {
    offsetX;
    offsetY;
    width;
    height;
    portionId;
    return;
  }

  async scrollHeader(
    {
      headerHeight,
      windowHeight,
      scrollHeight,
    }: { headerHeight: number; windowHeight: number; scrollHeight: number },
    converter: ({
      pixelsToConvert,
      totalHeight,
      pageHeight,
    }: {
      pixelsToConvert: number;
      totalHeight: number;
      pageHeight: number;
    }) => number
  ) {
    headerHeight;
    windowHeight;
    scrollHeight;
    converter;
    return;
  }

  async scrollTop() {
    return;
  }
  async getHeaderHeight() {
    return 1;
  }
  async getScrollDimensions() {
    return [53, 100, 1000, 2000];
  }
  async getWindowDimensions() {
    return [53, 100, 1000, 700];
  }

  async getWindowCount() {
    return 1;
  }
}
