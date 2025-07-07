/**
 * @fileoverview Unit tests for formatRupiah utility function
 * 
 * Tests the Indonesian Rupiah currency formatting function with various
 * input types and edge cases to ensure reliable currency display.
 */

import { describe, it, expect } from 'vitest';
import { formatRupiah } from '@/lib/helpers';

describe('formatRupiah', () => {
  describe('Valid number inputs', () => {
    it('should format positive integers correctly', () => {
      expect(formatRupiah(1234567)).toBe('Rp 1.234.567');
      expect(formatRupiah(1000)).toBe('Rp 1.000');
      expect(formatRupiah(100)).toBe('Rp 100');
      expect(formatRupiah(1)).toBe('Rp 1');
    });

    it('should format zero correctly', () => {
      expect(formatRupiah(0)).toBe('Rp 0');
    });

    it('should format negative numbers correctly', () => {
      expect(formatRupiah(-1000)).toBe('Rp -1.000');
      expect(formatRupiah(-1234567)).toBe('Rp -1.234.567');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatRupiah(1234.56)).toBe('Rp 1.235'); // Rounded
      expect(formatRupiah(1000.1)).toBe('Rp 1.000');
      expect(formatRupiah(999.9)).toBe('Rp 1.000'); // Rounded up
    });

    it('should handle very large numbers', () => {
      expect(formatRupiah(1000000000)).toBe('Rp 1.000.000.000');
      expect(formatRupiah(999999999999)).toBe('Rp 999.999.999.999');
    });
  });

  describe('String number inputs', () => {
    it('should format valid string numbers', () => {
      expect(formatRupiah('1234567')).toBe('Rp 1.234.567');
      expect(formatRupiah('1000')).toBe('Rp 1.000');
      expect(formatRupiah('0')).toBe('Rp 0');
    });

    it('should handle string numbers with decimals', () => {
      expect(formatRupiah('1234.56')).toBe('Rp 1.235');
    });

    it('should handle currency input format (from parseCurrencyInput)', () => {
      // Assuming parseCurrencyInput converts "Rp 1.234.567" to "1234567"
      expect(formatRupiah('1234567')).toBe('Rp 1.234.567');
    });
  });

  describe('Symbol option', () => {
    it('should format without symbol when withSymbol is false', () => {
      expect(formatRupiah(1234567, { withSymbol: false })).toBe('1.234.567');
      expect(formatRupiah(1000, { withSymbol: false })).toBe('1.000');
      expect(formatRupiah(0, { withSymbol: false })).toBe('0');
    });

    it('should format with symbol when withSymbol is true (default)', () => {
      expect(formatRupiah(1234567, { withSymbol: true })).toBe('Rp 1.234.567');
      expect(formatRupiah(1234567)).toBe('Rp 1.234.567'); // Default behavior
    });
  });

  describe('Invalid inputs', () => {
    it('should return empty string for null', () => {
      expect(formatRupiah(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatRupiah(undefined)).toBe('');
    });

    it('should return empty string for invalid string', () => {
      expect(formatRupiah('invalid')).toBe('');
      expect(formatRupiah('abc123')).toBe('');
      expect(formatRupiah('')).toBe('');
    });

    it('should return empty string for NaN', () => {
      expect(formatRupiah(NaN)).toBe('');
    });

    it('should return empty string for Infinity', () => {
      expect(formatRupiah(Infinity)).toBe('');
      expect(formatRupiah(-Infinity)).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle very small decimal numbers', () => {
      expect(formatRupiah(0.1)).toBe('Rp 0');
      expect(formatRupiah(0.5)).toBe('Rp 1'); // Rounded up
      expect(formatRupiah(0.01)).toBe('Rp 0');
    });

    it('should handle scientific notation', () => {
      expect(formatRupiah(1e6)).toBe('Rp 1.000.000');
      expect(formatRupiah(1.23e4)).toBe('Rp 12.300');
    });

    it('should maintain consistency with Indonesian locale formatting', () => {
      // Indonesian locale uses dots for thousands separator
      expect(formatRupiah(1234567)).toContain('1.234.567');
      expect(formatRupiah(1000000)).toContain('1.000.000');
    });
  });

  describe('Type safety', () => {
    it('should accept number | string | null | undefined as per type definition', () => {
      // These should compile without TypeScript errors
      const numberInput: number = 1000;
      const stringInput: string = '1000';
      const nullInput: null = null;
      const undefinedInput: undefined = undefined;

      expect(() => formatRupiah(numberInput)).not.toThrow();
      expect(() => formatRupiah(stringInput)).not.toThrow();
      expect(() => formatRupiah(nullInput)).not.toThrow();
      expect(() => formatRupiah(undefinedInput)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large arrays of numbers efficiently', () => {
      const numbers = Array.from({ length: 1000 }, (_, i) => i * 1000);
      const start = performance.now();
      
      numbers.forEach(num => formatRupiah(num));
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100); // 100ms for 1000 operations
    });
  });
});
