'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Dices, Camera, BookOpen, Zap, Palette } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  {
    icon: Sparkles,
    title: 'Generate Patch',
    description: 'Start with your rack URL or a random one',
    href: '#patch-form',
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/20',
    action: 'scroll',
  },
  {
    icon: Dices,
    title: 'Random Rack Roulette',
    description: 'Feeling lucky? Try a random rack',
    href: '/dashboard',
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
    borderColor: 'border-orange-500/20',
    action: 'random',
  },
  {
    icon: Camera,
    title: 'Upload Rack Photo',
    description: 'Vision AI will identify your modules',
    href: '/vision-upload',
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/20',
    action: 'link',
  },
  {
    icon: Palette,
    title: 'Patch Cookbook',
    description: 'Browse your saved patches',
    href: '/dashboard#cookbook',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
    borderColor: 'border-green-500/20',
    action: 'link',
    badge: 'Coming Soon',
  },
  {
    icon: BookOpen,
    title: 'Video Synthesis Guide',
    description: 'Learn LZX and Syntonie modules',
    href: '#video-guide',
    gradient: 'from-yellow-500 to-orange-500',
    bgGradient: 'from-yellow-500/10 to-orange-500/10',
    borderColor: 'border-yellow-500/20',
    action: 'guide',
  },
  {
    icon: Zap,
    title: 'About PatchPath',
    description: 'The Lucky 13 origin story',
    href: '/about',
    gradient: 'from-pink-500 to-purple-500',
    bgGradient: 'from-pink-500/10 to-purple-500/10',
    borderColor: 'border-pink-500/20',
    action: 'link',
  },
];

export function QuickActions() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleAction = (action: string) => {
    if (action === 'scroll') {
      const form = document.querySelector('#patch-form') || document.querySelector('form');
      form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (action === 'random') {
      // Trigger random rack - this would be handled by the form
      const randomButton = document.querySelector('[data-random-rack]') as HTMLButtonElement;
      randomButton?.click();
    } else if (action === 'guide') {
      // Open video guide modal
      const guideButton = document.querySelector('[data-video-guide]') as HTMLButtonElement;
      guideButton?.click();
    }
  };

  return (
    <div className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Quick Actions</h3>
        <span className="text-sm text-slate-500">Choose your adventure 🎸</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const isComingSoon = action.badge === 'Coming Soon';

          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className="relative"
            >
              {action.action === 'link' ? (
                <Link
                  href={action.href}
                  className={`group block h-full rounded-xl border ${action.borderColor} bg-gradient-to-br ${action.bgGradient} p-6 backdrop-blur-sm transition-all hover:scale-105 hover:border-white/20 hover:shadow-xl ${isComingSoon ? 'cursor-not-allowed opacity-60' : ''}`}
                  onClick={(e) => isComingSoon && e.preventDefault()}
                >
                  <ActionContent
                    action={action}
                    Icon={Icon}
                    hoveredIndex={hoveredIndex}
                    index={index}
                  />
                </Link>
              ) : (
                <button
                  onClick={() => !isComingSoon && handleAction(action.action)}
                  disabled={isComingSoon}
                  className={`group h-full w-full rounded-xl border ${action.borderColor} bg-gradient-to-br ${action.bgGradient} p-6 text-left backdrop-blur-sm transition-all hover:scale-105 hover:border-white/20 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100`}
                >
                  <ActionContent
                    action={action}
                    Icon={Icon}
                    hoveredIndex={hoveredIndex}
                    index={index}
                  />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ActionContent({
  action,
  Icon,
  hoveredIndex,
  index,
}: {
  action: (typeof quickActions)[0];
  Icon: React.ComponentType<{ className?: string }>;
  hoveredIndex: number | null;
  index: number;
}) {
  return (
    <>
      {/* Icon */}
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient}`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>

      {/* Badge */}
      {action.badge ? (
        <div className="absolute top-4 right-4 rounded-full bg-white/10 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {action.badge}
        </div>
      ) : null}

      {/* Title */}
      <h4 className="mb-2 text-lg font-bold text-white">{action.title}</h4>

      {/* Description */}
      <p className="text-sm text-slate-400">{action.description}</p>

      {/* Hover glow effect */}
      {hoveredIndex === index && (
        <motion.div
          layoutId="quickActionGlow"
          className={`absolute inset-0 -z-10 rounded-xl bg-gradient-to-br ${action.gradient} opacity-20 blur-xl`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
        />
      )}
    </>
  );
}
