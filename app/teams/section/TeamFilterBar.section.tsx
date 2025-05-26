"use client";

import React from "react";
import { FilterOption } from "@/components/common/data-display/FilterDropdown";
import { SortOption } from "@/components/common/data-display/SortDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/dropdown-menu";
import { Filter, Search, SortAsc, X } from "lucide-react";
import { Button } from "@/components/atomics/button";

interface TeamFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: {
    members: string[];
    progress: string[];
  };
  onFilterChange: (type: "members" | "progress", value: string) => void;
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
  const hasFilters =
    filters.members.length > 0 ||
    filters.progress.length > 0 ||
    searchTerm.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1 flex gap-4">
        {/* Search */}
        <div className="flex-1 relative justify-center items-center align-middle">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-8 border rounded w-full h-10"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Team Size</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MEMBER_FILTER_OPTIONS.map((opt) => (
              <DropdownMenuItem asChild key={opt.id}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="team-size-filter"
                    checked={filters.members.includes(opt.id)}
                    onChange={() => onFilterChange("members", opt.id)}
                  />
                  {opt.label}
                </label>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Progress</DropdownMenuLabel>
            {PROGRESS_FILTER_OPTIONS.map((opt) => (
              <DropdownMenuItem asChild key={opt.id}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="progress-filter"
                    checked={filters.progress.includes(opt.id)}
                    onChange={() => onFilterChange("progress", opt.id)}
                  />
                  {opt.label}
                </label>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {hasFilters && (
              <DropdownMenuItem
                onClick={onClearFilters}
                className="text-red-500"
              >
                Clear all filters
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SortAsc className="h-4 w-4" />
              Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.id}
                onClick={() => onSortFieldChange(opt.id)}
                className={sortField === opt.id ? "font-semibold" : ""}
              >
                {sortField === opt.id && (
                  <span className="mr-2 text-primary">✔</span>
                )}
                {opt.label}
                {sortField === opt.id && (
                  <span className="ml-2">
                    {sortDirection === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Direction</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onSortDirectionChange("asc")}
              className={sortDirection === "asc" ? "font-semibold" : ""}
            >
              {sortDirection === "asc" && (
                <span className="mr-2 text-primary">✔</span>
              )}
              Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSortDirectionChange("desc")}
              className={sortDirection === "desc" ? "font-semibold" : ""}
            >
              {sortDirection === "desc" && (
                <span className="mr-2 text-primary">✔</span>
              )}
              Descending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TeamFilterBar;
