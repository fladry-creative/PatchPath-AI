'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Sparkles, Rocket } from 'lucide-react';
import Link from 'next/link';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload or Connect',
    description:
      'Paste your ModularGrid URL, upload a photo of your rack, or try with a random demo rack to get started instantly.',
    color: 'from-cyan-500 to-blue-500',
    bgColor: 'from-cyan-500/10 to-blue-500/10',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'AI Analysis',
    description:
      'Our AI analyzes your modules, identifies capabilities (VCO/VCF/VCA), detects video synthesis modules, and determines possible techniques.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/10 to-pink-500/10',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Generate & Create',
    description:
      'Get instant patch suggestions with detailed cable routing, parameter settings, and educational explanations. Generate variations and export diagrams.',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-500/10 to-red-500/10',
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* Background with subtle pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
              From Rack to Patch in 3 Simple Steps
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-slate-400">
              No complex setup. No manual data entry. Just intelligent AI-powered patch generation
              that works with your existing gear.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="relative mx-auto max-w-5xl">
          {/* Connecting Line (hidden on mobile) */}
          <div className="absolute top-0 left-1/2 hidden h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-orange-500/50 lg:block" />

          <div className="space-y-24">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  className={`relative flex flex-col items-center gap-8 lg:flex-row ${
                    isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 lg:w-1/2">
                    <div
                      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${step.bgColor} p-8 backdrop-blur-sm`}
                    >
                      {/* Step Number */}
                      <div className="mb-4 text-sm font-bold text-slate-500">{step.number}</div>

                      {/* Title */}
                      <h3 className="mb-4 text-3xl font-bold text-white">{step.title}</h3>

                      {/* Description */}
                      <p className="text-lg leading-relaxed text-slate-300">{step.description}</p>
                    </div>
                  </div>

                  {/* Icon (center on desktop) */}
                  <div className="relative z-10 flex h-24 w-24 flex-shrink-0 items-center justify-center lg:h-32 lg:w-32">
                    <div
                      className={`absolute inset-0 animate-pulse rounded-full bg-gradient-to-br ${step.color} opacity-20 blur-xl`}
                    />
                    <div
                      className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${step.color} shadow-2xl lg:h-28 lg:w-28`}
                    >
                      <Icon className="h-10 w-10 text-white lg:h-14 lg:w-14" />
                    </div>
                  </div>

                  {/* Spacer for alignment */}
                  <div className="hidden flex-1 lg:block lg:w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
          >
            Try It Now - It&apos;s Free
            <Rocket className="h-5 w-5" />
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required</p>
        </motion.div>
      </div>
    </section>
  );
}
