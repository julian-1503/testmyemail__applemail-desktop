import 'reflect-metadata';
import os from 'os';
import mockFs from 'mock-fs';
import Chance from 'chance';
import fs from 'fs';
import EML, { EmlExpressable } from './eml';
import { EmailTest } from '@applemail/screen-capture/src/storage-management/types';

const chance = new Chance();

describe('EML', () => {
  let eml: EmlExpressable;

  beforeEach(() => {
    jest.spyOn(os, 'homedir').mockImplementation(() => '/root/');
    eml = new EML('/root/Documents/applemail/eml');
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe('toEML', () => {
    test('throw error if no test is provided', async () => {
      await expect(eml.toEML()).rejects.toThrowError('No test provided');
    });

    test('create the eml file at the correct path', async () => {
      //setup
      const test_guid = chance.guid();
      const content = chance.string();
      const test = { content, test_guid } as EmailTest;
      const expectedPath = `/root/Documents/applemail/eml/${test_guid}.eml`;
      mockFs({
        '/root/Documents/applemail': {},
      });

      //act
      await eml.setTest(test).toEML();

      //assert
      expect(fs.existsSync(expectedPath)).toBe(true);
    });
  });

  describe('deleteEML', () => {
    test('throw error if no test is provided', async () => {
      await expect(eml.deleteEML()).rejects.toThrowError('No test provided');
    });

    test('delete the eml file at the correct path', async () => {
      //setup
      const test_guid = chance.guid();
      const content = chance.string();
      const test = { content, test_guid } as EmailTest;
      const name = `${test_guid}.eml`;
      const expectedPath = `/root/Documents/applemail/eml/${name}`;
      mockFs({
        '/root/Documents/applemail': {
          eml: {
            [name]: content,
          },
        },
      });

      expect(fs.existsSync(expectedPath)).toBe(true);

      //act
      await eml.setTest(test).deleteEML();

      //assert
      expect(fs.existsSync(expectedPath)).toBe(false);
    });
  });

  describe('getPath', () => {
    test('throw error if no test is defined', () => {
      expect(() => eml.getPath()).toThrowError('No test provided');
    });

    test('return the full path to the EML file', () => {
      const test_guid = chance.guid();
      const content = chance.string();
      const test = { content, test_guid } as EmailTest;
      const name = `${test_guid}.eml`;
      const expectedPath = `/root/Documents/applemail/eml/${name}`;

      const path = eml.setTest(test).getPath();

      expect(path).toEqual(expectedPath);
    });
  });
});
