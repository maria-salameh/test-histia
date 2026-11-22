import { NextResponse } from "next/server";
import { getCompanies, isCompanyLang } from "@/lib/companies";

// GET /api/companies?lang=fr|en: the companies drawn on the background cards.
export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");

  return NextResponse.json(
    { companies: getCompanies(isCompanyLang(lang) ? lang : "fr") },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
