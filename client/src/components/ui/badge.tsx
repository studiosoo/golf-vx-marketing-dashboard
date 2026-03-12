import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        // Primary — Golf VX yellow for active/primary state
        default:
          "border-transparent bg-[#F2DD48] text-[#111111] [a&]:hover:brightness-95",
        // Secondary — neutral gray for inactive/default labels
        secondary:
          "border-transparent bg-[#F2F2F7] text-[#555555] [a&]:hover:bg-[#E8E8ED]",
        // Destructive — muted red for error/expired states
        destructive:
          "border-transparent bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20 [a&]:hover:bg-[#FF3B30]/15",
        // Outline — quiet border-only treatment
        outline:
          "text-[#555555] border-[#E0E0E0] [a&]:hover:bg-[#F5F5F5]",
        // Success — soft green for healthy/connected/active states (§20.3)
        success:
          "border-transparent bg-[#3DB855]/12 text-[#2A9040] border-[#3DB855]/20",
        // Warning — soft orange for caution/renewal-soon/action-needed states (§20.3)
        warning:
          "border-transparent bg-[#F59E0B]/12 text-[#B45309] border-[#F59E0B]/20",
        // Info — soft blue for informational/functional states (§20.3)
        info:
          "border-transparent bg-[#3B82F6]/10 text-[#1D4ED8] border-[#3B82F6]/20",
        // Muted — gray for inactive/missing/disconnected states (§20.3)
        muted:
          "border-transparent bg-[#F2F2F7] text-[#AAAAAA] border-[#E0E0E0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
