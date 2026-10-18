import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ApiError } from "./api/http.ts";
import { App } from "./App.tsx";
import { markSignedOut } from "./features/auth/useAuth.ts";
import "./index.css";

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    // A 401 on any data query means the session expired or was revoked: back to the login screen.
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) markSignedOut(queryClient);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry once on network/server errors; a 4xx will not change by asking again.
      retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing #root element in index.html");

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
