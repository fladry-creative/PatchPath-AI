'use client';

import React, { useState } from 'react';
import { UserButton } from '@clerk/nextjs';
import { VideoSynthesisGuideModal } from '@/components/education/VideoSynthesisGuideModal';

export function DashboardHeader() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="text-2xl font-bold text-white transition-colors hover:text-purple-300"
            >
              🎸 PatchPath AI
            </a>
          </div>
          <div className="flex items-center gap-4">
            {/* Cookbook Link */}
            <a
              href="/cookbook"
              className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20"
            >
              <span>🗂️</span>
              <span className="hidden sm:inline">Cookbook</span>
            </a>
            {/* Video Synthesis Guide Button */}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 transition-all hover:border-orange-500/50 hover:bg-orange-500/20"
            >
              <span>📺</span>
              <span className="hidden sm:inline">Video Guide</span>
            </button>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'w-10 h-10',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Guide Modal */}
      <VideoSynthesisGuideModal open={isGuideOpen} onOpenChange={setIsGuideOpen} />
    </>
  );
}
