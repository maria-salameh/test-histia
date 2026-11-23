import { getIntlayer } from "intlayer";
import Image from "next/image";
import { locale } from "next/root-params";
import { type ReactNode, Suspense } from "react";
import { FleetOverlay } from "@/components/company/fleet-overlay";

/**
 * Everything around an auth card: the glowing background, the faded company cards, the logo.
 * The card is centred a little below the middle of the screen, as in the design, while the logo keeps one spot
 * (and a card too tall for that stops under the logo instead of covering it).
 */
export async function AuthShell({ children }: { children: ReactNode }) {
  // The locale comes from the URL segment, so this stays part of the static shell (no request data needed).
  const common = getIntlayer("common", await locale());

  return (
    // tracking-normal: the design's text has no letter-spacing (the app-wide -0.02em made every line too narrow).
    <div className="auth-backdrop relative isolate flex min-h-dvh flex-1 flex-col overflow-hidden tracking-normal">
      {/* Loads its cards on the client: the page is ready without waiting for them. */}
      <Suspense fallback={null}>
        <FleetOverlay />
      </Suspense>
      <Image
        src="/logo.png"
        alt={common.logoAlt}
        width={169}
        height={167}
        loading="eager"
        fetchPriority="high"
        className="auth-logo z-10"
      />
      {/* The padding keeps the card below the logo; `auth-card-slot` puts its centre at 56% of the height (globals.css). */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pt-(--auth-card-top) pb-(--auth-card-gap)">
        <div className="auth-card-slot flex w-full justify-center">{children}</div>
      </main>
    </div>
  );
}
