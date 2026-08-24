import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-hover inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-extrabold transition-[transform,border-width] focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground border-b-4 border-primary-shade active:translate-y-[3px] active:border-b-0",
        secondary: "bg-secondary text-secondary-foreground border-b-4 border-secondary-shade active:translate-y-[3px] active:border-b-0",
        outline: "border-2 border-border bg-transparent hover:bg-muted",
        ghost: "bg-transparent hover:bg-muted",
        destructive: "bg-destructive text-destructive-foreground border-b-4 border-destructive-shade active:translate-y-[3px] active:border-b-0",
      },
      size: {
        default: "h-12 px-5 py-2",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-7 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export const Button = forwardRef(function Button({ className, variant, size, ...props }, ref) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
