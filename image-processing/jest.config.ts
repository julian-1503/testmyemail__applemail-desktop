import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  testMatch: ['**/?(*.)+(spec|test).ts'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};

export default config;
