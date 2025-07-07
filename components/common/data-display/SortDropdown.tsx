"use client";

import React from "react";
import { Button } from "@/components/atomics/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/molecules/dropdown-menu";

export interface SortOption<T extends string> {
  id: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  sortField: T;
  sortOptions: SortOption<T>[];
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: T) => void;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  triggerLabel?: string;
  fieldLabel?: string;
  directionLabel?: string;
  ascendingLabel?: string;
  descendingLabel?: string;
}

/**
 * Reusable sort dropdown component that can be used in any list view
 */
export function SortDropdown<T extends string>({
  sortField,
  sortOptions,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  triggerLabel = "Sort",
  fieldLabel = "Sort by",
  directionLabel = "Direction",
  ascendingLabel = "Ascending",
  descendingLabel = "Descending",
}: SortDropdownProps<T>) {
  const getSelectedOption = () => {
    const option = sortOptions.find((opt) => opt.id === sortField);
    const directionText = sortDirection === "asc" ? "A-Z" : "Z-A";
    return `${triggerLabel}: ${option?.label || ""} (${directionText})`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          {getSelectedOption()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{fieldLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {sortOptions.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={sortField === option.id}
            onCheckedChange={() => onSortFieldChange(option.id)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{directionLabel}</DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          checked={sortDirection === "asc"}
          onCheckedChange={() => onSortDirectionChange("asc")}
        >
          {ascendingLabel}
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={sortDirection === "desc"}
          onCheckedChange={() => onSortDirectionChange("desc")}
        >
          {descendingLabel}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
