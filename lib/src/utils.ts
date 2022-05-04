import axios from 'axios';
import { spawn } from 'child_process';
import { curry } from 'ramda';

import envSchema from '@applemail/config/src/envSchema';
import { ScreenshotSuffix, Zones } from './types';

export const joinURL = (base: string, add: string) => {
  return base.split('/').concat(add.split('/')).filter(Boolean).join('/');
};

/**
 * inform the dots app about the server status.
 */
export const checkInWithHome = (clientId: string, endpoint: string) => {
  const endpointURL = new URL(endpoint);
  const pathName = joinURL(endpointURL.pathname, String(clientId));
  const fullEndpoint = new URL(pathName, endpointURL.origin).href;

  return axios.get(fullEndpoint);
};

export const validateEnv = (env: Record<string, unknown>) => {
  const { error } = envSchema.validate(env);

  if (error && error.details.length) {
    throw new Error(`[Environment Error]: ${error.details[0].message}`);
  }
};

export const removeLineBreaks = (text: string): string => {
  return text.replace(/\r?\n|\r/g, '');
};

export const runAppleScript = (script: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const child = spawn('osascript', ['-e', script]);

    child.stdout.on('data', (data) => {
      resolve(removeLineBreaks(data.toString('utf8')));
    });

    child.stderr.on('data', (data) => {
      reject(removeLineBreaks(data.toString('utf8')));
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve('');
      }
    });
  });
};

export const getFileName = curry(
  (
    guid: string,
    ssGuid: string,
    clientFolder: string,
    imgFormat: string,
    zone: Zones,
    suffix: ScreenshotSuffix
  ) => {
    const hasImageBlock = guid.indexOf('_no_images') >= 0;

    return `${zone}/${ssGuid}/${clientFolder}${suffix}${
      hasImageBlock ? '_no_images' : ''
    }.${imgFormat}`;
  }
);
