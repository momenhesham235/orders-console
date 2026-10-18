import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/http.ts";
import { createOrder, type CreateOrderInput } from "../../api/orders.ts";
import { markSignedOut } from "../auth/useAuth.ts";

// Network failures, timeouts and 5xx may or may not have reached the server; a 4xx is a definite answer.
export function isRetryable(error: unknown): boolean {
  return !(error instanceof ApiError) || error.status >= 500;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateOrderInput; idempotencyKey: string }) =>
      createOrder(input, idempotencyKey),
    // Retrying a create automatically is safe only because every attempt carries the same
    // Idempotency-Key: if an earlier attempt did succeed, the retry returns that same order.
    retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) markSignedOut(queryClient);
    },
  });
}
