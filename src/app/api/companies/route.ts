import { NextResponse } from "next/server";
import { getCompanies, isCompanyLang } from "@/lib/companies";

// GET /api/companies?lang=fr|en: the companies drawn on the background cards.
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");

  return NextResponse.json(
    { companies: getCompanies(isCompanyLang(lang) ? lang : "fr") },
    // Always revalidate: the payload is tiny, and a cached copy would hide a change of shape for minutes.
    { headers: { "Cache-Control": "no-cache" } },
  );
}
