import { Module, Global } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { LEDGER_SERVICE_TOKEN } from '../sales/interfaces/i-ledger.service';
import { STORAGE_SERVICE_TOKEN } from '../sales/interfaces/i-storage.service';
import * as WebSocket from 'ws';

const mockLedgerService = {
  record: async (trx: any, entry: any) => {
    // TODO: remove when InventoryModule is wired
  },
};

@Global()
@Module({
  providers: [
    {
      provide: 'SUPABASE_ADMIN_CLIENT',
      useFactory: () => {
        // Fix for Node.js 20 lacking native WebSocket support
        if (typeof globalThis.WebSocket === 'undefined') {
          (globalThis as any).WebSocket = WebSocket;
        }
        
        return createClient(
          process.env.SUPABASE_URL || 'http://localhost:54321',
          process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-key'
        );
      },
    },
    {
      provide: 'DB_CLIENT',
      useFactory: () => {
        return new Kysely({
          dialect: new PostgresDialect({
            pool: new Pool({
              connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
            }),
          }),
        });
      },
    },
    {
      provide: LEDGER_SERVICE_TOKEN,
      useValue: mockLedgerService,
    },
    {
      provide: STORAGE_SERVICE_TOKEN,
      useFactory: (supabase: any) => ({
        downloadFile: async (path: string) => {
          const { data, error } = await supabase.storage.from('sales_raw_uploads').download(path);
          if (error) throw error;
          const buffer = Buffer.from(await data.arrayBuffer());
          const tempPath = `/tmp/${path.split('/').pop()}`;
          require('fs').writeFileSync(tempPath, buffer);
          return tempPath;
        }
      }),
      inject: ['SUPABASE_ADMIN_CLIENT']
    },
  ],
  exports: [
    'SUPABASE_ADMIN_CLIENT',
    'DB_CLIENT',
    LEDGER_SERVICE_TOKEN,
    STORAGE_SERVICE_TOKEN,
  ],
})
export class CoreModule {}

