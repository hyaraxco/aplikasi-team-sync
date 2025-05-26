"use client";

import React from "react";
import { DataFilterBar } from "@/components/common/data-display/DataFilterBar";
import { FilterOption } from "@/components/common/data-display/FilterDropdown";
import { SortOption } from "@/components/common/data-display/SortDropdown";
import { ProjectStatus } from "@/lib/firestore"; // Assuming ProjectStatus type is available

export interface ProjectFilters {
  status: ProjectStatus[];
  teamIds: string[]; // Add other filter types here
}

export type ProjectSortField = "name" | "deadline" | "status";

interface ProjectFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: ProjectFilters;
  onFilterChange: (type: keyof ProjectFilters, value: string) => void;
  sortField: ProjectSortField;
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: ProjectSortField) => void;
  onSortDirectionChange: (direction: "asc" | "desc") => void;
  onClearFilters: () => void;
}

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { id: "planning", label: "Planning" },
  { id: "in-progress", label: "In Progress" },
  { id: "on-hold", label: "On Hold" },
  { id: "completed", label: "Completed" },
];

const SORT_OPTIONS: SortOption<ProjectSortField>[] = [
  { id: "name", label: "Project Name" },
  { id: "deadline", label: "Deadline" },
  { id: "status", label: "Status" },
];

const ProjectFilterBar = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSortDirectionChange,
  onClearFilters,
}: ProjectFilterBarProps) => {
  const filterConfigs = [
    {
      type: "Status",
      label: "Filter by status",
      options: STATUS_FILTER_OPTIONS,
      values: filters.status,
      onChange: (value: string) => onFilterChange("status", value as ProjectStatus),
    },
    // Add other filter configurations here
  ];

  const hasActiveFilters = filters.status.length > 0 || searchTerm.length > 0;

  return (
    <DataFilterBar
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search projects..."
      filters={filterConfigs}
      sortField={sortField}
      sortOptions={SORT_OPTIONS}
      sortDirection={sortDirection}
      onSortFieldChange={onSortFieldChange}
      onSortDirectionChange={onSortDirectionChange}
      onClearFilters={onClearFilters}
      hasFilters={hasActiveFilters}
    />
  );
};

export default ProjectFilterBar;
