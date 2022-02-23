import { runAppleScript } from "run-applescript";

import { buildScreenshot } from "./BuildScreenshot.js";

import * as errors from "./errors.js";

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

    delay 1
  `);
};

/**
 * Request the Window process ID.
 */
const getWindowId = async () => {
  return await runAppleScript(`
    tell app "Mail" to id of window 1
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

    delay 1
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
    delay 2
  `);
};

/**
 * Capture the top portion of the screen and save it to the file system.
 *
 * @param {Number} for - the Window process identifier.
 * @param {Number} fragmentNumber - the fragment portion of the entire screenshot.
 *
 */
const captureTop = async ({ for: windowId }) => {
  return await runAppleScript(`
    set dFolder to "~/Documents/applemail/temp-captures/"

    do shell script ("mkdir -p " & dFolder)

    do shell script ("screencapture -x -l${windowId} -o -S " & dFolder & "frame-" & 0 & ".png")
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
 * Get the front most application window count.
 */
const getWindowCountForMailApp = async () => {
  return runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        return count of windows
      end tell
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
  const mailAppWindowCount = await getWindowCountForMailApp();

  if (activeAppName !== "Mail") {
    throw new Error(errors.WINDOW_NOT_PRESENT);
  }

  if (+mailAppWindowCount !== 1) {
    throw new Error(errors.WRONG_NUMBER_OF_WINDOWS);
  }
};

/**
 * Compute the minimum number of necessary scrolls to get to the bottom of the page.
 *
 * @param {Number} scrollHeight - the total scrolling height of the frame.
 * @param {Number} windowHeight - the screen height.
 *
 * @return {Number} the number of iterations.
 */
const getNumberOfScrolls = (scrollHeight, windowHeight) => {
  return scrollHeight > windowHeight
    ? Math.floor(scrollHeight / windowHeight)
    : 0;
};

/**
 * Scroll position in Mail windows is percentage based
 * starting at 0.0 which is the topmost potition and going all the way
 * down to 1.0.
 * This function computes the equivalent in percentage of a number of pixels to scroll down.
 *
 * @param {Number} windowHeight - the screen height.
 * @param {Number} scrollHeight - the total frame scrolling height.
 * @param {Number} totalScrollIterations - the required number of scrolls to get to the bottom.
 * @param {Number} currentScrollIteration - the portion of the total scrolling area we are currently in.
 *
 * @return {Number} the scrolling position equivalent between 0.0 and 1.0.
 */
const convertPixelsToScrollPosition = ({
  windowHeight,
  scrollHeight,
  totalScrollIterations,
  currentScrollIteration,
}) => {
  const offsetPixelsToRemove = totalScrollIterations > 1 ? 12 : 0;

  const percentageEquivalentFromPixels =
    (windowHeight * 100) /
    (scrollHeight + offsetPixelsToRemove - windowHeight) /
    100;

  const nextIterationMultiplier = currentScrollIteration + 1;

  return percentageEquivalentFromPixels * nextIterationMultiplier;
};

async function main(filePath) {
  const [windowX, windowY, windowWidth, windowHeight] =
    await getWindowDimensions();

  await moveCursorToBottom(windowHeight);

  await openTest({ at: filePath });

  await toggleFullScreenMode();

  const [scrollX, scrollY, scrollWidth, scrollHeight] =
    await getScrollDimensions();

  const totalScrollIterations = getNumberOfScrolls(scrollHeight, windowHeight);

  const windowId = await getWindowId();

  let currentScrollIteration = 0;

  await checkIsMailAppActive();

  await captureTop({ for: windowId });

  while (currentScrollIteration < totalScrollIterations) {
    const nextScrollingPosition = convertPixelsToScrollPosition({
      windowHeight,
      scrollHeight,
      currentScrollIteration,
      totalScrollIterations,
    });

    await scroll({ to: nextScrollingPosition });

    currentScrollIteration += 1;

    const isLastPortion = currentScrollIteration === totalScrollIterations;

    if (isLastPortion) {
      const subtractionPixels = totalScrollIterations > 1 ? 6 : 0;
      const lastSegmentSize =
        scrollHeight - windowHeight * currentScrollIteration;

      const offsetY = windowHeight - lastSegmentSize - subtractionPixels;

      const lastPortionHeight = Math.abs(
        scrollHeight - windowHeight * currentScrollIteration
      );

      await checkIsMailAppActive();

      await captureScreenPortion({
        offsetX: 0,
        offsetY,
        width: windowWidth,
        height: lastPortionHeight,
        portionId: currentScrollIteration,
      });
    } else {
      await checkIsMailAppActive();

      await captureScreenPortion({
        offsetX: 0,
        offsetY: 4,
        width: windowWidth,
        height: windowHeight,
        portionId: currentScrollIteration,
      });
    }
  }

  await toggleFullScreenMode();

  await closeWindow();

  const screenshot = await buildScreenshot(windowWidth, windowHeight);

  return screenshot;
}

export default {
  main,
};
