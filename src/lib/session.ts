import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * The current session, read on the server (null when signed out or expired).
 * It reads the request cookies, so with Cache Components it must be called behind a <Suspense> boundary.
 */
export const getSession = async () => auth.api.getSession({ headers: await headers() });
