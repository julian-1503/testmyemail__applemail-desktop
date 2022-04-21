import type { Config } from '@jest/types';
import Chance from 'chance';

const chance = new Chance();

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silly';
process.env.PROVISION_URL = chance.url();
process.env.EMAIL_ADDRESS = chance.email();
process.env.UPLOAD_USER = chance.guid();
process.env.UPLOAD_PASSWORD = chance.string();
process.env.SERVER_ID = `${chance.integer({ min: 1, max: 1000 })}`;
process.env.DEBUG = 'true';

export default config;
