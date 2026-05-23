import { Module, Global } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { LEDGER_SERVICE_TOKEN } from '../inventory/interfaces/i-ledger.service';
import { STORAGE_SERVICE_TOKEN } from '../sales/interfaces/i-storage.service';
import * as WebSocket from 'ws';
import * as fs from 'fs';
import { TenantContextDriver } from '../common/kysely/tenant-context.driver';

const mockLedgerService = {
  record: async (trx: unknown, entry: unknown) => {
    console.log('Mock LedgerService record called', { entry });
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
          (globalThis as unknown as Record<string, unknown>).WebSocket = WebSocket;
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
        const dialect = new PostgresDialect({
          pool: new Pool({
            connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:54322/postgres',
          }),
        });
        
        const originalDriver = dialect.createDriver();
        const driver = new TenantContextDriver(originalDriver);
        
        const customDialect = {
          createAdapter: () => dialect.createAdapter(),
          createDriver: () => driver,
          createIntrospector: (db: any) => dialect.createIntrospector(db),
          createQueryCompiler: () => dialect.createQueryCompiler(),
        };

        return new Kysely({ dialect: customDialect });
      },
    },
    {
      provide: LEDGER_SERVICE_TOKEN,
      useValue: mockLedgerService,
    },
    {
      provide: STORAGE_SERVICE_TOKEN,
      useFactory: (supabase: ReturnType<typeof createClient>) => ({
        downloadFile: async (path: string) => {
          const { data, error } = await supabase.storage.from('sales_raw_uploads').download(path);
          if (error) throw error;
          const buffer = Buffer.from(await data.arrayBuffer());
          const tempPath = `/tmp/${path.split('/').pop()}`;
          fs.writeFileSync(tempPath, buffer);
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

