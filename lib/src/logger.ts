import winston, { createLogger, format, transports } from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';

const NODE_ENV = process.env.NODE_ENV || 'development';

const { combine, timestamp, colorize } = format;

const logger = createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp()),
    }),
  ],
});

var config = {
  logGroupName: `Client(${process.env.CLIENT})--ServerID(${process.env.SERVER_ID})`,
  logStreamName: NODE_ENV,
  createLogGroup: true,
  createLogStream: true,
  formatLog: (item: { level: string; message: string; meta: object }) =>
    `${item.level}: ${item.message} ${JSON.stringify(item.meta)}`,
};

if (NODE_ENV == 'production' || NODE_ENV == 'stage')
  logger.add(new CloudWatchTransport({ ...config }));

logger.level = process.env.LOG_LEVEL || 'silly';

export default logger;
