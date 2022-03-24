import { runAppleScript } from "run-applescript";
import fs from "fs";

import { buildScreenshot } from "./BuildScreenshot.js";
import Logger from "./Logger.js";
import * as errors from "./errors.js";
import { TOP_MOST_SCROLL_POSITION, WINDOW_WIDTH } from "./constants.js";
import { wait } from "./utils.js";

// Fixed chunk to scroll to prevent running into ui elements like rounded corners and inner shadows.
const CHUNK_TO_SCROLL = 550;

// Fixed heigt dimensions to capture to prevent running into ui elements.
const SCREENSHOT_HEIGHT = 600;

export const centerWindow = () => {
  return runAppleScript(`
    tell application \"Finder\"
      set screenSize to bounds of window of desktop
      set screenWidth to item 3 of screenSize
    end tell
    tell application \"System Events\"
      set myFrontMost to name of first item of (processes whose frontmost is true)
    end tell
    try
      tell application myFrontMost
        set windowSize to bounds of window 1
        set windowXl to item 1 of windowSize
        set windowYt to item 2 of windowSize
        set windowXr to item 3 of windowSize
        set windowYb to item 4 of windowSize

        set windowWidth to windowXr - windowXl

        set bounds of window 1 to {(screenWidth - windowWidth) / 2.0, 0, (screenWidth + windowWidth) / 2.0, (windowYb - windowYt)}
      end tell
    end try
  `);
};

/**
 * Activate Mail application.
 */
export const activateMailApp = async () => {
  Logger.debug("Activating Mail application.");
  return await runAppleScript(`
    tell application "Mail"
       if not running then
          run
          delay 0.25
       end if
       activate
    end tell

    tell application "System Events"
       tell application process "Mail"
          set frontmost to true
       end tell
    end tell
  `);
};

/**
 * Check whether the Mail application is running
 */
const getIsMailAppRunning = async () => {
  const result = await runAppleScript(`
    return application "Mail" is running
  `);

  return result === "true";
};

/**
 * Quits the Mail app to prevent excessive memory consumption.
 */
export const quitMailApp = async () => {
  return await runAppleScript(`
    tell application "Mail"
      quit
    end tell
  `);
};

/**
 * Return the scroll dimensions of the active Mail Window's scrolling object.
 *
 * @return {Promise<array>} a list of integers representing the dimensions of the window
 * in the format (xPosition, YPosition, width, height).
 */
const getScrollDimensions = async () => {
  return (
    await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        set theSize to size of group 1 of scroll area 1 of front window
        set thePosition to position of scroll area 1 of front window

        return thePosition & theSize
      end tell
    end tell
  `)
  )
    .split(", ")
    .map((item) => +item);
};

/**
 * Return the header height of the active Mail Window's header object.
 *
 * @return {Promise<number>} the heather height in pixels.
 */
const getHeaderHeight = async () => {
  const result = await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        set theSize to size of group 1 of group 1 of scroll area 1 of window 1
        set height to item 2 of theSize
        return height
      end tell
    end tell
  `);

  return +result;
};

/**
 * Return the dimensions of the entire screen.
 *
 * @return {Promise<array>} a list of integers representing the dimensions of the window
 * in the format (xPosition, YPosition, width, height).
 */
const getWindowDimensions = async () => {
  return (
    await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        set theSize to size of scroll area 1 of front window
        set thePosition to position of scroll area 1 of front window

        return thePosition & theSize
      end tell
    end tell
  `)
  )
    .split(", ")
    .map((item) => +item);
};

/**
 * Move the cursor to the bottom to prevent mousover events
 *
 * @return {Promise<Void>}
 */
const moveCursorToBottom = async () => {
  Logger.debug("Moving Cursor to Bottom");
  return await runAppleScript(`
    do shell script "cliclick m:" & "0,9999"
  `);
};

/**
 * Scroll to the specified position.
 *
 * @param {Number} to - the new position to scroll to in a percentage from 0.0 to 1.0.
 */
const scroll = async ({ to: newPosition }) => {
  Logger.debug(`Scrolling to: ${newPosition}`);
  return await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        set value of scroll bar 1 of scroll area 1 of front window to ${newPosition}
      end tell
    end tell
  `);
};

/**
 * Closes the front most window for the Mail process.
 */
export const closeWindow = async () => {
  return await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        click button 1 of window 1
      end tell
    end tell
  `);
};

/**
 * Opens the test at the specified path.
 *
 * @param {String} at - the path to the filesystem where the EMl file is located.
 */
export const openTest = async ({ at }) => {
  if (!fs.existsSync(at)) {
    Logger.debug(`No EML file found at ${at}`);
    throw new error(errors.NO_EML_FILE_AVAILABLE);
  }

  Logger.debug("Opening Test");
  return await runAppleScript(`
    tell application "Mail"
      set download html attachments to true
      open ("${at}" as POSIX file)
    end tell
  `);
};

const captureScreenPortion = async ({
  portionId,
  offsetX,
  offsetY,
  height,
  width,
}) => {
  Logger.debug(`
    Capturing Screen Area:
    (${offsetX}, ${offsetY}, ${width}, ${height})
  `);
  return await runAppleScript(`
    set dFolder to "~/Documents/applemail/temp-captures/"

    do shell script ("mkdir -p " & dFolder)

    do shell script ("screencapture -x -R${offsetX},${offsetY},${width},${height} " & dFolder & "frame-" & ${portionId} & ".png")
  `);
};

/**
 * Get the Application name for the front most active window.
 */
const getAppNameForActiveWindow = async () => {
  return runAppleScript(`
    tell application "System Events"
      return (name of application processes whose frontmost is true) as string
    end tell
  `);
};

/**
 * Resize the window to a fied width.
 *
 * @return {Promise<Void>}
 */
export const resizeWindow = async () => {
  Logger.debug("Resizing Window");
  return runAppleScript(`
    tell application "Finder"
      set screenSize to bounds of window of desktop
      set screenHeight to item 4 of screenSize
    end tell

    tell application "Mail"
      set theBounds to bounds of front window

      set bounds of front window to {item 1 of theBounds, 0, (item 1 of theBounds) + ${WINDOW_WIDTH}, screenHeight}
    end tell
  `);
};

/**
 * Scroll to the top of the test.
 */
const scrollTop = () => {
  Logger.debug("Scrolling to the Top of the Screen");
  scroll({ to: TOP_MOST_SCROLL_POSITION });
};

/**
 * Scroll to remove the header of the test.
 *
 * @param {Number} headerHeight - the header height dimension.
 * @param {Number} scrollHeight - the total scrolling height.
 * @param {Number} windowHeight - the window height visible on the screen.
 *
 */
const scrollHeader = ({ headerHeight, scrollHeight, windowHeight }) => {
  Logger.debug("Scrolling down to remove the header area.");
  const scrollPosition = convertPixelsToScrollPosition({
    pixelsToConvert: headerHeight,
    totalHeight: scrollHeight,
    pageHeight: windowHeight,
  });

  scroll({ to: scrollPosition });
};

/**
 * count the total of visible windows on the mail app.
 *
 * @return {Promise<number>} a promise resolving with the number of windows.
 */
export const getWindowCount = async () => {
  return +(await runAppleScript(`
    tell application "Mail"
      return count of (every window where visible is true)
    end tell
  `));
};

/**
 * Check whether the Mail application is currently the front most active app.
 *
 * @return {Promise<boolean>} whether it is active.
 */
const checkIsMailAppActive = async () => {
  Logger.debug("Checking if Mail App is active and at the front.");
  const activeAppName = await getAppNameForActiveWindow();

  if (activeAppName !== "Mail") {
    throw new Error(errors.WINDOW_NOT_PRESENT);
  }
};

const getOffset = () => {
  return SCREENSHOT_HEIGHT - CHUNK_TO_SCROLL;
};

/**
 * Scroll position in Mail windows is percentage based
 * starting at 0.0 which is the topmost potition and going all the way
 * down to 1.0.
 * This function computes the equivalent in percentage of a number of pixels to scroll down.
 *
 * @param {Number} chunkToScroll - the height to scroll down.
 * @param {Number} pageHeight - the visible page height.
 * @param {Number} totalHeight - the total frame scrolling height.
 *
 * @return {Number} the scrolling position equivalent between 0.0 and 1.0.
 */
const convertPixelsToScrollPosition = ({
  pixelsToConvert,
  totalHeight,
  pageHeight,
}) => {
  Logger.debug(`
    Converting Pixels to Scroll Position
    Pixels To convert: ${pixelsToConvert}
    Total Height: ${totalHeight}
    Window Height: ${pageHeight}
  `);

  return (pixelsToConvert * 100) / (totalHeight - pageHeight) / 100;
};

/**
 * Compute the dimensions for the next scrolling portion.
 *
 * @param {Number} windowX - the window position on the x axis.
 * @param {Number} windowY - the window position on the y axis.
 * @param {Number} windowHeight - the window height.
 * @param {Number} windowWidth - the window width.
 * @param {Number} scrollHeight - the total scrolling height.
 * @param {Number} scrollY - the scrolling web view position on the y axis.
 * @param {Number} scrollIteration - the current scrolling step.
 *
 * @return {Object} containing the offsetX and height dimensiong.
 */
const computeNextScreenshotDimensions = ({
  windowX,
  windowY,
  windowHeight,
  windowWidth,
  scrollHeight,
  scrollY,
  scrollIteration,
  capturedPixels,
  scrollPosition,
}) => {
  Logger.debug(`
    Current Scroll Iteration: ${scrollIteration}
  `);

  Logger.debug(`
  total: ${scrollHeight}
  captured: ${capturedPixels}
    `);

  const isLastPage = scrollPosition >= 1;

  const isFirstPage = scrollIteration === 1;

  if (isFirstPage) {
    return {
      height: SCREENSHOT_HEIGHT,
      width: windowWidth,
      y: scrollY,
      x: windowX,
    };
  }

  if (isLastPage) {
    Logger.debug(`
    Last Portion
    `);

    const height = scrollHeight - capturedPixels;

    return {
      height: height,
      width: windowWidth,
      x: windowX,
      y: windowY + (windowHeight - height),
    };
  }

  return {
    height: SCREENSHOT_HEIGHT,
    width: windowWidth,
    y: scrollY + getOffset(),
    x: windowX,
  };
};

async function main(filePath) {
  let scrollIteration = 1;
  let capturedPixels = 0;
  let scrollPosition = TOP_MOST_SCROLL_POSITION;
  let scrolledPixels = 0;

  Logger.debug(">>>>>> Starting <<<<<<");

  const windowCount = await getWindowCount();

  if (windowCount > 1) {
    await closeWindow();
  }

  const isMailAppRunning = await getIsMailAppRunning();

  Logger.debug(`Mail App is ${isMailAppRunning ? "running" : "not running"}`);

  if (!isMailAppRunning) {
    await activateMailApp();
    wait({ seconds: 3 });
  }

  await openTest({ at: filePath });

  wait({ seconds: 2 });

  await checkIsMailAppActive();

  const [windowX, windowY, windowWidth, windowHeight] =
    await getWindowDimensions();

  Logger.debug(`
    Window Dimensions:
    (${windowX}, ${windowY}, ${windowWidth}, ${windowHeight})
  `);

  const [scrollX, scrollY, scrollWidth, scrollHeight] =
    await getScrollDimensions();

  Logger.debug(`
    Scroll Dimensions
    (${scrollX}, ${scrollY}, ${scrollWidth}, ${scrollHeight})
  `);

  const headerHeight = await getHeaderHeight();

  Logger.debug(`
    Header Height: ${headerHeight}
  `);

  const noScrollNeeded = windowHeight === scrollHeight;

  Logger.debug(`
    ${noScrollNeeded ? "No" : ""} Scroll Needed.
  `);

  if (noScrollNeeded) {
    await moveCursorToBottom();

    await captureScreenPortion({
      offsetX: windowX,
      offsetY: windowY + headerHeight,
      width: windowWidth,
      height: windowHeight - headerHeight,
      portionId: scrollIteration,
    });
  } else {
    const totalPixelsToCapture = scrollHeight - headerHeight;
    Logger.debug(`
    Total Pixels to Capture: ${totalPixelsToCapture}
    `);

    scrollTop();

    wait({ milliseconds: 200 });

    scrollHeader({
      headerHeight,
      windowHeight,
      scrollHeight,
    });

    scrolledPixels += headerHeight;
    Logger.debug(
      `Added ${headerHeight} pixels to the scrolledPixels count, new count is: ${scrolledPixels}`
    );

    wait({ milliseconds: 400 });

    while (capturedPixels < totalPixelsToCapture) {
      Logger.debug(`
    Captured Pixels: ${capturedPixels} -- Total Pixels To Capture: ${totalPixelsToCapture}
    `);

      const nextDimensions = computeNextScreenshotDimensions({
        windowX,
        windowY,
        windowHeight,
        windowWidth,
        scrollHeight: totalPixelsToCapture,
        scrollY,
        headerHeight,
        scrollIteration,
        capturedPixels,
        scrollPosition,
      });

      await checkIsMailAppActive();

      await moveCursorToBottom();

      await captureScreenPortion({
        offsetX: nextDimensions.x,
        offsetY: nextDimensions.y,
        width: nextDimensions.width,
        height: nextDimensions.height,
        portionId: scrollIteration,
      });

      if (scrollIteration > 1) {
        scrolledPixels += 50;
        Logger.debug(
          `Added 50 pixels to the scrolledPixels count, new count is: ${scrolledPixels}`
        );
      }

      capturedPixels += SCREENSHOT_HEIGHT;
      Logger.debug(
        `Added ${SCREENSHOT_HEIGHT} pixels to the capturedPixels count, new count is: ${capturedPixels}`
      );

      if (capturedPixels > scrollHeight || scrollHeight === windowHeight) {
        Logger.debug(
          `Captured pixels exceeded total scrolling height, ${capturedPixels}`
        );
        capturedPixels = scrollHeight;
        Logger.debug(`Setting captured pixels to ${totalPixelsToCapture}`);
      }

      Logger.debug(`
    Captured Pixels before scrolling: ${capturedPixels}
    `);

      const needToScroll = scrollPosition < 1;

      if (needToScroll) {
        scrolledPixels += CHUNK_TO_SCROLL;

        scrollPosition = convertPixelsToScrollPosition({
          pixelsToConvert: scrolledPixels,
          totalHeight: scrollHeight,
          pageHeight: windowHeight,
        });

        await scroll({ to: scrollPosition });

        scrollIteration += 1;

        wait({ milliseconds: 300 });
      } else {
        break;
      }
    }
  }

  Logger.debug(`
    Captured Pixels after looping: ${capturedPixels}
  `);

  closeWindow();

  return buildScreenshot(headerHeight);
}

export default {
  main,
};
