'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SignInButton, SignUpButton, useUser } from '@clerk/nextjs';
import { ArrowRight, Sparkles } from 'lucide-react';

export function HeroSection() {
  const { isSignedIn } = useUser();

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 left-10 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute right-10 bottom-20 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <span className="text-sm font-semibold text-purple-200">
                Powered by Claude Sonnet 4.5 • Born from Chaos • 303% More Fun
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-5xl leading-tight font-bold text-white sm:text-6xl lg:text-7xl"
          >
            After 28 Years of Making{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Machines Scream
            </span>
            <br />
            We Taught the Computer How to Patch
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12 text-xl text-slate-300 sm:text-2xl"
          >
            Born from warehouse raves and late-night patching sessions. PatchPath AI is your guide
            through the infinite possibilities of modular synthesis. No boring patches. No
            gatekeeping. Just pure sonic exploration.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            {isSignedIn ? (
              <Link
                href="/dashboard"
                className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50">
                    Let&apos;s Make Some Noise
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10">
                    Sign In
                  </button>
                </SignInButton>
              </>
            )}
          </motion.div>

          {/* Try Demo Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-purple-300"
            >
              <span>or</span>
              <span className="underline underline-offset-4">
                spin the rack roulette (no sign-up needed)
              </span>
            </Link>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400"
          >
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>AI Patch Generation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Vision Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Video Synthesis Support</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Educational Guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🍀</span>
              <span className="text-slate-600">Est. Lucky 13</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
