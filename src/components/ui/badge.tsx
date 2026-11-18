import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-medium",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400 font-medium",
        info: "border-sky-500/30 bg-sky-500/10 text-sky-400 font-medium",
        tier1: "border-purple-500/40 bg-purple-500/15 text-purple-300 font-semibold",
        tier2: "border-indigo-500/40 bg-indigo-500/15 text-indigo-300 font-semibold",
        tier3: "border-blue-500/40 bg-blue-500/15 text-blue-300 font-semibold",
        tier4: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-semibold",
        brand: "border-indigo-500/40 bg-indigo-500/20 text-indigo-300 font-semibold shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
