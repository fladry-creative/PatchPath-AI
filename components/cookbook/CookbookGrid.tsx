'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Dices, Sparkles, BookOpen, X } from 'lucide-react';
import { type Patch } from '@/types/patch';
import { PatchCard } from '@/components/patches/PatchCard';

interface CookbookGridProps {
  userId: string;
}

export function CookbookGrid({ userId }: CookbookGridProps) {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [filteredPatches, setFilteredPatches] = useState<Patch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  // Fetch user's patches
  useEffect(() => {
    async function fetchPatches() {
      try {
        const response = await fetch(`/api/patches/list?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setPatches(data.patches || []);
          setFilteredPatches(data.patches || []);
        }
      } catch (error) {
        console.error('Error fetching patches:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPatches();
  }, [userId]);

  // Filter patches based on search and filters
  useEffect(() => {
    let filtered = [...patches];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (patch) =>
          patch.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patch.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patch.metadata.techniques.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Technique filter
    if (selectedTechnique) {
      filtered = filtered.filter((patch) => patch.metadata.techniques.includes(selectedTechnique));
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter((patch) => patch.metadata.difficulty === selectedDifficulty);
    }

    setFilteredPatches(filtered);
  }, [searchQuery, selectedTechnique, selectedDifficulty, patches]);

  // Get unique techniques from all patches
  const allTechniques = Array.from(new Set(patches.flatMap((p) => p.metadata.techniques))).sort();

  const difficulties = ['beginner', 'intermediate', 'advanced'];

  // Random patch
  const handleRandomPatch = () => {
    if (filteredPatches.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredPatches.length);
      const element = document.getElementById(`patch-${filteredPatches[randomIndex].id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTechnique(null);
    setSelectedDifficulty(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 animate-pulse text-purple-400" />
          <p className="text-lg text-slate-400">Loading your patches...</p>
        </div>
      </div>
    );
  }

  if (patches.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md text-center">
          <BookOpen className="mx-auto mb-6 h-20 w-20 text-slate-600" />
          <h2 className="mb-4 text-2xl font-bold text-white">Your Cookbook is Empty</h2>
          <p className="mb-6 text-slate-400">
            Start generating patches to build your sonic library. Every patch you create will appear
            here!
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:scale-105"
          >
            <Sparkles className="h-5 w-5" />
            Generate Your First Patch
          </a>
        </div>
      </div>
    );
  }

  const hasActiveFilters = searchQuery || selectedTechnique || selectedDifficulty;

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patches by title, technique, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pr-4 pl-12 text-white placeholder-slate-500 backdrop-blur-sm transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>
          <button
            onClick={handleRandomPatch}
            disabled={filteredPatches.length === 0}
            className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-6 py-3 font-semibold text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Dices className="h-5 w-5" />
            <span className="hidden sm:inline">Surprise Me</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Filter by:</span>
          </div>

          {/* Technique Filter */}
          {allTechniques.length > 0 && (
            <select
              value={selectedTechnique || ''}
              onChange={(e) => setSelectedTechnique(e.target.value || null)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            >
              <option value="">All Techniques</option>
              {allTechniques.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          )}

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty || ''}
            onChange={(e) => setSelectedDifficulty(e.target.value || null)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-all focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          >
            <option value="">All Difficulties</option>
            {difficulties.map((diff) => (
              <option key={diff} value={diff}>
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-300 transition-all hover:border-red-500/50 hover:bg-red-500/20"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400">
            Showing <span className="font-semibold text-white">{filteredPatches.length}</span> of{' '}
            <span className="font-semibold text-white">{patches.length}</span> patches
          </p>
          {hasActiveFilters ? <p className="text-slate-500">Filters active</p> : null}
        </div>
      </div>

      {/* Patches Grid */}
      {filteredPatches.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <Search className="mx-auto mb-4 h-16 w-16 text-slate-600" />
            <h3 className="mb-2 text-xl font-bold text-white">No Patches Found</h3>
            <p className="text-slate-400">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-purple-400 underline underline-offset-4 hover:text-purple-300"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredPatches.map((patch, index) => (
              <motion.div
                key={patch.id}
                id={`patch-${patch.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <PatchCard patch={patch} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Coming Soon Badge */}
      <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-sm">
        <h3 className="mb-2 text-lg font-bold text-white">Collections & Export Coming Soon!</h3>
        <p className="text-sm text-slate-400">
          Organize patches into collections and export your favorite recipes. Stay tuned! 🎸
        </p>
      </div>
    </div>
  );
}
