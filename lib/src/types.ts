export enum LoggerLevels {
  error = 'error',
  warn = 'warn',
  info = 'info',
  http = 'http',
  verbose = 'verbose',
  debug = 'debug',
  silly = 'silly',
}

export enum ScreenshotSuffix {
  Thumbnail = '_tn',
  LargeThumbnail = '_thumb',
  Full = '',
}

export type Zones = 'web' | 'api' | 'capi';
