// @immutable-test
import { AuditInterceptor } from '../audit.interceptor';
import { IAuditService } from '../../../audit/interfaces/i-audit.service';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError, firstValueFrom } from 'rxjs';
import { setAuditBeforeState } from '../../utils/audit.utils';
import { vi, describe, it, expect, beforeEach, afterEach, Mocked } from 'vitest';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: Mocked<IAuditService>;
  let mockRequest: any;
  let mockExecutionContext: Mocked<ExecutionContext>;
  let mockCallHandler: Mocked<CallHandler>;

  beforeEach(() => {
    auditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    interceptor = new AuditInterceptor(auditService);

    mockRequest = {
      method: 'POST',
      route: { path: '/inventory/counts/:batchId/rows/:rowId' },
      url: '/inventory/counts/batch-1/rows/row-1',
      params: {},
      body: { quantity: 10 },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'test-agent' },
      user: {
        sub: 'user-1',
        email: 'test@example.com',
        restaurantId: 'rest-1',
        franchiseGroupId: 'fran-1',
      },
    };

    mockExecutionContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    mockCallHandler = {
      handle: vi.fn().mockReturnValue(of({ id: 'created-123' })),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should ignore GET requests', async () => {
    mockRequest.method = 'GET';
    await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('should extract entityId from response for POST requests', async () => {
    mockRequest.method = 'POST';
    mockRequest.params = {};
    mockRequest.route = { path: '/inventory/counts' };
    
    await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'POST /inventory/counts',
        entityType: 'inventory_counts', // granular entity type
        entityId: 'created-123', // extracted from response.id
        requestPayload: { quantity: 10 },
        success: true,
      })
    );
  });

  it('should extract entityId from response.data.id for POST requests if wrapped', async () => {
    mockRequest.method = 'POST';
    mockRequest.params = {};
    mockRequest.route = { path: '/inventory/counts' };
    mockCallHandler.handle.mockReturnValue(of({ data: { id: 'wrapped-123' } }));
    
    await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'wrapped-123',
      })
    );
  });

  it('should use request.params.id for PUT/PATCH/DELETE requests', async () => {
    mockRequest.method = 'PATCH';
    mockRequest.params = { id: 'param-123' };
    mockRequest.route = { path: '/inventory/transfers/:id' };
    
    await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'inventory_transfers',
        entityId: 'param-123',
        success: true,
      })
    );
  });

  it('should capture before state using setAuditBeforeState', async () => {
    mockRequest.method = 'PATCH';
    mockRequest.params = { id: 'param-123' };
    mockRequest.route = { path: '/inventory/transfers/:id' };
    
    const beforeState = { oldQuantity: 5 };
    setAuditBeforeState(mockRequest, beforeState);
    
    await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        requestPayload: beforeState, // instead of mockRequest.body
      })
    );
  });

  it('should log errors and set success to false', async () => {
    mockRequest.method = 'DELETE';
    mockRequest.params = { id: 'param-123' };
    mockRequest.route = { path: '/inventory/transfers/:id' };
    
    mockCallHandler.handle.mockReturnValue(throwError(() => new Error('Deletion failed')));
    
    try {
      await firstValueFrom(interceptor.intercept(mockExecutionContext, mockCallHandler));
    } catch (e) {}
    
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        errorMessage: 'Deletion failed',
      })
    );
  });
});
