import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { fetchCurrentUser, login, logout } from "../../api/auth.ts";
import { clearSessionHint, hasSessionHint } from "../../lib/sessionHint.ts";

export const CURRENT_USER_KEY = ["auth", "me"] as const;

/** Back to the login screen: after a logout, or when the server rejects the session (401). */
export function markSignedOut(queryClient: QueryClient): void {
  clearSessionHint();
  queryClient.setQueryData(CURRENT_USER_KEY, null);
  // Drop everything fetched under this session, so the next user never sees it.
  queryClient.removeQueries({ queryKey: ["orders"] });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: async ({ signal }) => {
      const user = await fetchCurrentUser(signal);
      // The hint outlived the session (expired or revoked on the server): remove it, so the next
      // page load goes straight to the login screen instead of asking again.
      if (!user) clearSessionHint();
      return user;
    },
    // No hint means nobody is signed in on this browser: show the login screen without a request.
    initialData: () => (hasSessionHint() ? undefined : null),
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: (user) => queryClient.setQueryData(CURRENT_USER_KEY, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    // Even if the request fails, the user asked to leave: show the login screen regardless.
    onSettled: () => markSignedOut(queryClient),
  });
}
