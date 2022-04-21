import axios from 'axios';
import AxiosMock from 'axios-mock-adapter';
import Chance from 'chance';
import { validateEnv, checkInWithHome, joinURL, runAppleScript } from './utils';

const chance = new Chance();
const axiosMock = new AxiosMock(axios);

describe('Utils Module', () => {
  describe('validateEnv', () => {
    test('require the server id', () => {
      const env = {};

      expect(() => validateEnv(env)).toThrowError('"SERVER_ID" is required');
    });

    test('require the email address', () => {
      const env = { SERVER_ID: chance.integer() };

      expect(() => validateEnv(env)).toThrowError(
        '"EMAIL_ADDRESS" is required'
      );
    });

    test('require the upload user', () => {
      const env = {
        SERVER_ID: chance.integer(),
        EMAIL_ADDRESS: chance.email(),
      };

      expect(() => validateEnv(env)).toThrowError('"UPLOAD_USER" is required');
    });

    test('require the upload password', () => {
      const env = {
        SERVER_ID: chance.integer(),
        EMAIL_ADDRESS: chance.email(),
        UPLOAD_USER: chance.string(),
      };

      expect(() => validateEnv(env)).toThrowError(
        '"UPLOAD_PASSWORD" is required'
      );
    });

    test('require the provision url', () => {
      const env = {
        SERVER_ID: chance.integer(),
        EMAIL_ADDRESS: chance.email(),
        UPLOAD_USER: chance.string(),
        UPLOAD_PASSWORD: chance.string(),
      };

      expect(() => validateEnv(env)).toThrowError(
        '"PROVISION_URL" is required'
      );
    });
  });

  describe('joinURL', () => {
    test('join path with ending slashes', () => {
      const base = 'a/b/';
      const add = '/c';
      const expected = 'a/b/c';

      const result = joinURL(base, add);
      expect(result).toEqual(expected);
    });

    test('join path with one side ending slashes', () => {
      const base = 'a/b/';
      const add = 'c';
      const expected = 'a/b/c';

      const result = joinURL(base, add);
      expect(result).toEqual(expected);
    });

    test('join path with neither side ending slashes', () => {
      const base = 'a/b';
      const add = 'c';
      const expected = 'a/b/c';

      const result = joinURL(base, add);
      expect(result).toEqual(expected);
    });

    test('join path with addition containing ending slashes', () => {
      const base = 'a/b';
      const add = 'c/';
      const expected = 'a/b/c';

      const result = joinURL(base, add);
      expect(result).toEqual(expected);
    });

    test('join path with multiple entries', () => {
      const base = 'a/b';
      const add = 'c/d';
      const expected = 'a/b/c/d';

      const result = joinURL(base, add);
      expect(result).toEqual(expected);
    });
  });

  describe('checkInWithHome', () => {
    test('check with home for the specified server id', async () => {
      const endpoint = chance.url();
      const clientId = chance.integer();

      axiosMock.onGet(`${endpoint}/${clientId}`).reply(200);

      const result = await checkInWithHome(`${clientId}`, endpoint);

      expect(result.status).toEqual(200);
    });
  });

  describe('runAppleScript', () => {
    test('calls apple script with the provided script', async () => {
      const script = 'return "result"';
      const result = await runAppleScript(script);

      expect(result).toEqual('result');
    });
  });

  describe('runAppleScript', () => {
    test('handles apple script error', async () => {
      const script = 'echo';
      try {
        await runAppleScript(script);
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toEqual(
            expect.stringContaining('The variable echo is not defined')
          );
        }
      }
    });
  });
});
