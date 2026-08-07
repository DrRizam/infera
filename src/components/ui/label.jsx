import { cn } from "@/lib/utils";

export function Label({ className, ...props }) {
  return <label className={cn("text-sm font-semibold leading-none", className)} {...props} />;
}
