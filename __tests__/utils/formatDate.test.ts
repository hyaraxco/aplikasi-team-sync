/**
 * @fileoverview Unit tests for formatDate utility function
 * 
 * Tests the date formatting function with various input types including
 * Date objects, Firestore Timestamps, strings, and edge cases.
 */

import { describe, it, expect, vi } from 'vitest';
import { formatDate } from '@/lib/helpers';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore Timestamp for testing
const createMockTimestamp = (date: Date): Timestamp => ({
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000,
  toDate: () => date,
  toMillis: () => date.getTime(),
  isEqual: (other: Timestamp) => other.seconds === Math.floor(date.getTime() / 1000),
  valueOf: () => date.getTime().toString(),
  toJSON: function (): { seconds: number; nanoseconds: number; type: string; } {
    throw new Error('Function not implemented.');
  }
});

describe('formatDate', () => {
  describe('Valid Date object inputs', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2023-12-25');
      const formatted = formatDate(date);
      
      // Should return a valid date string (format may vary by locale)
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatted).not.toBe('Invalid date');
      expect(formatted).not.toBe('Not set');
    });

    it('should format current date correctly', () => {
      const now = new Date();
      const formatted = formatDate(now);
      
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatted).not.toBe('Invalid date');
    });

    it('should handle dates with custom format options', () => {
      const date = new Date('2023-12-25');
      const formatted = formatDate(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      expect(formatted).toContain('2023');
      expect(formatted).toContain('December');
      expect(formatted).toContain('25');
    });
  });

  describe('Firestore Timestamp inputs', () => {
    it('should format Firestore Timestamps correctly', () => {
      const date = new Date('2023-12-25');
      const timestamp = createMockTimestamp(date);
      const formatted = formatDate(timestamp);
      
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatted).not.toBe('Invalid date');
    });

    it('should handle Firestore Timestamps with toDate method', () => {
      const originalDate = new Date('2023-01-01');
      const mockTimestamp = {
        toDate: vi.fn().mockReturnValue(originalDate),
        seconds: Math.floor(originalDate.getTime() / 1000),
        nanoseconds: 0
      };
      
      const formatted = formatDate(mockTimestamp as any);
      
      expect(mockTimestamp.toDate).toHaveBeenCalled();
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('String date inputs', () => {
    it('should format valid date strings', () => {
      expect(formatDate('2023-12-25')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatDate('12/25/2023')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatDate('Dec 25, 2023')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format ISO date strings', () => {
      const isoString = '2023-12-25T10:30:00.000Z';
      const formatted = formatDate(isoString);
      
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatted).not.toBe('Invalid date');
    });
  });

  describe('Number timestamp inputs', () => {
    it('should format Unix timestamps (milliseconds)', () => {
      const timestamp = new Date('2023-12-25').getTime();
      const formatted = formatDate(timestamp);
      
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
      expect(formatted).not.toBe('Invalid date');
    });

    it('should format Unix timestamps (seconds)', () => {
      const timestamp = Math.floor(new Date('2023-12-25').getTime() / 1000);
      const formatted = formatDate(timestamp * 1000); // Convert back to milliseconds
      
      expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Null and undefined inputs', () => {
    it('should return default fallback for null', () => {
      expect(formatDate(null)).toBe('Not set');
    });

    it('should return default fallback for undefined', () => {
      expect(formatDate(undefined)).toBe('Not set');
    });

    it('should return custom fallback when provided', () => {
      expect(formatDate(null, { fallback: 'No date' })).toBe('No date');
      expect(formatDate(undefined, { fallback: 'TBD' })).toBe('TBD');
    });
  });

  describe('Invalid inputs', () => {
    it('should return "Invalid date" for invalid date strings', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date');
      expect(formatDate('not-a-date')).toBe('Invalid date');
      expect(formatDate('2023-13-45')).toBe('Invalid date'); // Invalid month/day
    });

    it('should return "Invalid date" for invalid Date objects', () => {
      const invalidDate = new Date('invalid');
      expect(formatDate(invalidDate)).toBe('Invalid date');
    });

    it('should return "Invalid date" for invalid numbers', () => {
      expect(formatDate(NaN)).toBe('Invalid date');
      expect(formatDate(Infinity)).toBe('Invalid date');
      expect(formatDate(-Infinity)).toBe('Invalid date');
    });

    it('should handle edge case invalid timestamps', () => {
      expect(formatDate(-1)).toBe('Invalid date'); // Negative timestamp might be invalid
    });
  });

  describe('Format options', () => {
    it('should respect custom format options', () => {
      const date = new Date('2023-12-25');
      
      const shortFormat = formatDate(date, {
        month: 'short',
        day: 'numeric',
        year: '2-digit'
      });
      
      expect(shortFormat).toContain('Dec');
      expect(shortFormat).toContain('25');
      expect(shortFormat).toContain('23');
    });

    it('should handle different locale-specific formatting', () => {
      const date = new Date('2023-12-25');
      
      // Test with different format options
      const longFormat = formatDate(date, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      expect(longFormat).toContain('2023');
      expect(longFormat).toContain('December');
    });
  });

  describe('Error handling and logging', () => {
    it('should log errors for debugging', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      formatDate('completely-invalid-date');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error formatting date:',
        expect.any(Error),
        { timestamp: 'completely-invalid-date' }
      );
      
      consoleSpy.mockRestore();
    });

    it('should not throw errors for any input', () => {
      const invalidInputs = [
        null,
        undefined,
        'invalid',
        NaN,
        Infinity,
        {},
        [],
        () => {},
      ];
      
      invalidInputs.forEach(input => {
        expect(() => formatDate(input as any)).not.toThrow();
      });
    });
  });

  describe('Type safety', () => {
    it('should accept DateLike union type inputs', () => {
      // These should compile without TypeScript errors
      const dateInput: Date = new Date();
      const stringInput: string = '2023-12-25';
      const numberInput: number = Date.now();
      const nullInput: null = null;
      const undefinedInput: undefined = undefined;

      expect(() => formatDate(dateInput)).not.toThrow();
      expect(() => formatDate(stringInput)).not.toThrow();
      expect(() => formatDate(numberInput)).not.toThrow();
      expect(() => formatDate(nullInput)).not.toThrow();
      expect(() => formatDate(undefinedInput)).not.toThrow();
    });
  });
});
