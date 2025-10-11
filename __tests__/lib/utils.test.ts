/**
 * Tests for lib/utils.ts
 */

import { describe, it, expect } from '@jest/globals';
import { cn } from '@/lib/utils';

describe('lib/utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('class1', false && 'class2', 'class3');
      expect(result).toBe('class1 class3');
    });

    it('should handle undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should handle empty strings', () => {
      const result = cn('class1', '', 'class2');
      expect(result).toBe('class1 class2');
    });

    it('should merge Tailwind classes correctly', () => {
      // twMerge should handle conflicting Tailwind classes
      const result = cn('px-2 py-1', 'px-4');
      expect(result).toBe('py-1 px-4');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        class1: true,
        class2: false,
        class3: true,
      });
      expect(result).toContain('class1');
      expect(result).toContain('class3');
      expect(result).not.toContain('class2');
    });

    it('should handle mixed types', () => {
      const result = cn(
        'base',
        {
          active: true,
          disabled: false,
        },
        ['additional'],
        'final'
      );
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).toContain('additional');
      expect(result).toContain('final');
      expect(result).not.toContain('disabled');
    });

    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle single argument', () => {
      const result = cn('single-class');
      expect(result).toBe('single-class');
    });

    it('should handle Tailwind color conflicts', () => {
      const result = cn('text-blue-500', 'text-red-500');
      expect(result).toBe('text-red-500');
      expect(result).not.toContain('text-blue-500');
    });

    it('should handle Tailwind spacing conflicts', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
      expect(result).not.toContain('p-4');
    });

    it('should handle Tailwind sizing conflicts', () => {
      const result = cn('w-32', 'w-64');
      expect(result).toBe('w-64');
      expect(result).not.toContain('w-32');
    });

    it('should preserve non-conflicting Tailwind classes', () => {
      const result = cn('p-4 text-blue-500', 'mt-2 text-red-500');
      expect(result).toContain('p-4');
      expect(result).toContain('mt-2');
      expect(result).toContain('text-red-500');
      expect(result).not.toContain('text-blue-500');
    });

    it('should handle complex Tailwind patterns', () => {
      const result = cn(
        'flex items-center justify-between',
        'hover:bg-gray-100',
        'dark:bg-gray-800'
      );
      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-between');
      expect(result).toContain('hover:bg-gray-100');
      expect(result).toContain('dark:bg-gray-800');
    });

    it('should handle responsive Tailwind classes', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3');
      expect(result).toContain('w-full');
      expect(result).toContain('md:w-1/2');
      expect(result).toContain('lg:w-1/3');
    });

    it('should handle arbitrary values', () => {
      const result = cn('w-[100px]', 'h-[50px]');
      expect(result).toContain('w-[100px]');
      expect(result).toContain('h-[50px]');
    });

    it('should handle important modifier', () => {
      const result = cn('!p-4', '!text-red-500');
      expect(result).toContain('!p-4');
      expect(result).toContain('!text-red-500');
    });

    it('should handle duplicate classes', () => {
      const result = cn('class1', 'class1', 'class2');
      // clsx merges classes but doesn't necessarily deduplicate all duplicates
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle whitespace correctly', () => {
      const result = cn('  class1  ', '  class2  ');
      expect(result).toBe('class1 class2');
    });

    it('should handle special characters in class names', () => {
      const result = cn('class-1', 'class_2', 'class:3');
      expect(result).toContain('class-1');
      expect(result).toContain('class_2');
      expect(result).toContain('class:3');
    });
  });

  describe('type safety', () => {
    it('should accept ClassValue types', () => {
      const stringClass: string = 'class1';
      const arrayClass: string[] = ['class2', 'class3'];
      const objectClass: Record<string, boolean> = { class4: true, class5: false };
      const undefinedClass: undefined = undefined;
      const nullClass: null = null;

      const result = cn(stringClass, arrayClass, objectClass, undefinedClass, nullClass);

      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
      expect(result).toContain('class4');
      expect(result).not.toContain('class5');
    });
  });

  describe('edge cases', () => {
    it('should handle very long class strings', () => {
      const longClass = Array(100)
        .fill('class')
        .map((c, i) => `${c}-${i}`)
        .join(' ');
      const result = cn(longClass);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty objects', () => {
      const result = cn({});
      expect(result).toBe('');
    });

    it('should handle empty arrays', () => {
      const result = cn([]);
      expect(result).toBe('');
    });

    it('should handle nested arrays', () => {
      const result = cn(['class1', ['class2', 'class3']]);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
      expect(result).toContain('class3');
    });

    it('should handle all falsy values', () => {
      const result = cn(false, null, undefined, 0, '', NaN);
      expect(result).toBe('');
    });

    it('should handle numeric zero', () => {
      const result = cn('class1', 0, 'class2');
      expect(result).toBe('class1 class2');
    });
  });
});
