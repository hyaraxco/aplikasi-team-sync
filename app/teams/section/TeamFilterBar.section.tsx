"use client";

import React from "react";
import {
  FilterOption,
  SortOption,
} from "@/components/common/data-display/FilterBar";
import FilterBar from "@/components/common/data-display/FilterBar";

interface TeamFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    members: string[];
    progress: string[];
  };
  onFilterChange: (type: string, value: string) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  onClearFilters: () => void;
}

const MEMBER_FILTER_OPTIONS: FilterOption[] = [
  { id: "small", label: "Small (≤ 5)" },
  { id: "medium", label: "Medium (6-10)" },
  { id: "large", label: "Large (10+)" },
];

const PROGRESS_FILTER_OPTIONS: FilterOption[] = [
  { id: "low", label: "Low (< 30%)" },
  { id: "medium", label: "Medium (30-70%)" },
  { id: "high", label: "High (> 70%)" },
];

const SORT_OPTIONS: SortOption<string>[] = [
  { id: "name", label: "Team Name" },
  { id: "members", label: "Members Count" },
  { id: "progress", label: "Progress" },
];

const TeamFilterBar = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
}: TeamFilterBarProps) => {
  const filterOptions = {
    members: MEMBER_FILTER_OPTIONS,
    progress: PROGRESS_FILTER_OPTIONS,
  };
  return (
    <FilterBar
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      filters={filters}
      filterOptions={filterOptions}
      onFilterChange={onFilterChange}
      sortField={sortField}
      sortDirection={sortDirection}
      sortOptions={SORT_OPTIONS}
      onSortFieldChange={onSortFieldChange}
      onSortDirectionChange={onSortDirectionChange}
      onClearFilters={onClearFilters}
    />
  );
};

export default TeamFilterBar;
