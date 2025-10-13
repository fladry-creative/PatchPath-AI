'use client';

import { useCallback } from 'react';

export function useConfetti() {
  const celebrate = useCallback(() => {
    // Dynamic import to avoid SSR issues
    import('canvas-confetti').then((confetti) => {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti.default({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      // Purple and pink colors to match brand
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#a855f7', '#ec4899', '#f472b6', '#c084fc'],
      });

      fire(0.2, {
        spread: 60,
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6'],
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#fb923c', '#f97316', '#fbbf24'],
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: ['#22c55e', '#10b981'],
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: ['#ffffff', '#f8fafc'],
      });
    });
  }, []);

  const raveMode = useCallback(() => {
    // Extra chaos for special occasions
    import('canvas-confetti').then((confetti) => {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti.default({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#ec4899', '#06b6d4', '#fb923c', '#22c55e'],
        });
        confetti.default({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#c084fc', '#f472b6', '#3b82f6', '#fbbf24', '#10b981'],
        });
      }, 250);
    });
  }, []);

  return { celebrate, raveMode };
}
