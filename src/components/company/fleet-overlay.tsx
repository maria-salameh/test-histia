"use client";

import { useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intlayer";
import { CompanyCard } from "@/components/company/company-card";
import type { CompanyDto } from "@/lib/companies";

const CARD_WIDTH = 552;

/**
 * Where the eight cards sit on the 1920x1080 design, as shares of the viewport. Left cards are placed by their
 * right edge, right cards by their left edge, so the cut-off at the screen borders stays the same.
 * On 1400x900 the cards keep their place relative to the screen and stay clear of the centre card.
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

const fetchCompanies = async (lang: string): Promise<CompanyDto[]> => {
  const response = await fetch(`/api/companies?lang=${lang}`);
  if (!response.ok) throw new Error("Could not load the companies");
  const body: { companies: CompanyDto[] } = await response.json();
  return body.companies;
};

/** The faded "fleet" behind the card. Pure decoration: if loading fails, the background simply stays empty. */
export function FleetOverlay() {
  const { locale } = useLocale();
  const { data } = useQuery({ queryKey: ["companies", locale], queryFn: () => fetchCompanies(locale) });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {data?.slice(0, SLOTS.length).map((company, index) => {
        const slot = SLOTS[index];
        return (
          <CompanyCard
            key={company.id}
            company={company}
            className="animate-card-in absolute"
            style={{
              top: `${slot.top}%`,
              left: slot.side === "left" ? `calc(${slot.edge}% - ${CARD_WIDTH}px)` : `${slot.edge}%`,
            }}
          />
        );
      })}
    </div>
  );
}
