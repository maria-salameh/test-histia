"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // networkMode "always": never park a request because the browser thinks it is offline (that would leave
          // a form spinning forever). The request is made, and a real failure shows up as the "network" error.
          queries: { staleTime: 5 * 60_000, refetchOnWindowFocus: false, retry: false, networkMode: "always" },
          mutations: { retry: false, networkMode: "always" },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
