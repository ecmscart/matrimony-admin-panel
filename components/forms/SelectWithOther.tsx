"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { FieldOption } from "@/lib/constants/profile-options";

const OTHER_RE = /^others?$/i;

interface SelectWithOtherProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: FieldOption[];
  placeholder?: string;
  maxLength?: number;
  sanitize?: (value: string) => string;
}

/**
 * Single-select dropdown that reveals a "please specify" text box when the
 * "Other"/"Others" option is chosen (or when the stored value is a custom entry
 * not present in `options`). The typed value replaces the sentinel so the
 * profile stores real text.
 */
export function SelectWithOther({
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Select",
  maxLength,
  sanitize,
}: SelectWithOtherProps) {
  const otherOption = options.find(
    (opt) => OTHER_RE.test(opt.value) || OTHER_RE.test(opt.label),
  );
  const optionValues = options.map((opt) => opt.value);
  const isKnown = value === "" || optionValues.includes(value);
  const isSentinel = Boolean(otherOption && OTHER_RE.test(value));
  const [otherManual, setOtherManual] = useState(false);

  const otherMode =
    !!otherOption && (otherManual || isSentinel || (value !== "" && !isKnown));
  const selectValue = otherMode ? (otherOption?.value ?? "") : value;
  const inputValue = isSentinel ? "" : value;

  return (
    <>
      <Select
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (otherOption && next === otherOption.value) {
            setOtherManual(true);
            onChange("");
          } else {
            setOtherManual(false);
            onChange(next);
          }
        }}
        onBlur={onBlur}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {otherMode && (
        <Input
          className="mt-2"
          placeholder={
            maxLength
              ? `Please specify (letters only, max ${maxLength})`
              : "Please specify"
          }
          value={inputValue}
          maxLength={maxLength}
          onChange={(e) =>
            onChange(sanitize ? sanitize(e.target.value) : e.target.value)
          }
          onBlur={onBlur}
        />
      )}
    </>
  );
}
