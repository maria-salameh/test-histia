import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The glass card every auth screen sits in: 596px wide with 48px of padding (500px for text). Fields and
 * buttons use `AUTH_FORM_WIDTH` so they stay a little narrower than the text, as in the design.
 */
export function AuthCard({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("glassmorphism w-full max-w-[37.25rem] rounded-m px-12 py-12", className)}
      {...props}
    />
  );
}

/** Width of fields, tabs and buttons inside a card (480px on the design). */
export const AUTH_FORM_WIDTH = "mx-auto w-full max-w-[30rem]";

/** The two-line explanation under the title of the forgot-password screens. */
export const AUTH_DESCRIPTION_CLASS = "max-w-[30.75rem] text-[0.9375rem] leading-[1.27]";

/** Title (and optional description) at the top of a card. */
export function AuthCardHeader({
  title,
  description,
  titleId,
  descriptionClassName = "text-s leading-6",
}: {
  title: string;
  description?: string;
  titleId?: string;
  descriptionClassName?: string;
}) {
  return (
    <header className="flex flex-col items-center gap-2 text-center">
      <h1 id={titleId} className="text-lm leading-8 font-semibold text-white">
        {title}
      </h1>
      {description && <p className={cn("text-white", descriptionClassName)}>{description}</p>}
    </header>
  );
}
