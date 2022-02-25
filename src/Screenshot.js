import { runAppleScript } from "run-applescript";
import sleep from "sleep";

import { buildScreenshot } from "./BuildScreenshot.js";

import * as errors from "./errors.js";

import { TOP_MOST_SCROLL_POSITION } from "./constants.js";

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
 * @return {Array} a list of integers representing the dimensions of the window
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
 * Return the dimensions of the entire screen.
 *
 * @return {Array} a list of integers representing the dimensions of the window
 * in the format (xPosition, YPosition, width, height).
 */
const getWindowDimensions = async () => {
  return (
    await runAppleScript(`
    tell application "Finder"
      return bounds of window of desktop
    end tell
  `)
  )
    .split(", ")
    .map((item) => +item);
};

/**
 * Move the cursor to the bottom to prevent mousover events
 *
 * @param {Number} windowHeight - the screen height.
 */
const moveCursorToBottom = async (windowHeight) => {
  return await runAppleScript(`
    do shell script "cliclick m:" & "0,${windowHeight}"
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
 * @return {Boolean} whether it is active.
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
    (windowHeight * 100) / (scrollHeight - windowHeight) / 100;

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
const computeNextHeight = ({
  scrollHeight,
  windowHeight,
  currentScrollIteration,
}) => {
  if (windowHeight === scrollHeight) {
    return {
      height: windowHeight,
      offsetY: 0,
    };
  }

  if (windowHeight * currentScrollIteration > scrollHeight) {
    const height = scrollHeight - windowHeight * (currentScrollIteration - 1);
    return {
      height,
      offsetY: windowHeight - height,
    };
  } else {
    const compensationPixels = currentScrollIteration === 1 ? 0 : 1;
    return {
      height: windowHeight - compensationPixels,
      offsetY: compensationPixels,
    };
  }
};

async function main(filePath) {
  const isMailAppRunning = await getIsMailAppRunning();

  if (!isMailAppRunning) {
    await activateMailApp();
    sleep.sleep(3);
  }

  const [windowX, windowY, windowWidth, windowHeight] =
    await getWindowDimensions();

  await moveCursorToBottom(windowHeight);

  await openTest({ at: filePath });

  sleep.sleep(1);

  await checkIsMailAppActive();

  await toggleFullScreenMode();

  sleep.sleep(2);

  const [scrollX, scrollY, scrollWidth, scrollHeight] =
    await getScrollDimensions();

  let currentScrollIteration = 1;

  let capturedPixels = 0;

  let currentScrollPosition = TOP_MOST_SCROLL_POSITION;

  while (capturedPixels < scrollHeight) {
    const nextDimensions = computeNextHeight({
      scrollHeight,
      windowHeight,
      currentScrollIteration,
    });

    await checkIsMailAppActive();

    await moveCursorToBottom(windowHeight);

    await captureScreenPortion({
      offsetX: 0,
      offsetY: nextDimensions.offsetY,
      width: windowWidth,
      height: nextDimensions.height,
      portionId: currentScrollIteration,
    });

    capturedPixels += windowHeight;

    if (capturedPixels < scrollHeight) {
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

  await toggleFullScreenMode();

  sleep.sleep(1);

  await closeWindow();

  const screenshot = await buildScreenshot(windowWidth, windowHeight);

  return screenshot;
}

export default {
  main,
};
