"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intlayer";
import { CompanyCard } from "@/components/company/company-card";
import type { CompanyDto } from "@/lib/companies";

// Width of a card in the design (px). Needed to place the left-hand cards by their right edge.
const CARD_WIDTH = 552;

/**
 * Where the eight cards sit on the 1920x1080 design, as shares of the viewport. Left cards are placed by their
 * right edge, right cards by their left edge, so the cut-off at the screen borders stays the same.
 * On 1400x900 the cards keep their place relative to the screen and stay clear of the centre card.
 * `edge` and `top` are percentages of the viewport width and height; the numbers were measured on the Figma frame.
 */
const SLOTS = [
  { side: "left", edge: 21.6, top: 5.5 },
  { side: "left", edge: 14, top: 29.4 },
  { side: "left", edge: 22.8, top: 54.4 },
  { side: "left", edge: 17.9, top: 79.4 },
  { side: "right", edge: 77.4, top: 6.2 },
  { side: "right", edge: 85.1, top: 30.3 },
  { side: "right", edge: 79.4, top: 55.6 },
  { side: "right", edge: 85.3, top: 78.6 },
] as const;

// The browser calls the route handler (src/app/api/companies/route.ts); the content comes from the server.
const fetchCompanies = async (lang: string): Promise<CompanyDto[]> => {
  const response = await fetch(`/api/companies?lang=${lang}`);
  if (!response.ok) throw new Error("Could not load the companies");
  const body: { companies: CompanyDto[] } = await response.json();
  return body.companies;
};

/** The faded "fleet" behind the card. Pure decoration: if loading fails, the background simply stays empty. */
export function FleetOverlay() {
  const { locale } = useLocale();
  // The language is part of the query key: /fr and /en are cached separately, each with its own descriptions.
  const { data } = useQuery({ queryKey: ["companies", locale], queryFn: () => fetchCompanies(locale) });

  return (
    // aria-hidden: decoration only, nothing for assistive technology. pointer-events-none: never steals a click
    // from the form. -z-10: behind everything (the shell creates the stacking context with `isolate`).
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* As many cards as there are slots; the server may return more. */}
      {data?.slice(0, SLOTS.length).map((company, index) => {
        const slot = SLOTS[index];
        return (
          <CompanyCard
            key={company.id}
            company={company}
            className="animate-card-in absolute" // fades in once the data arrives (keyframes in globals.css)
            style={{
              top: `${slot.top}%`,
              // Left cards: their right edge sits at `edge`% of the width, so shift left by one card width.
              left: slot.side === "left" ? `calc(${slot.edge}% - ${CARD_WIDTH}px)` : `${slot.edge}%`,
            }}
          />
        );
      })}
    </div>
  );
}
