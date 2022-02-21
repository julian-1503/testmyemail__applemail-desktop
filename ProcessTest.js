import { runAppleScript } from "run-applescript";

import { buildScreenshot } from "./BuildScreenshot.js";

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

const getWindowDimensions = async () => {
  return (
    await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        return value of attribute "AXFrame" of scroll area 1 of window 1
      end tell
    end tell
  `)
  )
    .split(", ")
    .map((item) => +item);
};

const toggleFullScreenMode = async () => {
  return await runAppleScript(`
    tell application "System Events"
        keystroke "f" using {command down, control down}
    end tell

    delay 1
  `);
};

const getWindowId = async () => {
  return await runAppleScript(`
    tell app "Mail" to id of window 1
  `);
};

const scrollDown = async (scrollTo) => {
  return await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        set value of scroll bar 1 of scroll area 1 of front window to ${scrollTo}
      end tell
    end tell

    delay 1
  `);
};

const closeWindow = async () => {
  return await runAppleScript(`
    tell application "System Events"
      tell process "Mail"
        click button 1 of window 1
      end tell
    end tell
  `);
};

const getNumberOfScrolls = (scrollHeight, windowHeight) => {
  return scrollHeight > windowHeight
    ? Math.floor(scrollHeight / windowHeight)
    : 0;
};

export async function processTest(filePath) {
  await runAppleScript(`
    tell application "Mail"
      set download html attachments to true
      open ("${filePath}" as POSIX file)
    end tell
    delay 2
  `);

  await toggleFullScreenMode();

  const [scrollX, scrollY, scrollWidth, scrollHeight] =
    await getScrollDimensions();

  const [windowX, windowY, windowWidth, windowHeight] =
    await getWindowDimensions();

  const scrollTimes = getNumberOfScrolls(scrollHeight, windowHeight);

  const windowId = await getWindowId();

  let scrolledTimes = 0;

  await runAppleScript(`
    set dFolder to "~/Documents/applemail/temp-captures/"

    do shell script ("mkdir -p " & dFolder)

    do shell script ("screencapture -x -l${windowId} -o -S " & dFolder & "frame-" & ${scrolledTimes} & ".png")
  `);

  while (scrolledTimes < scrollTimes) {
    const compensationPixels = scrollTimes > 1 ? 12 : 0;
    const times = scrolledTimes + 1;
    const scrollTo =
      (windowHeight * 100) /
      (scrollHeight + compensationPixels - windowHeight) /
      100;

    await scrollDown(scrollTo * times);

    scrolledTimes += 1;

    if (scrolledTimes === scrollTimes) {
      const subtractionPixels = scrollTimes > 1 ? 6 : 0;
      const lastSegmentSize = scrollHeight - windowHeight * scrolledTimes;

      const lastStartingPoint =
        windowHeight - lastSegmentSize - subtractionPixels;

      const remainingHeight = Math.abs(
        scrollHeight - windowHeight * scrolledTimes
      );

      await runAppleScript(`
        set dFolder to "~/Documents/applemail/temp-captures/"

        do shell script ("screencapture -x -R0,${lastStartingPoint},${windowWidth},${remainingHeight} " & dFolder & "frame-" & ${scrolledTimes} & ".png")
      `);
    } else {
      await runAppleScript(`
        set dFolder to "~/Documents/applemail/temp-captures/"

        do shell script ("screencapture -x -R0,4,${windowWidth},${windowHeight} " & dFolder & "frame-" & ${scrolledTimes} & ".png")
      `);
    }
  }

  await toggleFullScreenMode();

  await closeWindow();

  const screenshot = await buildScreenshot(windowWidth, windowHeight);

  return screenshot;
}
