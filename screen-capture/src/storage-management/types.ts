import { Zones } from '@applemail/lib/src/types';

export interface StorageFetching {
  connect: ({
    port,
    host,
    database,
  }: {
    port: number;
    host: string;
    database: number;
  }) => Promise<void>;

  getTest: ({ from }: { from: string }) => Promise<EmailTest>;

  saveTest: ({ test, to }: { test: EmailTest; to: string }) => Promise<void>;
}

export interface EmailTest {
  content: string;
  zone: Zones;
  test_guid: string;
  guid: string;
}
