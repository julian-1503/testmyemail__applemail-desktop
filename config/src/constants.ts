import os from 'os';
import path from 'path';

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
  smallThumbnail: '_tn',
  largeThumbnail: '_thumb',
  fullScreenshot: '',
};

// The guid regular expression to extract the different parts.
export const GUID_REGEX =
  /^((\d{4}-\d{2}-\d{2})_(((\d+)_(\d+)(_(\d+))?)(_no_images)?)_([a-zA-Z]{2,4}))/;

// The starting scroll position is 0 for Mail window apps.
export const TOP_MOST_SCROLL_POSITION = 0;

//  Check In with home interval.
export const CHECK_INTERVAL = 6000;

// Fixed window width. Inherited from legacy application.
export const WINDOW_WIDTH = 1048;

// Fixed chunk to scroll to prevent running into ui elements like rounded corners and inner shadows.
export const CHUNK_TO_SCROLL = 550;

// Fixed heigt dimensions to capture to prevent running into ui elements.
export const SCREENSHOT_HEIGHT = 600;

export const SCREENSHOT_FOLDER = path.join(
  os.homedir(),
  'Documents',
  'applemail',
  'temp-captures'
);

export const EML_PATH = path.join(
  os.homedir(),
  'Documents',
  'applemail',
  'eml'
);

export const AWS_REGION = 'us-east-1';

export const AWS_ACL = 'public-read';

export const AWS_CONTENT_ENCODING = 'base64';

export const AWS_STORAGE_CLASS = 'REDUCED_REDUNDANCY';

export const IMAGE_FORMAT = 'png';
