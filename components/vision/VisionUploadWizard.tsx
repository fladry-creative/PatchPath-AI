'use client';

import React, { useState } from 'react';
import { ImageUploadZone } from './ImageUploadZone';
import { BoundingBoxCanvas } from './BoundingBoxCanvas';
import { ModuleCorrectionPanel } from './ModuleCorrectionPanel';
import { type VisionModule, type RackVisionAnalysis } from '@/lib/vision/rack-analyzer';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Brain, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VisionUploadWizardProps {
  userId: string;
}

type Step = 'upload' | 'analyze' | 'review';

export function VisionUploadWizard({ userId }: VisionUploadWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<RackVisionAnalysis | null>(null);
  const [modules, setModules] = useState<VisionModule[]>([]);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUploaded = (file: File, preview: string) => {
    setUploadedFile(file);
    setImagePreview(preview);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile) {
      setError('Please upload an image first');
      return;
    }

    setError(null);
    setCurrentStep('analyze');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(uploadedFile);

      reader.onload = async () => {
        const base64Image = reader.result as string;
        const base64Data = base64Image.split(',')[1];

        // Call vision API
        const response = await fetch('/api/vision/analyze-rack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64Data,
            imageType: uploadedFile.type,
            userId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to analyze image');
        }

        setAnalysis(data.analysis);
        setModules(data.analysis.modules);
        setCurrentStep('review');

        // Celebrate!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      };

      reader.onerror = () => {
        throw new Error('Failed to read image file');
      };
    } catch (err) {
      console.error('Vision analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setCurrentStep('upload');
    }
  };

  const handleModuleSave = (updatedModule: VisionModule, index: number) => {
    const newModules = [...modules];
    newModules[index] = updatedModule;
    setModules(newModules);
    setSelectedModuleIndex(null);

    // Show success feedback
    confetti({
      particleCount: 50,
      spread: 40,
      origin: { y: 0.7 },
    });
  };

  const handleModuleDelete = (index: number) => {
    const newModules = modules.filter((_, i) => i !== index);
    setModules(newModules);
    setSelectedModuleIndex(null);
  };

  const handleGeneratePatch = () => {
    // TODO: Navigate to patch generation with modules data
    // For now, redirect to dashboard with success message
    window.location.href = '/dashboard?vision_upload_success=true';
  };

  const resetWizard = () => {
    setCurrentStep('upload');
    setUploadedFile(null);
    setImagePreview(null);
    setAnalysis(null);
    setModules([]);
    setSelectedModuleIndex(null);
    setError(null);
  };

  const steps = [
    { id: 'upload', label: 'Upload', icon: Upload, description: 'Upload rack photo' },
    { id: 'analyze', label: 'Analyze', icon: Brain, description: 'AI vision processing' },
    { id: 'review', label: 'Review', icon: CheckCircle, description: 'Review & correct' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="space-y-8">
      {/* Progress Steps */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = index < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                      isActive
                        ? 'border-purple-500 bg-purple-500/20 text-purple-400'
                        : isCompleted
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-white/20 bg-white/5 text-slate-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p
                    className={`mt-2 text-sm font-semibold ${
                      isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="mx-4 h-0.5 flex-1 bg-gradient-to-r from-white/20 to-white/20">
                    <div
                      className={`h-full transition-all duration-500 ${
                        index < currentStepIndex
                          ? 'bg-gradient-to-r from-green-500 to-green-500'
                          : 'bg-transparent'
                      }`}
                      style={{ width: index < currentStepIndex ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
          >
            {error}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ImageUploadZone onImageUploaded={handleImageUploaded} onError={setError} />

            {uploadedFile ? (
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetWizard}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-white/10"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600"
                >
                  Analyze with AI
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </motion.div>
        )}

        {currentStep === 'analyze' && (
          <motion.div
            key="analyze"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-white/10 bg-black/20 p-12 text-center"
          >
            <Brain className="mx-auto mb-6 h-16 w-16 animate-pulse text-purple-400" />
            <h2 className="mb-2 text-2xl font-bold text-white">Analyzing Your Rack...</h2>
            <p className="text-slate-400">Our AI vision is identifying all modules in your rack</p>
            <div className="mx-auto mt-8 h-1 w-64 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
            </div>
          </motion.div>
        )}

        {currentStep === 'review' && analysis ? (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Analysis Summary */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Analysis Complete!</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Found {modules.length} modules in your rack
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-green-500/20 px-3 py-1.5 text-sm font-medium text-green-400">
                  <Sparkles className="h-4 w-4" />
                  {analysis.overallQuality.charAt(0).toUpperCase() +
                    analysis.overallQuality.slice(1)}{' '}
                  Quality
                </div>
              </div>

              {/* Rack Layout Info */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-slate-400">Rows</p>
                  <p className="mt-1 text-lg font-bold text-white">{analysis.rackLayout.rows}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-slate-400">Estimated HP</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {analysis.rackLayout.estimatedHP}
                  </p>
                </div>
              </div>
            </div>

            {/* Bounding Box Visualization */}
            <BoundingBoxCanvas
              imageUrl={imagePreview!}
              modules={modules}
              onModuleClick={(_, index) => setSelectedModuleIndex(index)}
              selectedModuleIndex={selectedModuleIndex}
            />

            {/* Correction Panel */}
            <AnimatePresence>
              {selectedModuleIndex !== null && (
                <ModuleCorrectionPanel
                  module={modules[selectedModuleIndex]}
                  moduleIndex={selectedModuleIndex}
                  onSave={handleModuleSave}
                  onDelete={handleModuleDelete}
                  onCancel={() => setSelectedModuleIndex(null)}
                />
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetWizard}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:border-white/20 hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Start Over
              </button>
              <button
                type="button"
                onClick={handleGeneratePatch}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600"
              >
                Generate Patches
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
