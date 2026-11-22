import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormAlertProps = {
  tone?: "danger" | "success";
  children: ReactNode;
  className?: string;
};

/** A message about the whole form: a refused sign-in, a rate limit, a confirmation. Not in the design. */
export function FormAlert({ tone = "danger", children, className }: FormAlertProps) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-sm px-4 py-3 text-sx",
        tone === "danger" ? "bg-danger-100 text-[#ff9aa4]" : "bg-success-100 text-[#8be5a1]",
        className,
      )}
    >
      {children}
    </p>
  );
}
