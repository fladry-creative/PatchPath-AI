'use client';

import React from 'react';
import Link from 'next/link';
import { Github, Mail } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Roadmap', href: 'https://github.com/tfcbot/PatchPath-AI' },
  ],
  resources: [
    { name: 'Documentation', href: '/docs' },
    { name: 'Video Synthesis Guide', href: '/docs/video-synthesis' },
    { name: 'GitHub', href: 'https://github.com/tfcbot/PatchPath-AI' },
    { name: 'API Docs', href: '/api/docs' },
  ],
  company: [
    { name: 'About', href: '/about' },
    { name: 'The Lucky 13 Story', href: '/about#lucky-13' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Contact', href: 'mailto:hello@patchpath.ai' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-black py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 inline-block">
              <h3 className="text-2xl font-bold text-white">🎸 PatchPath AI</h3>
            </Link>
            <p className="mb-4 max-w-sm text-slate-400">
              Part of the{' '}
              <a
                href="https://fladrycreative.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 transition-colors hover:text-purple-300"
              >
                Fladry Creative
              </a>{' '}
              ecosystem. Built by{' '}
              <a
                href="https://fladrycreative.co"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 transition-colors hover:text-cyan-300"
              >
                The Fladry Creative Group
              </a>{' '}
              ×{' '}
              <a
                href="https://trashteam.tv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 transition-colors hover:text-cyan-300"
              >
                Trash Team
              </a>
            </p>
            <p className="mb-6 max-w-sm text-sm text-slate-500">
              From Nashville warehouse raves (1997) to AI-powered synthesis tools (2025). 28 years
              in the making.
              <br />
              <span className="text-slate-600">
                RIP Ghetto Headliners (1999-2002) • Long Live the Noise
              </span>
            </p>
            <div className="flex gap-4">
              <a
                href="https://github.com/tfcbot/PatchPath-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@patchpath.ai"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-colors hover:text-white"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-white uppercase">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-500">
              © {currentYear} PatchPath AI • Part of the{' '}
              <a
                href="https://fladrycreative.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-white"
              >
                Fladry Creative
              </a>{' '}
              Ecosystem
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Powered by</span>
              <a
                href="https://www.anthropic.com/claude"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple-400 transition-colors hover:text-purple-300"
              >
                Claude Sonnet 4.5
              </a>
              <span className="text-slate-600">• Est. Lucky.13 • BPM: ∞</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
