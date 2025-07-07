import React, { useState } from "react";
import { DatePicker as AntDatePicker, DatePickerProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";
import { SizeType } from "antd/es/config-provider/SizeContext";

// Common interface for all date picker types
interface BaseAntDatePickerProps {
  value?: Date | Timestamp | null;
  onChange?: (date: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
}

// Regular DatePicker
export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select date",
  className,
  allowClear = true,
}: BaseAntDatePickerProps) {
  const handleChange: DatePickerProps["onChange"] = (date: Dayjs | null) => {
    onChange?.(date ? date.toDate() : null);
  };

  const [size, setSize] = useState<SizeType>("large");

  return (
    <AntDatePicker
      size={size}
      value={
        value
          ? dayjs(value instanceof Timestamp ? value.toDate() : value)
          : null
      }
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      allowClear={allowClear}
    />
  );
}

// Week Picker
export function WeekPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select week",
  className,
  allowClear = true,
}: BaseAntDatePickerProps) {
  const handleChange: DatePickerProps["onChange"] = (date: Dayjs | null) => {
    onChange?.(date ? date.toDate() : null);
  };

  return (
    <AntDatePicker.WeekPicker
      value={
        value
          ? dayjs(value instanceof Timestamp ? value.toDate() : value)
          : null
      }
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      allowClear={allowClear}
    />
  );
}

// Month Picker
export function MonthPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select month",
  className,
  allowClear = true,
}: BaseAntDatePickerProps) {
  const handleChange: DatePickerProps["onChange"] = (date: Dayjs | null) => {
    onChange?.(date ? date.toDate() : null);
  };

  return (
    <AntDatePicker.MonthPicker
      value={
        value
          ? dayjs(value instanceof Timestamp ? value.toDate() : value)
          : null
      }
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      allowClear={allowClear}
    />
  );
}

// Year Picker
export function YearPicker({
  value,
  onChange,
  disabled = false,
  placeholder = "Select year",
  className,
  allowClear = true,
}: BaseAntDatePickerProps) {
  const handleChange: DatePickerProps["onChange"] = (date: Dayjs | null) => {
    onChange?.(date ? date.toDate() : null);
  };

  return (
    <AntDatePicker.YearPicker
      value={
        value
          ? dayjs(value instanceof Timestamp ? value.toDate() : value)
          : null
      }
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      allowClear={allowClear}
    />
  );
}

// Date Range Picker
interface RangePickerProps {
  value?: [Date | null, Date | null] | null;
  onChange?: (dates: [Date | null, Date | null] | null) => void;
  disabled?: boolean;
  placeholder?: [string, string];
  className?: string;
  allowClear?: boolean;
}

export function RangePicker({
  value,
  onChange,
  disabled = false,
  placeholder = ["Start date", "End date"],
  className,
  allowClear = true,
}: RangePickerProps) {
  const handleChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (!onChange) return;

    if (!dates || !dates[0] || !dates[1]) {
      onChange(null);
      return;
    }

    onChange([dates[0].toDate(), dates[1].toDate()]);
  };

  const dayjsValue = value
    ? ([
        value[0] ? dayjs(value[0]) : null,
        value[1] ? dayjs(value[1]) : null,
      ] as [Dayjs | null, Dayjs | null])
    : null;

  return (
    <AntDatePicker.RangePicker
      value={dayjsValue}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      allowClear={allowClear}
    />
  );
}

// Combined DatePicker component that supports multiple modes
export type DatePickerMode = "date" | "week" | "month" | "year" | "range";

interface CombinedDatePickerProps
  extends Omit<BaseAntDatePickerProps, "placeholder"> {
  mode?: DatePickerMode;
  rangeValue?: [Date | null, Date | null] | null;
  onRangeChange?: (dates: [Date | null, Date | null] | null) => void;
  placeholder?: string | [string, string];
}

export function CombinedDatePicker({
  mode = "date",
  value,
  onChange,
  rangeValue,
  onRangeChange,
  placeholder,
  ...props
}: CombinedDatePickerProps) {
  switch (mode) {
    case "week":
      return (
        <WeekPicker
          value={value}
          onChange={onChange}
          placeholder={placeholder as string}
          {...props}
        />
      );
    case "month":
      return (
        <MonthPicker
          value={value}
          onChange={onChange}
          placeholder={placeholder as string}
          {...props}
        />
      );
    case "year":
      return (
        <YearPicker
          value={value}
          onChange={onChange}
          placeholder={placeholder as string}
          {...props}
        />
      );
    case "range":
      return (
        <RangePicker
          value={rangeValue}
          onChange={onRangeChange}
          placeholder={Array.isArray(placeholder) ? placeholder : undefined}
          {...props}
        />
      );
    case "date":
    default:
      return (
        <DatePicker
          value={value}
          onChange={onChange}
          placeholder={placeholder as string}
          {...props}
        />
      );
  }
}
