'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X,  AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileAccepted: (file: File) => void;
  isUploading?: boolean;
}

export function FileUploader({ onFileAccepted, isUploading = false }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileAccepted(file);
    }
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={cn(
          "relative group overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out cursor-pointer",
          "bg-white/5 backdrop-blur-xl hover:bg-white/10 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60",
          isDragActive ? "border-blue-500 bg-blue-50/10 dark:bg-blue-900/20" : "border-zinc-300 dark:border-zinc-700",
          isDragReject ? "border-red-500 bg-red-50/10 dark:bg-red-900/20" : "",
          isUploading ? "opacity-60 cursor-not-allowed" : ""
        )}
      >
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center z-10 relative">
          <input {...getInputProps()} />
          
          <div className="mb-6 relative">
            <div className={cn(
              "absolute inset-0 bg-blue-500 blur-2xl rounded-full opacity-0 transition-opacity duration-500",
              isDragActive && "opacity-40"
            )} />
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-zinc-800 dark:to-zinc-900 p-4 rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-700 transform transition-transform group-hover:-translate-y-2 group-hover:scale-105 duration-300 relative z-10">
              <UploadCloud className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2 font-sans tracking-tight">
            {isDragActive ? "Drop the file here..." : "Upload POS Sales Data"}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[250px] mx-auto leading-relaxed">
            Drag and drop your Excel (.xlsx) or CSV file here, or click to browse.
          </p>

          {isDragReject && (
            <div className="mt-4 flex items-center text-red-500 text-sm font-medium animate-pulse">
              <AlertCircle className="w-4 h-4 mr-1.5" />
              File type not supported
            </div>
          )}
        </div>
      </div>

      {selectedFile && (
        <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md border border-white/20 dark:border-zinc-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl shrink-0">
              <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="truncate pr-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          
          <div className="flex items-center shrink-0">
            {isUploading ? (
              <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                aria-label="Remove file"
              >
                <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
