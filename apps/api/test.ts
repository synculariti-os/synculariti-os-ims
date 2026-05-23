import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const db = new Kysely<any>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: 'postgresql://postgres.puqvitdgaaiutxuvlfss:nJ9pBszF65mGz1cR@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
    }),
  }),
});

async function main() {
  try {
    const [{ count }] = await db
      .selectFrom('items')
      .select(({ fn }) => fn.count<number>('id').as('count'))
      .execute();
    console.log({ count });
  } catch (err) {
    console.error('Kysely error:', err);
  } finally {
    await db.destroy();
  }
}
main();
