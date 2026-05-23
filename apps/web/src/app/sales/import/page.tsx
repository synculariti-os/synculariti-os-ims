'use client';

import React, { useState } from 'react';
import { FileUploader } from '@/components/ui/file-uploader';
import { BatchesTable } from '@/components/sales/batches-table';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { FileUp, Info } from 'lucide-react';

export default function SalesImportPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `raw/${fileName}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from('sales_raw_uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) {
        throw new Error(storageError.message || 'Failed to upload to storage');
      }

      // 2. Call NestJS API to register batch
      const restaurantId = 'default-rest-id'; // In a real app, this comes from TenantContext
      
      const response = await fetch('/api/sales/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Usually pass the auth token here, but mocking for now
        },
        body: JSON.stringify({
          restaurantId,
          filePath: storageData.path,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to register batch. Please try again.');
      }

    } catch (error: unknown) {
      console.error('Upload Error:', error);
      const msg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="mb-10 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <FileUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              POS Imports
            </h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg">
            Upload your end-of-day sales reports from the Point of Sale system. Our engine will automatically process the recipes and deduct the correct inventory.
          </p>
        </header>

        {/* Upload Zone */}
        <section className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-3xl border border-white/20 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-0 -left-10 w-40 h-40 bg-blue-400/10 dark:bg-blue-600/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
          <div className="absolute bottom-0 -right-10 w-40 h-40 bg-emerald-400/10 dark:bg-emerald-600/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten pointer-events-none" />
          
          <FileUploader 
            onFileAccepted={handleFileUpload} 
            isUploading={isUploading} 
          />

          {errorMessage && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start animate-in fade-in slide-in-from-top-2">
              <Info className="w-5 h-5 text-red-500 mr-2 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed font-medium">
                {errorMessage}
              </p>
            </div>
          )}
        </section>

        {/* Realtime Table Zone */}
        <section>
          <BatchesTable />
        </section>

      </div>
    </div>
  );
}
