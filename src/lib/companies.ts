import { CompanyStatus } from "@/components/company/company-status";
import type { Sector } from "@/components/sectors/sectors";

/**
 * The companies shown on the background cards. The content (name, description, sectors, status) is served by
 * GET /api/companies: the front end only knows how to draw a card, and translates the sector and status
 * labels from their identifiers. Descriptions are editorial text, so the server returns them per language.
 *
 * The data is a TypeScript module because the brief only asks for an endpoint. Swapping it for a database
 * (Prisma) would change this file only: the route handler and the DTO below stay as they are.
 */

export const COMPANY_LANGS = ["fr", "en"] as const;
export type CompanyLang = (typeof COMPANY_LANGS)[number];

// A type guard: after it, TypeScript knows `value` is "fr" | "en" (used to validate the ?lang= query parameter).
export const isCompanyLang = (value: string | null): value is CompanyLang =>
  COMPANY_LANGS.some((lang) => lang === value);

/** What the endpoint returns for one company (and what the card receives). */
export type CompanyDto = {
  id: string;
  name: string;
  description: string;
  sectors: Sector[]; // identifiers: the front end translates them
  status: CompanyStatus; // identifier too: "CLOSED" / "ACQUIRED" show a badge, "ACTIVE" none
  /** Brand colour behind the round logo. */
  color: string;
  /** The company logo, drawn in the avatar and, big and faint, at the corner of the card. */
  logo: string;
};

// The stored form: same as the DTO, but with the description in every language.
type CompanyRecord = Omit<CompanyDto, "description"> & { description: Record<CompanyLang, string> };

// `satisfies` checks the shape (and the sector identifiers) without widening the literal types.
const doctolib = {
  name: "Doctolib",
  description: {
    fr: "Plateforme numérique facilitant la prise de rendez-vous médicaux et la gestion des consultations",
    en: "Digital platform that makes booking medical appointments and managing consultations easier",
  },
  sectors: ["HEALTHCARE", "SOFTWARE", "ARTIFICIAL_INTELLIGENCE"],
  color: "#1379CD",
  logo: "/D.png",
} satisfies Omit<CompanyRecord, "id" | "status">;

// Eight cards fill the background; the design shows the same company, in different states, on all of them.
const COMPANIES: CompanyRecord[] = [
  { id: "cmp_01", ...doctolib, status: CompanyStatus.CLOSED },
  { id: "cmp_02", ...doctolib, status: CompanyStatus.ACTIVE },
  { id: "cmp_03", ...doctolib, status: CompanyStatus.ACTIVE },
  { id: "cmp_04", ...doctolib, status: CompanyStatus.ACQUIRED },
  { id: "cmp_05", ...doctolib, status: CompanyStatus.ACTIVE },
  { id: "cmp_06", ...doctolib, status: CompanyStatus.ACTIVE },
  { id: "cmp_07", ...doctolib, status: CompanyStatus.ACTIVE },
  { id: "cmp_08", ...doctolib, status: CompanyStatus.ACTIVE },
];

// Picks the description in the requested language and returns the DTO shape.
export const getCompanies = (lang: CompanyLang): CompanyDto[] =>
  COMPANIES.map(({ description, ...company }) => ({ ...company, description: description[lang] }));
