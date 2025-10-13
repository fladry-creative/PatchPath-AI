'use client';

/**
 * Patch Variations Carousel
 * Modern carousel using Embla Carousel (October 2025)
 * Features: Swipe gestures, keyboard nav, smooth transitions, adopt action
 */

import React, { useCallback, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Patch } from '@/types/patch';
import { PatchCard } from './PatchCard';

interface PatchVariationsCarouselProps {
  variations: Patch[];
  onAdoptVariation: (variation: Patch, index: number) => void;
  adoptedIndex?: number | null;
}

export function PatchVariationsCarousel({
  variations,
  onAdoptVariation,
  adoptedIndex,
}: PatchVariationsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        scrollNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollPrev, scrollNext]);

  if (variations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🔄 Variations ({variations.length})</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous variation"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next variation"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {variations.map((variation, index) => (
            <motion.div
              key={variation.id}
              className="min-w-0 flex-[0_0_100%] md:flex-[0_0_48%] lg:flex-[0_0_32%]"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="relative">
                {/* Variation Label */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-300">
                    Variation {index + 1}
                  </span>
                  {adoptedIndex === index && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-300"
                    >
                      <Check className="h-3 w-3" />
                      Active
                    </motion.span>
                  )}
                </div>

                {/* Patch Card */}
                <PatchCard patch={variation} />

                {/* Adopt Button */}
                <AnimatePresence mode="wait">
                  {adoptedIndex !== index && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={() => onAdoptVariation(variation, index)}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:from-purple-600 hover:to-pink-600 active:scale-95"
                    >
                      ✨ Use This Patch
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dots Navigation */}
      <div className="flex justify-center gap-2 pt-2">
        {variations.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-2 rounded-full transition-all ${
              index === selectedIndex ? 'w-8 bg-purple-400' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to variation ${index + 1}`}
          />
        ))}
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-xs text-slate-400">💡 Tip: Use ← → arrow keys to navigate</p>
    </div>
  );
}
