import { injectable } from 'inversify';
import { createClient, commandOptions } from 'redis';
import { EmailTest, StorageFetching } from './types';

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

    const next = await this.redisClient.blPop(
      commandOptions({ isolated: true }),
      from,
      3
    );

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
