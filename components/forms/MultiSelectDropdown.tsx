"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { FieldOption } from "@/lib/constants/profile-options";

interface MultiSelectDropdownProps {
  options: FieldOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
}

/**
 * Compact multi-select dropdown with search, selected chips, checkbox-style
 * toggling and optional free-text ("Add ...") entries. Selected values not in
 * `options` still render (their raw value is shown as the label).
 */
export function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Select...",
  allowCustom = true,
  className,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const labelFor = (val: string) =>
    options.find((opt) => opt.value === val)?.label ?? val;

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  const searchTrim = search.trim();
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTrim.toLowerCase()),
  );

  const canAddCustom =
    allowCustom &&
    searchTrim.length > 0 &&
    !options.some((opt) => opt.label.toLowerCase() === searchTrim.toLowerCase()) &&
    !value.some((v) => v.toLowerCase() === searchTrim.toLowerCase());

  const addCustom = () => {
    if (!canAddCustom) return;
    onChange([...value, searchTrim]);
    setSearch("");
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius)] border border-(--color-input) bg-(--color-surface) px-3 text-left text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring)"
      >
        <span
          className={value.length ? "" : "text-(--color-muted-foreground)"}
        >
          {value.length ? `${value.length} selected` : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-(--color-muted-foreground)" />
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-(--color-surface-muted) px-2.5 py-1 text-xs font-medium"
            >
              {labelFor(v)}
              <button
                type="button"
                onClick={() => toggle(v)}
                aria-label={`Remove ${labelFor(v)}`}
                className="text-(--color-muted-foreground) hover:text-(--color-foreground)"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-[var(--radius)] border border-(--color-input) bg-(--color-surface) p-2 shadow-lg">
          <Input
            autoFocus
            value={search}
            placeholder="Search or add..."
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <div className="mt-2 max-h-52 overflow-auto">
            {filtered.map((opt) => {
              const selected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="flex w-full items-center justify-between rounded-[var(--radius)] px-2 py-1.5 text-left text-sm hover:bg-(--color-surface-muted)"
                >
                  <span>{opt.label}</span>
                  {selected && <Check className="h-4 w-4 text-(--color-primary)" />}
                </button>
              );
            })}
            {canAddCustom && (
              <button
                type="button"
                onClick={addCustom}
                className="flex w-full items-center rounded-[var(--radius)] px-2 py-1.5 text-left text-sm font-medium text-(--color-primary) hover:bg-(--color-surface-muted)"
              >
                Add &ldquo;{searchTrim}&rdquo;
              </button>
            )}
            {filtered.length === 0 && !canAddCustom && (
              <p className="px-2 py-1.5 text-sm text-(--color-muted-foreground)">
                No matches
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
