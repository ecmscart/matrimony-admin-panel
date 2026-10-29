"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  /** Static suggestions (e.g. PIN-code areas). */
  options?: string[];
  /** Async suggestion source (e.g. university search). Debounced. */
  fetchOptions?: (query: string) => Promise<string[]>;
  minChars?: number;
  maxLength?: number;
}

/**
 * Text input with native <datalist> suggestions. Accepts a static `options`
 * list or a debounced async `fetchOptions` source. Free text is always allowed.
 * Designed to be driven by react-hook-form's <Controller>.
 */
export function AutocompleteInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder,
  options,
  fetchOptions,
  minChars = 2,
  maxLength,
}: AutocompleteInputProps) {
  const listId = useId();
  const safeValue = value ?? "";
  const [dynamicOptions, setDynamicOptions] = useState<string[]>([]);
  const fetchRef = useRef(fetchOptions);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchRef.current = fetchOptions;
  }, [fetchOptions]);

  useEffect(() => {
    if (options || !fetchRef.current) return;
    const q = safeValue.trim();
    if (q.length < minChars) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchRef
        .current?.(q)
        .then((results) => setDynamicOptions(results))
        .catch(() => setDynamicOptions([]));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [safeValue, options, minChars]);

  const shown =
    options ?? (safeValue.trim().length >= minChars ? dynamicOptions : []);

  return (
    <>
      <Input
        name={name}
        value={safeValue}
        onChange={(e) => {
          const next = e.target.value;
          onChange(
            typeof maxLength === "number" ? next.slice(0, maxLength) : next,
          );
        }}
        onBlur={onBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {shown.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
