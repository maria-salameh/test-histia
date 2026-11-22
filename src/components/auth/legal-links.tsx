import { useIntlayer } from "next-intlayer";
import { cn } from "@/lib/utils";

/** "Conditions d'utilisation | Politique de confidentialité". The pages behind them are out of scope. */
export function LegalLinks({ className }: { className?: string }) {
  const common = useIntlayer("common");
  const linkClass = "hover:underline focus-visible:underline";

  return (
    <nav aria-label={`${common.legalLinks}`} className={cn("flex items-center justify-center gap-3 text-xs-plus text-white", className)}>
      <a href="#terms" className={linkClass}>
        {common.terms}
      </a>
      <span aria-hidden className="h-3 w-px bg-white/40" />
      <a href="#privacy" className={linkClass}>
        {common.privacy}
      </a>
    </nav>
  );
}
