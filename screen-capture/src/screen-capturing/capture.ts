import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import { injectable, inject } from 'inversify';
import Logger from '@applemail/lib/src/logger';
import rimraf from 'rimraf';
import {
  setIntervalAsync,
  clearIntervalAsync,
  SetIntervalAsyncTimer,
} from 'set-interval-async/dynamic';

import { timer, interval, from, fromEvent, merge, throwError } from 'rxjs';

import { takeUntil, mergeMap, tap, filter } from 'rxjs/operators';

import {
  AppleScriptManaging,
  CaptureEvents,
  ScreenCapturable,
  ScreenCaptureblePortion,
} from './types';
import { EmailTest } from '../storage-management/types';
import { TYPES } from '@applemail/config/src/inversify.types';
import { EmlExpressable } from '@applemail/lib/src/eml';

@injectable()
class ScreenshotService extends EventEmitter implements ScreenCapturable {
  private readonly topMostScrollPosition: number;
  private readonly chunkToScroll: number;
  private readonly screenshotHeight: number;
  private emlManager: EmlExpressable;
  private appleScriptManager: AppleScriptManaging;
  private _test?: EmailTest;
  private screenshotFolder: string;

  private scrollIteration;
  private capturedPixels;
  private scrollPosition = 0;
  private scrolledPixels;

  private windowDimensions?: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };

  private scrollDimensions?: {
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  };

  private headerHeight?: number;
  private totalPixelsToCapture?: number;

  private monitorTestWindowIntervalId?: SetIntervalAsyncTimer;

  constructor(
    @inject(TYPES.TopMostScrollPosition) topMostScrollPosition: number,
    @inject(TYPES.ChunkToScroll) chunkToScroll: number,
    @inject(TYPES.ScreenshotHeight) screenshotHeight: number,
    @inject(TYPES.EmlManager) emlManager: EmlExpressable,
    @inject(TYPES.AppleScriptManager) appleScriptManager: AppleScriptManaging,
    @inject(TYPES.ScreenshotDir) screenshotFolder: string
  ) {
    super();
    this.topMostScrollPosition = topMostScrollPosition;
    this.chunkToScroll = chunkToScroll;
    this.screenshotHeight = screenshotHeight;
    this.emlManager = emlManager;
    this.appleScriptManager = appleScriptManager;
    this.screenshotFolder = screenshotFolder;

    this.scrollIteration = 1;
    this.scrollIteration = 1;
    this.capturedPixels = 0;
    this.scrollPosition = this.topMostScrollPosition;
    this.scrolledPixels = 0;
  }

  async generateScreenshot(test: EmailTest) {
    this._test = test;

    await this.emlManager.setTest(test).toEML();

    this.clearHandlers().registerHandlers().start();
  }

  private start() {
    this.bringAppToFront();
  }

  private getListeners() {
    return [
      { event: CaptureEvents.appReady, listener: this.handleAppReady },
      { event: CaptureEvents.appRunning, listener: this.handleAppRunning },
      { event: CaptureEvents.testOpen, listener: this.handleTestOpen },
      {
        event: CaptureEvents.appOutOfFocus,
        listener: this.handleAppOutOfFocus,
      },
      {
        event: CaptureEvents.appNotRunning,
        listener: this.handleAppNotRunning,
      },
      {
        event: CaptureEvents.getDimensions,
        listener: this.handleGetDimensions,
      },
      {
        event: CaptureEvents.dimensionsReceived,
        listener: this.handleDimensionsReceived,
      },
      {
        event: CaptureEvents.capturingDone,
        listener: this.handleCapturingDone,
      },
      {
        event: CaptureEvents.captureNextChunk,
        listener: this.handleCaptureNextChunk,
      },
      {
        event: CaptureEvents.screenshotCorrupted,
        listener: this.handleScreenshotCorrupted,
      },
    ];
  }

  private registerHandlers() {
    for (const listener of this.getListeners()) {
      this.on(listener.event, listener.listener);
    }

    return this;
  }

  private clearHandlers() {
    for (const listener of this.getListeners()) {
      this.removeAllListeners(listener.event);
    }

    return this;
  }

  private async handleTestOpen() {
    Logger.log('debug', `[CAPTURE] Test is now open.`, {
      tags: 'capture,open',
    });

    this.monitorTestWindow();

    await this.appleScriptManager.prepareWindow();
    await this.appleScriptManager.scrollTop();

    this.emitEvent(CaptureEvents.getDimensions);
  }

  private async handleCaptureNextChunk() {
    if (!this.scrollDimensions || !this.windowDimensions || !this._test) {
      this.emitEvent(CaptureEvents.screenshotCorrupted);
      return;
    }

    Logger.log(
      'debug',
      `[CAPTURE] Capturing next chunk - chunk number: ${this.scrollIteration}.`,
      { tags: 'capture,next chunk' }
    );

    const nextDimensions = this.computeNextScreenshotDimensions({
      windowX: this.windowDimensions.offsetX,
      windowY: this.windowDimensions.offsetY,
      windowHeight: this.windowDimensions.height,
      windowWidth: this.windowDimensions.width,
      scrollHeight: this.totalPixelsToCapture ?? 0,
      scrollY: this.scrollDimensions.offsetY,
      scrollIteration: this.scrollIteration,
      capturedPixels: this.capturedPixels,
      scrollPosition: this.scrollPosition,
    });

    Logger.log('debug', `[CAPTURE] Next chunk dimensions: ${nextDimensions}.`, {
      tags: 'capture,next chunk dimensions',
    });

    await this.appleScriptManager.captureScreenPortion(
      {
        offsetX: nextDimensions.x,
        offsetY: nextDimensions.y,
        width: nextDimensions.width,
        height: nextDimensions.height,
        portionId: this.scrollIteration,
      },
      this.getPath()
    );

    if (this.scrollIteration > 1) {
      this.scrolledPixels += 50;
    }

    this.capturedPixels += this.screenshotHeight;

    if (
      this.capturedPixels > this.scrollDimensions.height ||
      this.scrollDimensions.height === this.windowDimensions.height
    ) {
      this.capturedPixels = this.scrollDimensions.height;
    }

    const needToScroll = this.scrollPosition < 1;

    if (needToScroll) {
      this.scrolledPixels += this.chunkToScroll;

      this.scrollPosition = this.convertPixelsToScrollPosition({
        pixelsToConvert: this.scrolledPixels,
        totalHeight: this.scrollDimensions.height,
        pageHeight: this.windowDimensions.height,
      });

      await this.appleScriptManager.scroll({ to: this.scrollPosition });

      this.scrollIteration += 1;

      this.emitEvent(CaptureEvents.captureNextChunk);
    } else {
      this.emitEvent(CaptureEvents.capturingDone);
    }
  }

  private async handleDimensionsReceived() {
    if (this.isScrollNeeded()) {
      this.captureByChunks();
    } else {
      this.captureFull();
    }
  }

  private async scrollHeader() {
    if (
      !this.headerHeight ||
      !this.windowDimensions ||
      !this.scrollDimensions
    ) {
      this.emitEvent(CaptureEvents.screenshotCorrupted);
      return;
    }

    const position = this.convertPixelsToScrollPosition({
      pixelsToConvert: this.headerHeight,
      totalHeight: this.scrollDimensions.height,
      pageHeight: this.windowDimensions.height,
    });

    await this.appleScriptManager.scroll({ to: position });
  }

  private async handleCapturingDone() {
    await this.clearIntervals();
    await this.appleScriptManager.closeWindow();
    await this.emlManager.deleteEML();
    await this.saveMetaData();

    Logger.log(
      'debug',
      `[CAPTURE] screen capture done for guid: ${this._test?.test_guid}.`,
      {
        tags: 'capture,done',
      }
    );

    this.resetState();

    this.emitEvent(CaptureEvents.complete);
  }

  private async saveMetaData() {
    if (!this._test) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, ...rest } = this._test;

    Logger.log('debug', `[CAPTURE] saving test metadata: ${rest}.`, {
      tags: 'capture,metadata',
    });

    await fs.promises.writeFile(
      path.join(this.getPath(), 'meta.json'),
      JSON.stringify(rest)
    );
  }

  private async captureByChunks() {
    if (!this.headerHeight) {
      this.emitEvent(CaptureEvents.screenshotCorrupted);
      return;
    }

    Logger.log('info', `[CAPTURE] Capturing screenshot by chunks.`, {
      tags: 'capture,chunks',
    });

    await this.scrollHeader();

    this.scrolledPixels += this.headerHeight;

    this.emitEvent(CaptureEvents.captureNextChunk);
  }

  private async captureFull() {
    if (!this.windowDimensions || !this.headerHeight) {
      this.emitEvent(CaptureEvents.screenshotCorrupted);
      return;
    }

    Logger.log('info', `[CAPTURE] Capturing screenshot in 1 shot.`, {
      tags: 'capture,single',
    });

    await this.appleScriptManager.captureScreenPortion(
      {
        offsetX: this.windowDimensions.offsetX,
        offsetY: this.windowDimensions.offsetY + this.headerHeight,
        width: this.windowDimensions.width,
        height: this.windowDimensions.height - this.headerHeight,
        portionId: this.scrollIteration,
      },
      this.getPath()
    );

    this.emitEvent(CaptureEvents.capturingDone);
  }

  private async handleGetDimensions() {
    const [windowX, windowY, windowWidth, windowHeight] =
      await this.appleScriptManager.getWindowDimensions();

    const [scrollX, scrollY, scrollWidth, scrollHeight] =
      await this.appleScriptManager.getScrollDimensions();

    this.headerHeight = await this.appleScriptManager.getHeaderHeight();

    this.totalPixelsToCapture = scrollHeight - this.headerHeight;

    this.windowDimensions = {
      offsetX: windowX,
      offsetY: windowY,
      width: windowWidth,
      height: windowHeight,
    };

    this.scrollDimensions = {
      offsetX: scrollX,
      offsetY: scrollY,
      width: scrollWidth,
      height: scrollHeight,
    };

    this.emitEvent(CaptureEvents.dimensionsReceived);
  }

  private async handleScreenshotCorrupted() {
    try {
      await this.clearIntervals();
      await this.emlManager.deleteEML();
      await this.deleteCapturedImages();
    } catch (error) {
      Logger.log('error', '[ScreenshotManager] Failed to process test', {
        tags: 'screenshot,corrupted',
        error,
      });
    } finally {
      process.exit(1);
    }
  }

  private async bringAppToFront() {
    const isMailAppRunning =
      await this.appleScriptManager.getIsMailAppRunning();

    if (!isMailAppRunning) {
      this.emitEvent(CaptureEvents.appNotRunning);
      return;
    }

    this.emitEvent(CaptureEvents.appRunning);
  }

  private async handleAppRunning() {
    const isAppInFront = await this.appleScriptManager.getIsMailAppInFront();

    if (!isAppInFront) {
      this.emitEvent(CaptureEvents.appOutOfFocus);
      return;
    }

    this.emitEvent(CaptureEvents.appReady);
  }

  private handleAppNotRunning() {
    interval(100)
      .pipe(
        tap(() => from(this.appleScriptManager.startMailApp())),
        mergeMap(() => from(this.appleScriptManager.getIsMailAppRunning())),
        filter((isAppRunning) => isAppRunning),
        tap(() => this.emitEvent(CaptureEvents.endCheckIsAppRunnningLoop)),
        takeUntil(
          merge(
            timer(10000).pipe(
              mergeMap(() => throwError(() => new Error('App Not Running.')))
            ),
            fromEvent(this, CaptureEvents.endCheckIsAppRunnningLoop)
          )
        )
      )
      .subscribe({
        complete: () => {
          this.emitEvent(CaptureEvents.appRunning);
        },
        error: (err: Error) => {
          console.error(err);
        },
      });
  }

  private async handleAppReady() {
    from(this.appleScriptManager.openTest({ at: this.emlManager.getPath() }))
      .pipe(mergeMap(() => timer(3000)))
      .subscribe({
        complete: () => {
          this.emitEvent(CaptureEvents.testOpen);
        },
      });
  }

  private handleAppOutOfFocus() {
    interval(100)
      .pipe(
        tap(() => from(this.appleScriptManager.putMailAppToFront())),
        mergeMap(() => from(this.appleScriptManager.getIsMailAppInFront())),
        filter((isAppInFront) => isAppInFront),
        tap(() => this.emitEvent(CaptureEvents.endCheckIsAppInFrontLoop)),
        takeUntil(
          merge(
            timer(10000).pipe(
              mergeMap(() => throwError(() => new Error('App Not In Front.')))
            ),
            fromEvent(this, CaptureEvents.endCheckIsAppInFrontLoop)
          )
        )
      )
      .subscribe({
        complete: () => {
          this.emitEvent(CaptureEvents.appReady);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  private monitorTestWindow() {
    this.monitorTestWindowIntervalId = setIntervalAsync(async () => {
      const isInFront = await this.appleScriptManager.getIsMailAppInFront();
      const title = await this.appleScriptManager.getWindowTitle();

      if (!isInFront || title !== this._test?.guid) {
        Logger.log(
          'error',
          '[ScreenshotManager] Test window changed unexpectedly and it is no longer visible.',
          {
            tags: 'screenshot,title',
          }
        );

        this.emitEvent(CaptureEvents.screenshotCorrupted);
      }
    }, 100);
  }

  private emitEvent(event: CaptureEvents) {
    Logger.log('debug', `[Capture] Emitting Event ${event}`, {
      tags: 'event,capture',
    });

    this.emit(event);
  }

  private getPath() {
    return path.join(this.screenshotFolder, this._test?.test_guid ?? '');
  }

  private resetState() {
    this.scrollIteration = 1;
    this.capturedPixels = 0;
    this.scrollPosition = 0;
    this.scrolledPixels = 0;

    this.windowDimensions = undefined;

    this.scrollDimensions = undefined;

    this.headerHeight = 0;
    this.totalPixelsToCapture = 0;
  }

  private async clearIntervals() {
    if (this.monitorTestWindowIntervalId) {
      await clearIntervalAsync(this.monitorTestWindowIntervalId);
    }
  }

  private isScrollNeeded() {
    if (!this.scrollDimensions || !this.windowDimensions) {
      return false;
    }

    return this.scrollDimensions?.height > this.windowDimensions?.height;
  }

  private deleteCapturedImages(): Promise<void> {
    Logger.log('debug', `[CAPTURE] removing captured images.`, {
      tags: 'capture,delete',
    });

    return new Promise((resolve, reject) => {
      rimraf(this.getPath(), (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }

  private getOffset = () => {
    return this.screenshotHeight - this.chunkToScroll;
  };

  private computeNextScreenshotDimensions({
    windowX,
    windowY,
    windowHeight,
    windowWidth,
    scrollHeight,
    scrollY,
    scrollIteration,
    capturedPixels,
    scrollPosition,
  }: {
    windowX: number;
    windowY: number;
    windowHeight: number;
    windowWidth: number;
    scrollHeight: number;
    scrollY: number;
    scrollIteration: number;
    capturedPixels: number;
    scrollPosition: number;
  }): ScreenCaptureblePortion {
    const isLastPage = scrollPosition >= 1;

    const isFirstPage = scrollIteration === 1;

    if (isFirstPage) {
      return {
        height: this.screenshotHeight,
        width: windowWidth,
        y: scrollY,
        x: windowX,
      };
    }

    if (isLastPage) {
      const height = scrollHeight - capturedPixels;

      return {
        height: height,
        width: windowWidth,
        x: windowX,
        y: windowY + (windowHeight - height),
      };
    }

    return {
      height: this.screenshotHeight,
      width: windowWidth,
      y: scrollY + this.getOffset(),
      x: windowX,
    };
  }

  /**
   * Scroll position in Mail windows is percentage based
   * starting at 0.0 which is the topmost potition and going all the way
   * down to 1.0.
   * This function computes the equivalent in percentage of a number of pixels to scroll down.
   */
  private convertPixelsToScrollPosition = ({
    pixelsToConvert,
    totalHeight,
    pageHeight,
  }: {
    pixelsToConvert: number;
    totalHeight: number;
    pageHeight: number;
  }): number => {
    return (pixelsToConvert * 100) / (totalHeight - pageHeight) / 100;
  };
}

export default ScreenshotService;
