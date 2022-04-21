import path from 'path';
import chokidar, { FSWatcher } from 'chokidar';
import { Watching } from './types';

class Watcher implements Watching {
  private screenshotDir: string;

  private watcher?: FSWatcher;

  constructor(screenshotDir: string) {
    this.screenshotDir = screenshotDir;
  }

  watch() {
    this.watcher = chokidar.watch(
      path.join(this.screenshotDir, '**/meta.json'),
      {
        persistent: true,
      }
    );

    return this;
  }

  handleTestAdded(callback: (ssGuid: string) => void) {
    this.watcher?.on('add', (path) => {
      callback(path);
    });

    return this;
  }

  handleTestRemoved(callback: (ssGuid: string) => void) {
    this.watcher?.on('unlink', (path) => {
      callback(path);
    });

    return this;
  }
}

export default Watcher;
