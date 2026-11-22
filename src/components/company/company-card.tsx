"use client";

import Image from "next/image";
import { useIntlayer } from "next-intlayer";
import type { CSSProperties } from "react";
import { CompanyStatus } from "@/components/company/company-status";
import { SectorTag } from "@/components/sectors/sector-tag";
import type { CompanyDto } from "@/lib/companies";
import { cn } from "@/lib/utils";

type Badge = "closed" | "sold";

// CLOSED and INACTIVE show the "closed" badge, ACQUIRED the "sold" one, ACTIVE nothing.
const badgeOf = (status: CompanyStatus): Badge | null => {
  switch (status) {
    case CompanyStatus.CLOSED:
    case CompanyStatus.INACTIVE:
      return "closed";
    case CompanyStatus.ACQUIRED:
      return "sold";
    default:
      return null;
  }
};

// "Closed" values are the design's. "Sold" was not specified: same recipe in amber.
const BADGE_COLORS: Record<Badge, { background: string; color: string }> = {
  closed: { background: "rgba(212, 107, 117, 0.1)", color: "#E75261" },
  sold: { background: "rgba(232, 163, 61, 0.1)", color: "#E8A33D" },
};

/**
 * The big logo only shows near the corner: the design masks it with a radial gradient (540px box, centred at
 * 12.31% / 31.85%). Stops fitted on pixel samples of the design export, which also include the mask's 50px blur.
 */
const LOGO_MASK =
  "radial-gradient(80.37% 80.37% at 12.31% 31.85%, rgb(0 0 0 / 0.26) 0%, rgb(0 0 0 / 0.16) 15%, rgb(0 0 0 / 0.066) 31%, rgb(0 0 0 / 0.02) 40%, rgb(0 0 0 / 0) 46%)";

type CompanyCardProps = {
  company: CompanyDto;
  className?: string;
  style?: CSSProperties;
};

/**
 * "Mode Carte" from the design: 552x160, black at 30% and the whole card at 30% opacity, 18px padding,
 * with the company logo bleeding out of the top-left corner (clipped by the card's rounded edge).
 */
export function CompanyCard({ company, className, style }: CompanyCardProps) {
  const sectors = useIntlayer("sectors");
  const statuses = useIntlayer("company-status");
  const badge = badgeOf(company.status);

  return (
    <article
      style={style}
      className={cn(
        "relative h-[160px] w-[552px] overflow-hidden rounded-[10px] bg-black/30 tracking-normal opacity-30 shadow-[0_0_30px_2px_rgba(255,255,255,0.15)]",
        className,
      )}
    >
      {/* Big logo: a 300px frame in the brand colour holding the 237.5px logo, seen through the radial mask. */}
      <div
        aria-hidden
        className="absolute -top-[177px] -left-[70px] size-[540px]"
        style={{ maskImage: LOGO_MASK, WebkitMaskImage: LOGO_MASK }}
      >
        <span
          className="absolute top-[85px] -left-[24px] size-[300px] rounded-[100px]"
          style={{ background: company.color }}
        />
        <Image
          src={company.logo}
          alt=""
          width={240}
          height={240}
          className="absolute top-[116.27px] left-[7.27px] size-[237.5px] rounded-[100px]"
        />
      </div>

      <div className="relative flex h-full flex-col items-start gap-[19px] p-[18px]">
        <div className="flex w-full flex-col gap-[15px]">
          <div className="flex w-full items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="relative block size-[38px] shrink-0 rounded-full"
                style={{ background: company.color }}
              >
                <Image
                  src={company.logo}
                  alt=""
                  width={32}
                  height={32}
                  className="absolute top-[3.96px] left-[3.96px] size-[30.08px] rounded-full"
                />
              </span>
              <h3 className="text-[20px] leading-6 font-bold text-white">{company.name}</h3>
            </div>
            {badge && (
              <span
                className="flex h-6 items-center rounded-[4px] px-2 py-1 text-xs leading-4 font-medium"
                style={BADGE_COLORS[badge]}
              >
                {`${statuses[badge]}`}
              </span>
            )}
          </div>
          <p className="line-clamp-2 h-9 w-[378px] text-[13px] leading-[18px] text-white">{company.description}</p>
        </div>

        <ul className="flex items-center gap-[26px]">
          {company.sectors.map((sector) => (
            <li key={sector}>
              <SectorTag
                sector={sector}
                label={`${sectors[sector]}`}
                variant="empty-small"
                isMonochrome
                // The provided tag has its own padding and gap; the card wants none and 6px (hence the !).
                className="gap-1.5! py-0! [&>p]:leading-4"
              />
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
