/* @immutable-test — Written Red-first on: 2026-05-23. NEVER MODIFY after first GREEN. */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SalesImportPage from '../../../app/sales/import/page';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    channel: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    removeChannel: vi.fn(),
  },
}));

// Mock global fetch
global.fetch = vi.fn();

describe('SalesImportPage Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, batchId: 'batch-123' }),
    });
  });

  it('should successfully upload a file to Supabase Storage and then call the NestJS API', async () => {
    // Setup Storage upload mock success
    (supabase.storage.from('sales_raw_uploads').upload as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { path: 'uuid-123.xlsx' },
      error: null,
    });

    render(<SalesImportPage />);

    // Check if uploader is present
    const dropzoneInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(dropzoneInput).toBeInTheDocument();

    // Create a dummy excel file
    const file = new File(['dummy content'], 'Prehľad predaja.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Simulate file drop
    await act(async () => {
      fireEvent.change(dropzoneInput, { target: { files: [file] } });
    });

    // Verify Supabase Storage upload was called correctly
    await waitFor(() => {
      expect(supabase.storage.from).toHaveBeenCalledWith('sales_raw_uploads');
      expect(supabase.storage.from('sales_raw_uploads').upload).toHaveBeenCalledWith(
        expect.stringContaining('.xlsx'),
        file,
        expect.any(Object)
      );
    });

    // Verify API call was made to NestJS backend
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/sales/upload', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('uuid-123.xlsx'),
      }));
    });

    // Verify successful upload UI state
    await waitFor(() => {
      expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      // It should revert to ready state
      expect(screen.getByText('Upload POS Sales Data')).toBeInTheDocument();
    });
  });

  it('should handle API failure correctly and show an error', async () => {
    // Setup Storage upload mock success
    (supabase.storage.from('sales_raw_uploads').upload as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { path: 'uuid-fail.xlsx' },
      error: null,
    });

    // Mock API failure
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Invalid file format' }),
    });

    render(<SalesImportPage />);

    const dropzoneInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'bad.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    await act(async () => {
      fireEvent.change(dropzoneInput, { target: { files: [file] } });
    });

    // Wait for the error alert/toast (assuming we render the error text)
    await waitFor(() => {
      expect(screen.getByText('Invalid file format')).toBeInTheDocument();
    });
  });
});
