"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

/**
 * TanStack Query for the whole app: every call to the auth server is a mutation, and the company cards behind the
 * forms are a query.
 */
export function Providers({ children }: { children: ReactNode }) {
  // Created once per browser session, inside useState. A client built at module level would be shared by every
  // visitor while the page is rendered on the server.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000, // the cards rarely change: no refetch for five minutes…
            refetchOnWindowFocus: false, // …and none when the tab regains focus
            retry: false, // the overlay is decoration: fail quietly instead of retrying
            // networkMode "always": never park a request because the browser thinks it is offline (that would
            // leave a form spinning forever). The request is made, and a real failure shows up as "network".
            networkMode: "always",
          },
          mutations: {
            // Never repeat an auth call on its own: a retry could send a second code or run into a rate limit.
            retry: false,
            networkMode: "always",
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
