'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadZoneProps {
  onImageUploaded: (file: File, preview: string) => void;
  onError: (error: string) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

export function ImageUploadZone({
  onImageUploaded,
  onError,
  maxSizeMB = 10,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
}: ImageUploadZoneProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) {
        onError('Please upload a valid image file (JPG, PNG, or WebP)');
        return;
      }

      const file = acceptedFiles[0];

      // Validate file size before processing
      const fileSizeMB = file.size / 1024 / 1024;
      if (fileSizeMB > maxSizeMB) {
        onError(
          `File size must be less than ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(1)}MB`
        );
        return;
      }

      try {
        setIsCompressing(true);

        // Compress image if it's large
        let processedFile = file;
        if (fileSizeMB > 2) {
          const options = {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
          };
          processedFile = await imageCompression(file, options);
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(processedFile);
        setPreview(previewUrl);
        setFileName(file.name);
        setFileSize(formatFileSize(processedFile.size));

        // Notify parent component
        onImageUploaded(processedFile, previewUrl);
      } catch (error) {
        console.error('Image compression error:', error);
        onError('Failed to process image. Please try again.');
      } finally {
        setIsCompressing(false);
      }
    },
    [maxSizeMB, onError, onImageUploaded]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce(
      (acc, format) => ({
        ...acc,
        [format]: [],
      }),
      {}
    ),
    maxFiles: 1,
    disabled: isCompressing,
  });

  const clearImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setFileName(null);
    setFileSize(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div
              {...getRootProps()}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 ${isDragActive && !isDragReject ? 'scale-[1.02] border-purple-500 bg-purple-500/10' : ''} ${isDragReject ? 'border-red-500 bg-red-500/10' : ''} ${!isDragActive && !isDragReject ? 'border-white/20 bg-black/20 hover:border-purple-500/50 hover:bg-purple-500/5' : ''} ${isCompressing ? 'pointer-events-none opacity-50' : ''} `}
            >
              <input {...getInputProps()} />

              {/* Background gradient effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-pink-600/0 to-purple-600/0 transition-all duration-500 group-hover:from-purple-600/5 group-hover:via-pink-600/5 group-hover:to-purple-600/5" />

              <div className="relative z-10">
                {isCompressing ? (
                  <>
                    <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-300/20 border-t-purple-300" />
                    <p className="text-lg font-semibold text-white">Compressing image...</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Optimizing for fast vision analysis
                    </p>
                  </>
                ) : isDragActive && !isDragReject ? (
                  <>
                    <Upload className="mx-auto mb-4 h-16 w-16 text-purple-400 transition-transform duration-300 group-hover:scale-110" />
                    <p className="text-lg font-semibold text-white">Drop your rack photo here!</p>
                    <p className="mt-2 text-sm text-slate-400">
                      We&apos;ll identify all modules with AI vision
                    </p>
                  </>
                ) : isDragReject ? (
                  <>
                    <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-400" />
                    <p className="text-lg font-semibold text-red-300">Invalid file type</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Only JPG, PNG, and WebP images are accepted
                    </p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="mx-auto mb-4 h-16 w-16 text-slate-400 transition-all duration-300 group-hover:scale-110 group-hover:text-purple-400" />
                    <p className="text-lg font-semibold text-white">Drag & drop your rack photo</p>
                    <p className="mt-2 text-sm text-slate-400">or click to browse files</p>
                    <div className="mt-6 space-y-2">
                      <p className="text-xs text-slate-500">Accepted formats: JPG, PNG, WebP</p>
                      <p className="text-xs text-slate-500">
                        Maximum size: {maxSizeMB}MB (auto-compressed if needed)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4"
          >
            {/* Preview Image */}
            <div className="relative mb-4 overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Rack preview"
                className="h-auto w-full object-contain"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* File Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{fileName}</p>
                <p className="mt-1 text-xs text-slate-400">Size: {fileSize}</p>
              </div>

              <button
                type="button"
                onClick={clearImage}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 transition-all hover:border-red-500/50 hover:bg-red-500/20"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success Message */}
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <p className="text-sm text-green-300">Image ready for analysis</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
