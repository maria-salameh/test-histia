import { NextResponse } from "next/server";
import { getCompanies, isCompanyLang } from "@/lib/companies";

// GET /api/companies?lang=fr|en: the companies drawn on the background cards.
// Reading the request URL makes this a dynamic route handler (not prerendered), which is what we want.
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");

  return NextResponse.json(
    // An unknown or missing language falls back to French (the default locale) instead of failing.
    { companies: getCompanies(isCompanyLang(lang) ? lang : "fr") },
    // Always revalidate: the payload is tiny, and a cached copy would hide a change of shape for minutes.
    { headers: { "Cache-Control": "no-cache" } },
  );
}
