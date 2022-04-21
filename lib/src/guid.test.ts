import 'reflect-metadata';
import Guid, { GuidExpressable } from './guid';
import { GUID_REGEX } from '@applemail/config/src/constants';

const guid = '2021-10-12_125_736335_142314_api';

describe('guid', () => {
  let guidInstance: GuidExpressable;
  beforeEach(() => {
    guidInstance = new Guid(guid);
  });

  describe('getZone', () => {
    test('return the zone from the guid', () => {
      const result = guidInstance.getZone();

      expect(result).toBe('api');
    });
  });

  describe('getDate', () => {
    test('return the date from the guid', () => {
      const result = guidInstance.getDate();

      expect(result).toBe('2021-10-12');
    });
  });

  describe('getTime', () => {
    test('return the time from the guid', () => {
      const result = guidInstance.getTime();

      expect(result).toBe('14:23:14');
    });
  });

  describe('getMemberId', () => {
    test('return the member id from the guid', () => {
      const result = guidInstance.getMemberId();

      expect(result).toBe('125');
    });
  });

  describe('hasImageBlocking', () => {
    test('return whether the test includes image blocking', () => {
      const result = guidInstance.hasImageBlocking();

      expect(result).toBe('');
    });

    test('return whether the test includes image blocking', () => {
      const guidWithImageBlocking =
        '2021-10-12_125_736335_142314_api_no_images';

      const guidI = new Guid(guidWithImageBlocking);
      const result = guidI.hasImageBlocking();

      expect(result).toBe('Y');
    });
  });
});
