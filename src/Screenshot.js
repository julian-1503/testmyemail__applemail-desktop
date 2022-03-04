import { runAppleScript } from "run-applescript";
import sleep from "sleep";

import { buildScreenshot } from "./BuildScreenshot.js";
import Logger from "./Logger.js";
import * as errors from "./errors.js";
import { TOP_MOST_SCROLL_POSITION } from "./constants.js";

// Starting form Monterey version -
// Apple decided to include a inner shadow to the top of the window
// that activates as soon as you start scrolling
const SHADOW_HEIGHT = 5;

/**
 * Activate Mail application.
 */
export const activateMailApp = async () => {
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
        return value of attribute "AXFrame" of group 1 of scroll area 1 of window 1
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
        return size of scroll area 1 of window 1
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
  return await runAppleScript(`
    do shell script "cliclick m:" & "0,9999"
  `);
};

/**
 * Toggle Full Screen for the front most Mail window.
 */
const toggleFullScreenMode = async () => {
  return await runAppleScript(`
    tell application "System Events"
        keystroke "f" using {command down, control down}
    end tell
  `);
};

/**
 * Scroll to the specified position.
 *
 * @param {Number} to - the new position to scroll to in a percentage from 0.0 to 1.0.
 */
const scroll = async ({ to: newPosition }) => {
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
const closeWindow = async () => {
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
const openTest = async ({ at }) => {
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
 * Check whether the Mail application is currently the front most active app.
 *
 * @return {Promise<boolean>} whether it is active.
 */
const checkIsMailAppActive = async () => {
  const activeAppName = await getAppNameForActiveWindow();

  if (activeAppName !== "Mail") {
    throw new Error(errors.WINDOW_NOT_PRESENT);
  }
};

/**
 * Scroll position in Mail windows is percentage based
 * starting at 0.0 which is the topmost potition and going all the way
 * down to 1.0.
 * This function computes the equivalent in percentage of a number of pixels to scroll down.
 *
 * @param {Number} windowHeight - the screen height.
 * @param {Number} scrollHeight - the total frame scrolling height.
 * @param {Number} currentScrollPosition - the current scroll position.
 *
 * @return {Number} the scrolling position equivalent between 0.0 and 1.0.
 */
const convertPixelsToScrollPosition = ({
  windowHeight,
  scrollHeight,
  currentScrollPosition,
}) => {
  const screenHeightPixelsToPercentage =
    ((windowHeight - SHADOW_HEIGHT) * 100) /
    (scrollHeight - windowHeight) /
    100;

  return screenHeightPixelsToPercentage + currentScrollPosition;
};

/**
 * Compute the dimensions for the next scrolling portion.
 *
 * @param {Number} scrollHeight - the total scrolling height.
 * @param {Number} windowHeight - the total screen height.
 * @param {Number} currentScrollIteration - the current scrolling step.
 *
 * @return {Object} containing the offsetX and height dimensiong.
 */
const computeNextScreenshotDimensions = ({
  scrollHeight,
  windowHeight,
  headerHeight,
  currentScrollIteration,
}) => {
  Logger.debug(`
    Current Scroll Iteration: ${currentScrollIteration}
  `);
  const noScrollNeeded = windowHeight === scrollHeight;

  if (noScrollNeeded) {
    return {
      height: windowHeight - headerHeight,
      offsetY: headerHeight,
    };
  }

  const isFirstIteration = currentScrollIteration === 1;

  const pixelsToRemove = isFirstIteration ? headerHeight : 0;

  const isLastPage = windowHeight * currentScrollIteration > scrollHeight;

  if (isLastPage) {
    const height = scrollHeight - windowHeight * (currentScrollIteration - 1);

    return {
      height: height,
      offsetY: windowHeight - height,
    };
  } else {
    return {
      height: windowHeight - pixelsToRemove,
      offsetY: pixelsToRemove + SHADOW_HEIGHT,
    };
  }
};

async function main(filePath) {
  const isMailAppRunning = await getIsMailAppRunning();

  if (!isMailAppRunning) {
    await activateMailApp();
    sleep.sleep(3);
  }

  await openTest({ at: filePath });

  sleep.msleep(500);

  await checkIsMailAppActive();

  await toggleFullScreenMode();

  sleep.sleep(1);

  const [windowWidth, windowHeight] = await getWindowDimensions();

  Logger.debug(`
    Window Dimensions:
    (${windowWidth}, ${windowHeight})
  `);

  const [scrollX, scrollY, scrollWidth, scrollHeight] =
    await getScrollDimensions();

  Logger.debug(`
    Scroll Dimensions
    (${scrollX}, ${scrollY}, ${scrollWidth}, ${scrollHeight})
  `);

  const headerHeight = await getHeaderHeight();

  let currentScrollIteration = 1;

  let capturedPixels = 0;

  let currentScrollPosition = TOP_MOST_SCROLL_POSITION;

  while (capturedPixels < scrollHeight) {
    Logger.debug(`Captured Pixels: ${capturedPixels}`);
    const nextDimensions = computeNextScreenshotDimensions({
      scrollHeight,
      windowHeight,
      headerHeight,
      currentScrollIteration,
    });

    Logger.debug(`
      Next Screenshot Dimensions
      (height: ${nextDimensions.height}, offsetX: ${nextDimensions.offsetY})
    `);

    await checkIsMailAppActive();

    await moveCursorToBottom();

    await captureScreenPortion({
      offsetX: 0,
      offsetY: nextDimensions.offsetY,
      width: windowWidth,
      height: nextDimensions.height,
      portionId: currentScrollIteration,
    });

    capturedPixels += windowHeight;

    if (capturedPixels > scrollHeight) {
      capturedPixels = scrollHeight;
    }

    const needToScroll = capturedPixels < scrollHeight;

    if (needToScroll) {
      const nextScrollingPosition = convertPixelsToScrollPosition({
        windowHeight,
        scrollHeight,
        currentScrollPosition,
      });

      await scroll({ to: nextScrollingPosition });

      currentScrollPosition = nextScrollingPosition;

      currentScrollIteration += 1;

      sleep.msleep(200);
    }
  }

  Logger.debug(`Captured Pixels: ${capturedPixels}`);

  await toggleFullScreenMode();

  sleep.msleep(500);

  await closeWindow();

  const screenshot = await buildScreenshot(headerHeight);

  return screenshot;
}

export default {
  main,
};
