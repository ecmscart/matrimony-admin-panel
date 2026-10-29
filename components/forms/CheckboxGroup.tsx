"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { FieldOption } from "@/lib/constants/profile-options";

interface CheckboxGroupProps {
  options: FieldOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

const OTHER_RE = /^others?$/i;

/**
 * Multi-select rendered as a grid of checkboxes. When the option list contains
 * an "Other"/"Others" entry, checking it reveals a text box for adding custom
 * values (stored directly in the array). Selected values that are not part of
 * `options` (custom or legacy free-text) are shown as their own checkboxes so
 * they can be removed.
 */
export function CheckboxGroup({
  options,
  value,
  onChange,
  className,
}: CheckboxGroupProps) {
  const otherOption = options.find(
    (opt) => OTHER_RE.test(opt.value) || OTHER_RE.test(opt.label),
  );
  const baseOptions = options.filter((opt) => opt !== otherOption);
  const baseValues = new Set(baseOptions.map((opt) => opt.value));

  // Custom entries = selected values that are neither a base option nor the
  // "Other" sentinel itself.
  const customValues = value.filter(
    (v) => !baseValues.has(v) && !(otherOption && v === otherOption.value),
  );

  const sentinelSelected = !!otherOption && value.includes(otherOption.value);
  const [otherManual, setOtherManual] = useState(false);
  const [otherText, setOtherText] = useState("");
  const otherActive =
    !!otherOption &&
    (customValues.length > 0 || sentinelSelected || otherManual);

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const toggleOther = () => {
    if (otherActive) {
      // Turn off: drop custom entries and the sentinel, keep base selections.
      onChange(value.filter((v) => baseValues.has(v)));
      setOtherManual(false);
      setOtherText("");
    } else {
      setOtherManual(true);
    }
  };

  const addCustom = () => {
    const next = otherText.trim();
    if (!next) return;
    const withoutSentinel = value.filter(
      (v) => !(otherOption && v === otherOption.value),
    );
    if (!withoutSentinel.includes(next)) {
      onChange([...withoutSentinel, next]);
    }
    setOtherText("");
  };

  const gridItems: FieldOption[] = [
    ...baseOptions,
    ...customValues.map((v) => ({ value: v, label: v })),
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-2 gap-2 rounded-[var(--radius)] border border-(--color-input) bg-(--color-surface) p-3 sm:grid-cols-3">
        {gridItems.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 text-sm cursor-pointer"
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-(--color-primary)"
              checked={value.includes(opt.value)}
              onChange={() => toggle(opt.value)}
            />
            <span>{opt.label}</span>
          </label>
        ))}
        {otherOption && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 accent-(--color-primary)"
              checked={otherActive}
              onChange={toggleOther}
            />
            <span>{otherOption.label}</span>
          </label>
        )}
      </div>
      {otherActive && (
        <div className="flex gap-2">
          <Input
            value={otherText}
            placeholder="Add other — type and press Enter"
            onChange={(e) => setOtherText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            className="shrink-0 rounded-[var(--radius)] border border-(--color-input) px-3 text-sm hover:bg-black/5"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
