import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('audit_log')
    .renameColumn('old_value', 'request_payload')
    .execute();

  await db.schema.alterTable('audit_log')
    .renameColumn('new_value', 'response_payload')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('audit_log')
    .renameColumn('request_payload', 'old_value')
    .execute();

  await db.schema.alterTable('audit_log')
    .renameColumn('response_payload', 'new_value')
    .execute();
}
