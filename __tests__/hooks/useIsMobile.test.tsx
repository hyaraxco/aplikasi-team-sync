/**
 * @fileoverview Unit tests for useIsMobile custom hook
 *
 * Tests the mobile breakpoint detection hook with various viewport sizes.
 * The hook uses window.innerWidth to determine if the viewport is mobile (< 768px).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useIsMobile } from "@/hooks";

describe("useIsMobile", () => {
  beforeEach(() => {
    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Viewport detection", () => {
    it("should return false for desktop viewport (>= 768px)", () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it("should return true for mobile viewport (< 768px)", () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("should return true for exactly 767px (boundary case)", () => {
      // Mock window.innerWidth for boundary
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("should return false for exactly 768px (boundary case)", () => {
      // Mock window.innerWidth for boundary
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe("Event listeners", () => {
    it("should set up media query listener", () => {
      // Mock window.innerWidth
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderHook(() => useIsMobile());

      // Verify matchMedia was called with correct query
      expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    });

    it("should clean up on unmount", () => {
      // Mock window.innerWidth
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { unmount } = renderHook(() => useIsMobile());

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Hook behavior", () => {
    it("should return boolean value", () => {
      // Mock window.innerWidth
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(typeof result.current).toBe("boolean");
    });

    it("should handle undefined initial state", () => {
      // Mock window.innerWidth
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      // Should return a boolean, not undefined
      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe("boolean");
    });

    it("should use correct breakpoint (768px)", () => {
      // Mock window.innerWidth
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderHook(() => useIsMobile());

      // Verify the correct media query is used
      expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 767px)");
    });
  });
});
