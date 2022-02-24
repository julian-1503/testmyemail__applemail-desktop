import os from "os";
import mockFs from "mock-fs";
import fs from "fs";
import { jest } from "@jest/globals";
import { getRootFolder, createEMLFile } from "./utils.js";
import rimraf from "rimraf";

describe("Utils Module", () => {
  beforeEach(() => {
    jest.spyOn(os, "homedir").mockImplementation(() => "/root/");
    jest.spyOn(rimraf, "sync").mockImplementation(() => {});
  });

  afterEach(() => {
    mockFs.restore();
  });

  describe("getRootFolder", () => {
    test("Return the path to the correct folder", () => {
      // setup
      const expectedPath = "/Documents/applemail";

      mockFs({
        "/root/Documents/appleMail": {},
      });

      // act
      const result = getRootFolder();

      // assert
      expect(result.includes(expectedPath)).toEqual(true);
    });
  });

  describe("createEMLFile", () => {
    test("", () => {
      //setup
      const name = "test.eml";
      const content = "test content";
      const expectedPath = `/root/Documents/applemail/eml/${name}`;
      mockFs({
        "/root/Documents/applemail": {},
      });

      //act
      createEMLFile(name, content);

      //assert
      expect(fs.existsSync(expectedPath)).toBe(true);
    });
  });
});
