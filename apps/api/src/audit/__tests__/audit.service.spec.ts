// @immutable-test — Written Red-first. NEVER MODIFY after first GREEN.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { AuditService } from '../audit.service';
import type { AuditEntryDto } from '@ims/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDb = {
  insertInto: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue(undefined),
  selectFrom: vi.fn().mockReturnThis(),
  selectAll: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  executeTakeFirst: vi.fn().mockResolvedValue(null),
};

const RESTAURANT_ID = 'rest-uuid-001' as never;

const SAMPLE_AUDIT_ENTRY: AuditEntryDto = {
  userId: 'user-uuid-001',
  userEmail: 'test@example.com',
  action: 'POST /inventory/counts',
  entityType: 'inventory_counts',
  entityId: 'batch-001',
  requestPayload: { quantity: 10 },
  responsePayload: { id: 'batch-001' },
  success: true,
  restaurantId: RESTAURANT_ID,
  franchiseGroupId: 'fg-uuid-001',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset the db mock chain for each test
    mockDb.insertInto.mockReturnThis();
    mockDb.values.mockReturnThis();
    mockDb.execute.mockResolvedValue(undefined);
    mockDb.selectFrom.mockReturnThis();
    mockDb.selectAll.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.offset.mockReturnThis();

    service = new AuditService(mockDb as never);
  });

  describe('log()', () => {
    it('should insert an audit entry into the audit_log table', async () => {
      await service.log(SAMPLE_AUDIT_ENTRY);

      expect(mockDb.insertInto).toHaveBeenCalledWith('audit_log');
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          user_email: 'test@example.com',
          action: 'POST /inventory/counts',
          entity_type: 'inventory_counts',
          entity_id: 'batch-001',
          success: true,
          restaurant_id: RESTAURANT_ID,
        }),
      );
      expect(mockDb.execute).toHaveBeenCalledOnce();
    });

    it('should NOT throw if the DB insert fails — audit must never break the business transaction', async () => {
      mockDb.execute.mockRejectedValueOnce(new Error('DB connection lost'));

      // Must not throw
      await expect(service.log(SAMPLE_AUDIT_ENTRY)).resolves.toBeUndefined();
    });

    it('should map null fields correctly when optional fields are absent', async () => {
      const minimalEntry: AuditEntryDto = {
        ...SAMPLE_AUDIT_ENTRY,
        errorMessage: undefined,
        sourceIp: undefined,
        userAgent: undefined,
      };

      await service.log(minimalEntry);

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          error_message: null,
          source_ip: null,
          user_agent: null,
        }),
      );
    });

    it('should set success=false and errorMessage when an error entry is logged', async () => {
      await service.log({
        ...SAMPLE_AUDIT_ENTRY,
        success: false,
        errorMessage: 'Not found',
      });

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error_message: 'Not found',
        }),
      );
    });
  });

  describe('listLogs()', () => {
    it('should query audit_log filtered by restaurantId with limit and offset', async () => {
      const mockLogs = [{ id: '1', action: 'POST /items' }];
      mockDb.execute.mockResolvedValueOnce(mockLogs);

      const result = await service.listLogs(RESTAURANT_ID, 20, 0);

      expect(mockDb.selectFrom).toHaveBeenCalledWith('audit_log');
      expect(mockDb.where).toHaveBeenCalledWith('restaurant_id', '=', RESTAURANT_ID);
      expect(mockDb.limit).toHaveBeenCalledWith(20);
      expect(mockDb.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findLogById()', () => {
    it('should return the log entry when found', async () => {
      const mockLog = { id: 'log-001', action: 'DELETE /items/1' };
      mockDb.executeTakeFirst.mockResolvedValueOnce(mockLog);

      const result = await service.findLogById('log-001');

      expect(mockDb.where).toHaveBeenCalledWith('id', '=', 'log-001');
      expect(result).toEqual(mockLog);
    });

    it('should return null when the log entry is not found', async () => {
      mockDb.executeTakeFirst.mockResolvedValueOnce(undefined);

      const result = await service.findLogById('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
