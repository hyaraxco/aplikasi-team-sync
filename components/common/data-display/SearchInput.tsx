"use client";

import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/atomics/input";
import { InputHTMLAttributes } from "react";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Reusable search input component with search icon
 */
export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  ...props
}: SearchInputProps) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-8 pr-8 border rounded w-full h-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
};
