import { injectable } from 'inversify';
import { createClient, commandOptions } from 'redis';
import { EmailTest, StorageFetching } from './types';
import Chance from 'chance';
import Logger from '@applemail/lib/src/logger';

@injectable()
class StorageService implements StorageFetching {
  private redisClient?: ReturnType<typeof createClient>;

  async connect({
    port,
    host,
    database,
  }: {
    port: number;
    host: string;
    database: number;
  }) {
    this.redisClient = createClient({
      socket: {
        port,
        host,
      },
      database,
    });

    await this.redisClient.connect();
  }

  async getTest({ from }: { from: string }) {
    if (!this.redisClient) {
      throw new Error('Not Connected To Source');
    }

    const number = new Chance().integer({ min: 0, max: 2 });

    if (number === 2) {
      throw new Error('simulating error');
    }

    const next = await this.redisClient.blPop(
      commandOptions({ isolated: true }),
      from,
      3
    );

    Logger.log('debug', '[STORAGE] Result from redis', {
      tags: 'storage,next',
      next,
    });

    const parsedTest = JSON.parse(next?.element ?? '');

    return parsedTest;
  }

  async saveTest({ test, to }: { test: EmailTest; to: string }) {
    if (!this.redisClient) {
      throw new Error('Not Conncted To Source');
    }

    await this.redisClient.rPush(to, JSON.stringify(test));
  }
}

export default StorageService;
