"use client";

import { useState, useMemo } from "react";
import type { FilterState, FilterActions } from "@/types/filter-types";

export function useFilterSort<T extends Record<string, any>>(
  items: T[],
  initialState: FilterState<T>
): [T[], FilterState<T>, FilterActions<T>] {
  const [state, setState] = useState<FilterState<T>>(initialState);

  const setSearchTerm = (searchTerm: string) => {
    setState((prev) => ({ ...prev, searchTerm }));
  };

  const toggleFilter = (type: string, value: string) => {
    setState((prev) => {
      const currentFilters = prev.filters[type] || [];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter((item) => item !== value)
        : [...currentFilters, value];

      return {
        ...prev,
        filters: {
          ...prev.filters,
          [type]: newFilters,
        },
      };
    });
  };

  const clearFilters = () => {
    setState((prev) => ({
      ...prev,
      searchTerm: "",
      filters: {},
    }));
  };

  const handleSort = (field: keyof T) => {
    setState((prev) => {
      if (field === prev.sortField) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
        };
      } else {
        return {
          ...prev,
          sortField: field,
          sortDirection: "asc",
        };
      }
    });
  };

  const setSortDirection = (sortDirection: "asc" | "desc") => {
    setState((prev) => ({ ...prev, sortDirection }));
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      result = result.filter((item) => {
        // Search in common text fields
        return Object.entries(item).some(([key, value]) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchLower);
          }
          return false;
        });
      });
    }

    // Apply other filters
    Object.entries(state.filters).forEach(([filterType, filterValues]) => {
      if (filterValues.length > 0) {
        result = result.filter((item) => {
          const itemValue = item[filterType];
          return filterValues.includes(itemValue);
        });
      }
    });

    // Apply sorting
    const sortField = state.sortField;
    const sortDirection = state.sortDirection;

    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return result;
  }, [items, state]);

  const actions: FilterActions<T> = {
    setSearchTerm,
    toggleFilter,
    clearFilters,
    handleSort,
    setSortDirection,
  };

  return [filteredAndSortedItems, state, actions];
}
