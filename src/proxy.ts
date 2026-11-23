import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { intlayerProxy, multipleProxies } from "next-intlayer/proxy";

/**
 * Next 16's `proxy.ts` (the former `middleware.ts`, now on the Node.js runtime) runs before a request reaches a
 * page. It has two jobs here, in this order:
 *   1. Intlayer puts the language in the URL: /login → /fr/login or /en/login, chosen from the browser's
 *      Accept-Language header (French when there is none).
 *   2. A fast guard for the connected page (below).
 */

// Optimistic guard for the connected page: no session cookie, no page. It is only a quick redirect, not
// authorization (Next's docs say proxy should not be used for that): the page itself validates the session on the
// server, see src/lib/session.ts. The language list mirrors intlayer.config.ts: add a language there and here.
const PROTECTED = /^\/(fr|en)\/account(?:\/|$)/;

const authGuard = (request: NextRequest) => {
  const match = PROTECTED.exec(request.nextUrl.pathname);
  // getSessionCookie only checks that the cookie exists: no database call, no validation. Good enough to turn
  // visitors away early, not good enough to trust, hence the second check in the page.
  if (match && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL(`/${match[1]}/login`, request.url));
  }
  return NextResponse.next();
};

// multipleProxies runs the functions in order and merges their redirects and headers.
// Order matters: first put the locale in the URL (/account → /fr/account), then guard the prefixed path.
export const proxy = multipleProxies([intlayerProxy, authGuard]);

export const config = {
  // The matcher has to be a constant: Next analyses it at build time. It skips
  //   api      Better Auth and /api/companies must never be redirected to a language prefix
  //   code     the provided developer helper page, which is not localized
  //   _next    Next's own assets
  //   .*\..*   anything with a file extension (/logo.png, /favicon.ico…)
  matcher: "/((?!api|code|_next|.*\\..*).*)",
};
