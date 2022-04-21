import winston, { createLogger, format, transports } from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CloudWatchTransport = require('winston-aws-cloudwatch');

const { combine, timestamp, colorize } = format;

const NODE_ENV = process.env.NODE_ENV || 'development';

const logger = createLogger({
  levels: winston.config.syslog.levels,
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp()),
    }),
  ],
});

if (
  process.env.CLIENT &&
  process.env.SERVER_ID &&
  process.env.CLOUDWATCH_ACCESS_KEY &&
  process.env.CLOUDWATCH_SECRET_KEY &&
  process.env.CLOUDWATCH_REGION
) {
  logger.add(
    new CloudWatchTransport({
      name: 'applemail',
      logGroupName: `/email-previews/applemail/`,
      logStreamName: `${NODE_ENV}/${process.env.CLIENT}/server-${process.env.SERVER_ID}`,
      createLogStream: true,
      submissionInterval: 2000,
      submissionRetryCount: 1,
      batchSize: 20,
      formatLog: (item: {
        level: string;
        message: string;
        meta: Record<string, string>;
      }) => `${item.level}: ${item.message} ${JSON.stringify(item.meta)} `,
      awsConfig: {
        accessKeyId: process.env.CLOUDWATCH_ACCESS_KEY,
        secretAccessKey: process.env.CLOUDWATCH_SECRET_KEY,
        region: process.env.CLOUDWATCH_REGION,
      },
    })
  );
}

logger.level = process.env.LOG_LEVEL || 'silly';

logger.on('error', function (err) {
  console.error('Error writing to log', err.message);
});

export default logger;
