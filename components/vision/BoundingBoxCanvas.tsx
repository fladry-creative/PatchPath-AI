'use client';

import React, { useRef, useEffect, useState } from 'react';
import { type VisionModule } from '@/lib/vision/rack-analyzer';
import { AlertCircle, Check } from 'lucide-react';

interface BoundingBoxCanvasProps {
  imageUrl: string;
  modules: VisionModule[];
  onModuleClick?: (module: VisionModule, index: number) => void;
  selectedModuleIndex?: number | null;
}

export function BoundingBoxCanvas({
  imageUrl,
  modules,
  onModuleClick,
  selectedModuleIndex,
}: BoundingBoxCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Get color based on confidence level
  const getConfidenceColor = (
    confidence: number
  ): { border: string; fill: string; text: string } => {
    if (confidence >= 0.8) {
      return { border: '#10b981', fill: 'rgba(16, 185, 129, 0.2)', text: '#10b981' }; // green
    } else if (confidence >= 0.5) {
      return { border: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' }; // yellow
    } else {
      return { border: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' }; // red
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      // Calculate canvas size to fit container while maintaining aspect ratio
      const containerWidth = container.clientWidth;
      const aspectRatio = img.height / img.width;
      const displayWidth = containerWidth;
      const displayHeight = containerWidth * aspectRatio;

      canvas.width = displayWidth;
      canvas.height = displayHeight;

      setImageDimensions({ width: displayWidth, height: displayHeight });

      // Draw image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      // Draw bounding boxes
      modules.forEach((module, index) => {
        const { position, confidence } = module;
        const { border, fill } = getConfidenceColor(confidence);

        // Calculate pixel coordinates from normalized positions
        const x = position.x * displayWidth;
        const y = position.y * displayHeight;
        const width = (position.width / 104) * displayWidth; // Assuming ~104HP standard case

        // Height is estimated based on module standards (3U Eurorack ≈ 128.5mm)
        const height = displayHeight * 0.12; // Rough estimate

        // Draw filled rectangle
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, width, height);

        // Draw border
        ctx.strokeStyle = border;
        ctx.lineWidth = selectedModuleIndex === index ? 4 : hoveredIndex === index ? 3 : 2;
        ctx.strokeRect(x, y, width, height);

        // Draw module name label
        const fontSize = 12;
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = border;

        const labelText = `${module.name} (${Math.round(confidence * 100)}%)`;
        const textMetrics = ctx.measureText(labelText);
        const labelPadding = 4;
        const labelHeight = fontSize + labelPadding * 2;

        // Draw label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y - labelHeight, textMetrics.width + labelPadding * 2, labelHeight);

        // Draw label text
        ctx.fillStyle = border;
        ctx.fillText(labelText, x + labelPadding, y - labelPadding);
      });
    };

    img.onerror = () => {
      console.error('Failed to load image for bounding box visualization');
    };
  }, [imageUrl, modules, selectedModuleIndex, hoveredIndex]);

  // Handle click on canvas
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onModuleClick || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Check if click is inside any bounding box
    modules.forEach((module, index) => {
      const { position } = module;
      const x = position.x * imageDimensions.width;
      const y = position.y * imageDimensions.height;
      const width = (position.width / 104) * imageDimensions.width;
      const height = imageDimensions.height * 0.12;

      if (clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height) {
        onModuleClick(module, index);
      }
    });
  };

  // Handle mouse move for hover effect
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let foundHover = false;

    // Check if mouse is over any bounding box
    modules.forEach((module, index) => {
      const { position } = module;
      const x = position.x * imageDimensions.width;
      const y = position.y * imageDimensions.height;
      const width = (position.width / 104) * imageDimensions.width;
      const height = imageDimensions.height * 0.12;

      if (mouseX >= x && mouseX <= x + width && mouseY >= y && mouseY <= y + height) {
        setHoveredIndex(index);
        canvas.style.cursor = 'pointer';
        foundHover = true;
      }
    });

    if (!foundHover) {
      setHoveredIndex(null);
      canvas.style.cursor = 'default';
    }
  };

  // Calculate confidence stats
  const highConfidence = modules.filter((m) => m.confidence >= 0.8).length;
  const mediumConfidence = modules.filter((m) => m.confidence >= 0.5 && m.confidence < 0.8).length;
  const lowConfidence = modules.filter((m) => m.confidence < 0.5).length;

  return (
    <div className="w-full space-y-4">
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
          className="w-full"
        />
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">Confidence Legend</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-green-500 bg-green-500/20" />
            <div className="flex-1">
              <p className="text-xs font-medium text-green-400">High (≥80%)</p>
              <p className="text-xs text-slate-400">{highConfidence} modules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-yellow-500 bg-yellow-500/20" />
            <div className="flex-1">
              <p className="text-xs font-medium text-yellow-400">Medium (50-79%)</p>
              <p className="text-xs text-slate-400">{mediumConfidence} modules</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded border-2 border-red-500 bg-red-500/20" />
            <div className="flex-1">
              <p className="text-xs font-medium text-red-400">Low (&lt;50%)</p>
              <p className="text-xs text-slate-400">{lowConfidence} modules</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 space-y-2">
          {lowConfidence > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-yellow-400" />
              <p className="text-xs text-yellow-300">
                {lowConfidence} module{lowConfidence !== 1 ? 's' : ''} with low confidence. Click to
                review and correct.
              </p>
            </div>
          )}
          {lowConfidence === 0 && mediumConfidence === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-2">
              <Check className="h-4 w-4 flex-shrink-0 text-green-400" />
              <p className="text-xs text-green-300">
                All modules identified with high confidence! You can proceed to generate patches.
              </p>
            </div>
          )}
          <p className="text-xs text-slate-400">💡 Click any module to edit its identification</p>
        </div>
      </div>
    </div>
  );
}
