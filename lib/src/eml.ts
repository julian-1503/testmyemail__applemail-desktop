import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'inversify';
import { EmailTest } from '@applemail/screen-capture/src/storage-management/types';
import { TYPES } from '@applemail/config/src/inversify.types';

@injectable()
class EML implements EmlExpressable {
  private _test?: EmailTest;
  private _path = '';

  constructor(@inject(TYPES.EmlPath) path: string) {
    this._path = path;
  }

  setTest(test: EmailTest) {
    this._test = test;
    return this;
  }

  async toEML() {
    if (!this._test) {
      throw new Error('No test provided');
    }

    const { content } = this._test;

    await fs.promises.mkdir(this._path, { recursive: true });

    const decoded = Buffer.from(content, 'base64').toString('utf8');

    return fs.promises.writeFile(this.getPath(), decoded);
  }

  async deleteEML() {
    if (!this._test) {
      throw new Error('No test provided');
    }

    await fs.promises.unlink(this.getPath());
  }

  getPath() {
    if (!this._test) {
      throw new Error('No test provided');
    }

    return path.join(this._path, this.getName());
  }

  private getName() {
    return this._test?.test_guid + '.eml';
  }
}

export interface EmlExpressable {
  setTest: (test: EmailTest) => EmlExpressable;
  toEML: () => Promise<void>;
  deleteEML: () => Promise<void>;
  getPath: () => string;
}

export default EML;
