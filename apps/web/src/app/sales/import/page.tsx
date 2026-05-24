'use client';

import React, { useState } from 'react';
import { FileUploader } from '@/components/ui/file-uploader';
import { BatchesTable } from '@/components/sales/batches-table';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { FileUp, Info } from 'lucide-react';

export default function SalesImportPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { restaurantId } = useAuthStore();
  const router = useRouter();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
      } else if (!restaurantId) {
        // Logged in but no context selected, go back to login to select restaurant
        router.push('/login');
      }
    });
  }, [router, restaurantId]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Parse business date from filename or use today
      const match = file.name.match(/20\d{2}[01]\d[0123]\d/); // matches e.g. 20260504
      let businessDate = new Date().toISOString().split('T')[0];
      if (match) {
        const year = match[0].substring(0, 4);
        const month = match[0].substring(4, 6);
        const day = match[0].substring(6, 8);
        businessDate = `${year}-${month}-${day}`;
      }
      formData.append('businessDate', businessDate);
      
      // Call NestJS API using fetch directly to ensure headers are correctly set for FormData
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        router.push('/login');
        return;
      }

      if (!restaurantId) {
        throw new Error("No restaurant context selected. Please log in again.");
      }

      console.log('Using API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Sending request to:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sales-imports/upload`);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/sales-imports/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-restaurant-id': restaurantId
        },
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = response.statusText;
        try {
          const errData = await response.json();
          errorMsg = errData.message || errData.error?.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
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
