import J from 'joi';
import { LoggerLevels } from '@applemail/lib/src/types';
import { Environments } from './types';

const schema = J.object({
  NODE_ENV: J.string().valid(...Object.values(Environments)),
  SERVER_ID: J.number().required(),
  EMAIL_ADDRESS: J.string().required(),
  UPLOAD_USER: J.string().required(),
  UPLOAD_PASSWORD: J.string().required(),
  PROVISION_URL: J.string().uri().required(),
  LOG_LEVEL: J.string().valid(...Object.values(LoggerLevels)),
}).unknown(true);

export default schema;
