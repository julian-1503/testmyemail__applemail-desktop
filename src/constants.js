// Email Header height to be removed, since this is already present on the application frame.
export const HEADER_HEIGHT = {
  768: 90,
  900: 180,
};

// Pixels that need to be chopped from the partial image.
export const COMPENSATION_PIXELS = {
  768: 1,
  900: 5,
};

// The screenshot suffix for the different image sizes.
export const SCREENSHOT_SUFFIX = {
  smallThumbnail: "_tn",
  largeThumbnail: "_thumb",
  fullScreenshot: "",
};

// The guid regular expression to extract the different parts.
export const GUID_REGEX =
  /^((\d{4}-\d{2}-\d{2})_(((\d+)_(\d+)(_(\d+))?)(_no_images)?)_([a-zA-Z]{2,4}))/;

// The starting scroll position is 0 for Mail window apps.
export const TOP_MOST_SCROLL_POSITION = 0;
