import { injectable, inject } from 'inversify';
import { runAppleScript } from '@applemail/lib/src/utils';
import Logger from '@applemail/lib/src/logger';

import {
  AppleScriptManaging,
  frameHeight,
  frameWidth,
  offsetX,
  offsetY,
} from './types';
import { TYPES } from '@applemail/config/src/inversify.types';

@injectable()
class AppleScriptManager implements AppleScriptManaging {
  private readonly appName = 'Mail';

  private readonly topMostScrollPosition: number;
  private readonly windowWidth: number;

  constructor(
    @inject(TYPES.TopMostScrollPosition) topMostScrollPosition: number,
    @inject(TYPES.WindowWidth) windowWidth: number
  ) {
    this.topMostScrollPosition = topMostScrollPosition;
    this.windowWidth = windowWidth;
  }

  async centerWindow(): Promise<void> {
    Logger.log('debug', `[APPLE-MANAGER] centering window.`, {
      tags: 'applescript,center',
    });
    await runAppleScript(`
      tell application "finder"
        set screensize to bounds of window of desktop
        set screenwidth to item 3 of screensize
      end tell
      tell application "system events"
        set myfrontmost to name of first item of (processes whose frontmost is true)
      end tell
      try
        tell application myfrontmost
          set windowsize to bounds of window 1
          set windowxl to item 1 of windowsize
          set windowyt to item 2 of windowsize
          set windowxr to item 3 of windowsize
          set windowyb to item 4 of windowsize

          set windowwidth to windowxr - windowxl

          set bounds of window 1 to {(screenwidth - windowwidth) / 2.0, 0, (screenwidth + windowwidth) / 2.0, (windowyb - windowyt)}
        end tell
      end try

      delay 0.25
    `);
  }

  async startMailApp(): Promise<void> {
    Logger.log('debug', `[APPLE-MANAGER] starting app.`, {
      tags: 'applescript,start',
    });
    await runAppleScript(`
      tell application "${this.appName}"
         if not running then
            run
            delay 0.25
         end if
         activate
      end tell

      tell application "System Events"
         tell application process "${this.appName}"
            set frontmost to true
         end tell
      end tell
    `);
  }

  async putMailAppToFront() {
    await runAppleScript(`
      tell application "System Events"
        tell application process "${this.appName}"
          set frontmost to true
        end tell
      end tell
    `);
  }

  async getIsMailAppRunning(): Promise<boolean> {
    const result = await runAppleScript(`
      return application "${this.appName}" is running
    `);

    return result === 'true';
  }

  async getIsMailAppInFront() {
    const nameOfFrontApp = await runAppleScript(`
      tell application "System Events"
        return name of first application process whose frontmost is true
      end tell
    `);

    return nameOfFrontApp === this.appName;
  }

  async quitMailApp(): Promise<void> {
    await runAppleScript(`
      tell application "${this.appName}"
        quit
      end tell
    `);
  }

  async getScrollDimensions(): Promise<number[]> {
    return (
      await runAppleScript(`
        tell application "System Events"
          tell process "${this.appName}"
            set theSize to size of group 1 of scroll area 1 of front window
            set thePosition to position of scroll area 1 of front window

            return thePosition & theSize
          end tell
        end tell
      `)
    )
      .split(', ')
      .map((item: string) => +item);
  }

  async getHeaderHeight(): Promise<number> {
    const result = await runAppleScript(`
      tell application "System Events"
        tell process "${this.appName}"
          set theSize to size of group 1 of group 1 of scroll area 1 of window 1
          set height to item 2 of theSize
          return height
        end tell
      end tell
    `);

    return +result;
  }

  async getWindowDimensions(): Promise<number[]> {
    return (
      await runAppleScript(`
        tell application "System Events"
          tell process "${this.appName}"
            set theSize to size of scroll area 1 of front window
            set thePosition to position of scroll area 1 of front window

            return thePosition & theSize
          end tell
        end tell
      `)
    )
      .split(', ')
      .map((item: string) => +item);
  }

  async moveCursorToBottom(): Promise<void> {
    await runAppleScript(`
      do shell script "cliclick m:" & "0,9999"
    `);
  }

  async scroll({ to: newPosition }: { to: number }): Promise<void> {
    Logger.log('debug', `[APPLE-MANAGER] scrolling to: ${newPosition}.`, {
      tags: 'applescript,scroll',
    });

    await runAppleScript(`
      tell application "System Events"
        tell process "${this.appName}"
          set value of scroll bar 1 of scroll area 1 of front window to ${newPosition}
        end tell
      end tell

      delay 0.5
    `);
  }

  getWindowTitle(): Promise<string> {
    return runAppleScript(`
      tell application "System Events"
        tell process "${this.appName}"
          return value of attribute "AXTitle" of front window
        end tell
      end tell
    `);
  }

  async closeWindow(): Promise<void> {
    Logger.log('debug', `[APPLE-MANAGER] closing window.`, {
      tags: 'applescript,close',
    });
    await runAppleScript(`
      tell application "System Events"
        tell process "${this.appName}"
          click button 1 of window 1
        end tell
      end tell
    `);
  }

  async openTest({ at }: { at: string }): Promise<void> {
    Logger.log('debug', `[APPLE-MANAGER] opening test at: ${at}.`, {
      tags: 'applescript,open',
    });

    await runAppleScript(`
      tell application "${this.appName}"
        set download html attachments to true
        open ("${at}" as POSIX file)
      end tell
    `);
  }

  async captureScreenPortion(
    {
      portionId,
      offsetX,
      offsetY,
      height,
      width,
    }: {
      portionId: number;
      offsetX: offsetX;
      offsetY: offsetY;
      height: frameHeight;
      width: frameWidth;
    },
    toPath: string
  ): Promise<void> {
    await this.moveCursorToBottom();

    Logger.log(
      'debug',
      `[APPLE-MANAGER] capturing screenshot with dimensions: 
               (offsetX: ${offsetX}, offsetY: ${offsetY}, windth: ${width}, height: ${height}).
      `,
      {
        tags: 'applescript,resize',
      }
    );

    await runAppleScript(`
      set dFolder to "${toPath}"

      do shell script ("mkdir -p " & dFolder)

      do shell script ("screencapture -x -R${offsetX},${offsetY},${width},${height} " & dFolder & "/" & "frame-" & ${portionId} & ".png")
    `);
  }

  getAppNameForActiveWindow(): Promise<string> {
    Logger.log('debug', `[APPLE-MANAGER] getting app name.`, {
      tags: 'applescript,name',
    });

    return runAppleScript(`
      tell application "System Events"
        return (name of application processes whose frontmost is true) as string
      end tell
    `);
  }

  async resizeWindow(): Promise<void> {
    Logger.log('debug', `[APPLE-MANAGER] resizing window.`, {
      tags: 'applescript,resize',
    });

    await runAppleScript(`
      tell application "Finder"
        set screenSize to bounds of window of desktop
        set screenHeight to item 4 of screenSize
      end tell

      tell application "${this.appName}"
        set theBounds to bounds of front window

        set bounds of front window to {item 1 of theBounds, 0, (item 1 of theBounds) + ${this.windowWidth}, screenHeight}
      end tell
      delay 0.25
    `);
  }

  async prepareWindow() {
    await runAppleScript(`
      tell application "Finder"
        set screenSize to bounds of window of desktop
        set screenHeight to item 4 of screenSize
      end tell

      tell application "${this.appName}"
        set theBounds to bounds of front window

        set bounds of front window to {item 1 of theBounds, 0, (item 1 of theBounds) + ${this.windowWidth}, screenHeight}
      end tell

      delay 0.25

      tell application "finder"
        set screensize to bounds of window of desktop
        set screenwidth to item 3 of screensize
      end tell
      tell application "system events"
        set myfrontmost to name of first item of (processes whose frontmost is true)
      end tell
      try
        tell application myfrontmost
          set windowsize to bounds of window 1
          set windowxl to item 1 of windowsize
          set windowyt to item 2 of windowsize
          set windowxr to item 3 of windowsize
          set windowyb to item 4 of windowsize

          set windowwidth to windowxr - windowxl

          set bounds of window 1 to {(screenwidth - windowwidth) / 2.0, 0, (screenwidth + windowwidth) / 2.0, (windowyb - windowyt)}
        end tell
      end try
    `);
  }

  scrollTop(): Promise<void> {
    return this.scroll({ to: this.topMostScrollPosition });
  }

  async getWindowCount(): Promise<number> {
    return +(await runAppleScript(`
      tell application "${this.appName}"
        return count of (every window where visible is true)
      end tell
    `));
  }
}

export default AppleScriptManager;
