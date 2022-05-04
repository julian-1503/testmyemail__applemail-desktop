import EventEmitter from 'events';
import { EmailTest } from '../storage-management/types';

export interface AppleScriptManaging {
  prepareWindow: () => Promise<void>;
  openTest: ({ at }: { at: string }) => Promise<void>;
  getWindowCount(): Promise<number>;
  getIsMailAppInFront: () => Promise<boolean>;
  putMailAppToFront: () => Promise<void>;
  moveCursorToBottom: () => Promise<void>;
  getWindowTitle: () => Promise<string>;
  startMailApp: () => Promise<void>;
  getIsMailAppRunning: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  centerWindow: () => Promise<void>;
  quitMailApp: () => Promise<void>;
  resizeWindow: () => Promise<void>;
  scroll: ({ to }: { to: number }) => Promise<void>;
  captureScreenPortion: (
    {
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
    },
    toPath: string
  ) => Promise<void>;
  scrollTop: () => Promise<void>;
  getHeaderHeight: () => Promise<number>;
  getScrollDimensions: () => Promise<number[]>;
  getWindowDimensions: () => Promise<number[]>;
}

export interface ScreenCapturable extends EventEmitter {
  generateScreenshot: (test: EmailTest) => Promise<void>;
}

export type ScreenshotResult = Buffer;

export type offsetX = number;
export type offsetY = number;
export type frameWidth = number;
export type frameHeight = number;

export interface ScreenCaptureblePortion {
  height: frameHeight;
  width: frameWidth;
  y: offsetY;
  x: offsetX;
}

export enum CaptureEvents {
  error = 'error',
  appRunning = 'appRunning',
  appNotRunning = 'appNotRunning',
  appReady = 'appReady',
  appOutOfFocus = 'appOutOfFocus',
  endCheckIsAppRunnningLoop = 'endCheckIsAppRunnningLoop',
  endCheckIsAppInFrontLoop = 'endCheckIsAppInFrontLoop',
  testOpen = 'testOpen',
  screenshotCorrupted = 'screenshotCorrupted',
  complete = 'complete',
  getDimensions = 'getDimensions',
  dimensionsReceived = 'dimensionsReceived',
  capturingDone = 'capturingDone',
  captureNextChunk = 'captureNextChunk',
}
