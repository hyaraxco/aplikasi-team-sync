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

export interface FilterOption<T extends string = string> {
  id: T;
  label: string;
}

interface FilterDropdownProps<T extends string = string> {
  filterType: string;
  filterLabel: string;
  options: FilterOption<T>[];
  selectedValues: T[];
  onChange: (value: T) => void;
  triggerClassName?: string;
}

/**
 * Reusable filter dropdown component that can be used in any list view
 */
export function FilterDropdown<T extends string = string>({
  filterType,
  filterLabel,
  options,
  selectedValues,
  onChange,
  triggerClassName,
}: FilterDropdownProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          Filter: {filterType}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{filterLabel}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.id}
            checked={selectedValues.includes(option.id)}
            onCheckedChange={() => onChange(option.id)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
