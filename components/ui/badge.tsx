import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-(--color-primary) text-(--color-primary-foreground)",
        secondary: "border-transparent bg-(--color-surface-muted) text-(--color-foreground)",
        success: "border-transparent bg-(--color-success) text-(--color-success-foreground)",
        danger: "border-transparent bg-(--color-danger) text-(--color-danger-foreground)",
        warning: "border-transparent bg-(--color-warning) text-(--color-warning-foreground)",
        outline: "text-(--color-foreground)",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
