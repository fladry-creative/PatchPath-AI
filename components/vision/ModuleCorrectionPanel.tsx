'use client';

import React, { useState, useEffect } from 'react';
import { type VisionModule } from '@/lib/vision/rack-analyzer';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const moduleSchema = z.object({
  name: z.string().min(1, 'Module name is required'),
  manufacturer: z.string().optional(),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface ModuleCorrectionPanelProps {
  module: VisionModule;
  moduleIndex: number;
  onSave: (updatedModule: VisionModule, index: number) => void;
  onDelete: (index: number) => void;
  onCancel: () => void;
}

export function ModuleCorrectionPanel({
  module,
  moduleIndex,
  onSave,
  onDelete,
  onCancel,
}: ModuleCorrectionPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: module.name,
      manufacturer: module.manufacturer || '',
      confidence: module.confidence,
      notes: module.notes || '',
    },
  });

  // Reset form when module changes
  useEffect(() => {
    reset({
      name: module.name,
      manufacturer: module.manufacturer || '',
      confidence: module.confidence,
      notes: module.notes || '',
    });
  }, [module, reset]);

  const onSubmit = async (data: ModuleFormData) => {
    setIsSaving(true);
    try {
      const updatedModule: VisionModule = {
        ...module,
        name: data.name,
        manufacturer: data.manufacturer || module.manufacturer,
        confidence: data.confidence,
        notes: data.notes || module.notes,
      };
      onSave(updatedModule, moduleIndex);
    } catch (error) {
      console.error('Error saving module correction:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(moduleIndex);
    } else {
      setShowDeleteConfirm(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return { color: 'text-green-400', bg: 'bg-green-500/20', label: 'High Confidence' };
    } else if (confidence >= 0.5) {
      return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Medium Confidence' };
    } else {
      return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Low Confidence' };
    }
  };

  const confidenceBadge = getConfidenceBadge(module.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Edit Module #{moduleIndex + 1}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${confidenceBadge.bg} ${confidenceBadge.color}`}
            >
              {confidenceBadge.label}: {Math.round(module.confidence * 100)}%
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Module Name */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-200">
            Module Name <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register('name')}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            placeholder="e.g., Maths, Plaits, Rings"
          />
          {errors.name ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </div>
          ) : null}
        </div>

        {/* Manufacturer */}
        <div>
          <label htmlFor="manufacturer" className="mb-2 block text-sm font-semibold text-slate-200">
            Manufacturer
          </label>
          <input
            id="manufacturer"
            type="text"
            {...register('manufacturer')}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            placeholder="e.g., Make Noise, Mutable Instruments"
          />
        </div>

        {/* Confidence Adjustment */}
        <div>
          <label htmlFor="confidence" className="mb-2 block text-sm font-semibold text-slate-200">
            Confidence Level
          </label>
          <div className="flex items-center gap-3">
            <input
              id="confidence"
              type="range"
              min="0"
              max="1"
              step="0.05"
              {...register('confidence', { valueAsNumber: true })}
              className="flex-1"
            />
            <span className="w-12 text-right text-sm font-medium text-white">
              {Math.round((module.confidence || 0) * 100)}%
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Adjust if you&apos;re certain about this identification
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="mb-2 block text-sm font-semibold text-slate-200">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={2}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 focus:outline-none"
            placeholder="Any additional observations or corrections..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving || !isDirty}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
              showDeleteConfirm
                ? 'border-2 border-red-500 bg-red-500/20 text-red-300 hover:bg-red-500/30'
                : 'border border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-500/50 hover:bg-red-500/20'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {showDeleteConfirm ? 'Confirm Delete?' : 'Delete'}
          </button>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
          <p className="text-xs text-blue-300">
            💡 Your corrections help improve our AI&apos;s accuracy! All changes are saved to help
            train better module identification.
          </p>
        </div>
      </form>
    </motion.div>
  );
}
