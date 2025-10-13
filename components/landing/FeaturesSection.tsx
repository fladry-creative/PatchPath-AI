'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Eye, Zap, BookOpen, Video, Palette } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI Patch Generation',
    description:
      "Claude Sonnet 4.5 doesn't just suggest patches - it understands your rack like a seasoned sound designer. Get creative routing, parameter sweet spots, and patches that actually work (not just random cables).",
    gradient: 'from-purple-500 to-pink-500',
    bgGradient: 'from-purple-500/10 to-pink-500/10',
  },
  {
    icon: Eye,
    title: 'Vision-First Analysis',
    description:
      'Take a photo of your rack with your phone. Upload it. Done. Our vision AI identifies every module and knows what they do. No manual data entry. No spreadsheets. Just patch.',
    gradient: 'from-cyan-500 to-blue-500',
    bgGradient: 'from-cyan-500/10 to-blue-500/10',
  },
  {
    icon: Video,
    title: 'Video Synthesis Deep Cuts',
    description:
      "Full support for LZX Industries and Syntonie video modules. Sync distribution, signal flow, and patches that won't fry your CRT. Because visual noise needs love too.",
    gradient: 'from-orange-500 to-red-500',
    bgGradient: 'from-orange-500/10 to-red-500/10',
  },
  {
    icon: BookOpen,
    title: 'Learn While You Patch',
    description:
      'Every patch includes "Why This Works" explanations and pro tips. We\'re not gatekeeping synthesis knowledge behind forum posts and YouTube comments. Level up your game.',
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-500/10 to-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Patch Variations on Demand',
    description:
      "One click generates 3-5 creative variations. Same modules, different vibes. Perfect for when you need inspiration but don't want to unplug everything and start over.",
    gradient: 'from-yellow-500 to-orange-500',
    bgGradient: 'from-yellow-500/10 to-orange-500/10',
  },
  {
    icon: Palette,
    title: 'Shareable Patch Diagrams',
    description:
      'AI-generated visuals with color-coded cables that actually look good. Export for Instagram, print for your studio wall, or send to your synth buddies. Make documentation not suck.',
    gradient: 'from-pink-500 to-purple-500',
    bgGradient: 'from-pink-500/10 to-purple-500/10',
  },
];

export function FeaturesSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-black to-slate-900" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
              Built by Patch Addicts, For Patch Addicts
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-slate-400">
              We&apos;ve spent decades routing audio through questionable gear in questionable
              venues. Now we&apos;re putting that chaos into code so you can make better noise,
              faster.
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div
                  className={`h-full rounded-2xl border border-white/10 bg-gradient-to-br ${feature.bgGradient} p-8 backdrop-blur-sm transition-all hover:border-white/20 hover:shadow-xl`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-2xl font-bold text-white">{feature.title}</h3>

                  {/* Description */}
                  <p className="leading-relaxed text-slate-300">{feature.description}</p>

                  {/* Hover Effect */}
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 blur-xl transition-opacity group-hover:opacity-10`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-slate-400">
            Join synth nerds, warehouse DJs, and bedroom producers discovering new patches every day
          </p>
        </motion.div>
      </div>
    </section>
  );
}
