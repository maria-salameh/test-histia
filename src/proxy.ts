import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { intlayerProxy, multipleProxies } from "next-intlayer/proxy";

// Optimistic guard for the connected page: no session cookie, no page. It is only a fast redirect;
// the page itself still checks the session on the server (see src/lib/session.ts).
const PROTECTED = /^\/(fr|en)\/account(?:\/|$)/;

const authGuard = (request: NextRequest) => {
  const match = PROTECTED.exec(request.nextUrl.pathname);
  if (match && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL(`/${match[1]}/login`, request.url));
  }
  return NextResponse.next();
};

// Order matters: first put the locale in the URL (/login → /fr/login), then guard the prefixed path.
export const proxy = multipleProxies([intlayerProxy, authGuard]);

export const config = {
  // Skip the API, the /code helper page, Next internals and anything with a file extension.
  matcher: "/((?!api|code|_next|.*\\..*).*)",
};
