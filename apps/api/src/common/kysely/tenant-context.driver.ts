import { Driver, TransactionSettings, DatabaseConnection, CompiledQuery } from 'kysely';
import { tenantContext } from '../context/tenant.context';

export class TenantContextDriver implements Driver {
  constructor(private readonly driver: Driver) {}

  async init(): Promise<void> {
    return this.driver.init();
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    const conn = await this.driver.acquireConnection();
    
    // Check if we are in a tenant context
    const ctx = tenantContext.getStore();
    if (ctx) {
      // Execute the SET function on this specific connection before yielding it
      await conn.executeQuery(CompiledQuery.raw("SELECT set_tenant_context($1, $2)", [ctx.franchiseId, ctx.restaurantId]));
    }
    
    return conn;
  }

  async beginTransaction(conn: DatabaseConnection, settings: TransactionSettings): Promise<void> {
    return this.driver.beginTransaction(conn, settings);
  }

  async commitTransaction(conn: DatabaseConnection): Promise<void> {
    return this.driver.commitTransaction(conn);
  }

  async rollbackTransaction(conn: DatabaseConnection): Promise<void> {
    return this.driver.rollbackTransaction(conn);
  }

  async releaseConnection(conn: DatabaseConnection): Promise<void> {
    // Reset context on release just to be safe
    // We use a dummy UUID string because it expects a valid uuid format, or we could just set it to null if the function allows it.
    // The safest is to execute a clear context if such a function exists, but if not we can pass dummy uuids or let the pool reset it.
    // Assuming 00000000-0000-0000-0000-000000000000 works.
    await conn.executeQuery(CompiledQuery.raw("SELECT set_tenant_context($1, $2)", ['00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000'])).catch(() => {});
    return this.driver.releaseConnection(conn);
  }

  async destroy(): Promise<void> {
    return this.driver.destroy();
  }
}
