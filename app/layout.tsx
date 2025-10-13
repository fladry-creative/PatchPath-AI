import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

// Force dynamic rendering to avoid static generation issues with Clerk + Next.js 15
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PatchPath AI - After 28 Years of Making Machines Scream',
  description:
    '28 years in the making: from Nashville warehouse raves (1997) to AI-powered synthesis (2025). Part of the Fladry Creative ecosystem. AI patch generation for Eurorack modular synthesis. No boring patches. No gatekeeping.',
  keywords:
    'modular synthesis, eurorack, AI patch generation, synthesizer, electronic music, modular synth, Fladry Creative, Trash Team',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
