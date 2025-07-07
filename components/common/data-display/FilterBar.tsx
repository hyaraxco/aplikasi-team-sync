import React from "react";
import { Button } from "@/components/atomics/button";
import { Input } from "@/components/atomics/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/dropdown-menu";
import { Filter, Plus, Search, SortAsc, X } from "lucide-react";

export interface FilterOption {
  id: string;
  label: string;
}
export interface SortOption<T = string> {
  id: T;
  label: string;
}

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: Record<string, string[]>;
  filterOptions: Record<string, FilterOption[]>;
  onFilterChange: (type: string, value: string) => void;
  sortField: string;
  sortDirection: "asc" | "desc";
  sortOptions: SortOption[];
  onSortFieldChange: (field: string) => void;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  onClearFilters: () => void;
  addButtonLabel?: string;
  onAdd?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  filterOptions,
  onFilterChange,
  sortField,
  sortDirection,
  sortOptions,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
  addButtonLabel,
  onAdd,
}) => {
  const hasActiveFilters =
    Object.values(filters).some((arr) => arr.length > 0) ||
    searchTerm.length > 0;

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1 flex gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-8"
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
        {Object.keys(filterOptions).length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {Object.entries(filterOptions).map(([group, options], idx) => (
                <React.Fragment key={group}>
                  <DropdownMenuLabel>
                    {group.charAt(0).toUpperCase() + group.slice(1)}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {options.map((opt) => (
                    <DropdownMenuItem asChild key={opt.id}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters[group]?.includes(opt.id) || false}
                          onChange={() => onFilterChange(group, opt.id)}
                        />
                        {opt.label}
                      </label>
                    </DropdownMenuItem>
                  ))}
                </React.Fragment>
              ))}
              <DropdownMenuSeparator />
              {hasActiveFilters && (
                <DropdownMenuItem
                  onClick={onClearFilters}
                  className="text-red-500"
                >
                  Clear all filters
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((opt) => (
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
        )}
      </div>
      {/* Add Button */}
      {onAdd && addButtonLabel && (
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          {addButtonLabel}
        </Button>
      )}
    </div>
  );
};

export default FilterBar;
