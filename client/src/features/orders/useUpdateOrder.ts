import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/http.ts";
import { updateOrder, type UpdateOrderInput } from "../../api/orders.ts";
import { markSignedOut } from "../auth/useAuth.ts";

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateOrderInput }) => updateOrder(id, input),
    // No automatic retry, unlike create: if a first attempt was saved but its response was lost,
    // the retry would be refused with 409 (the version has moved on) and wrongly blame "someone else".
    retry: false,
    // An edit can move the order in or out of the current filter (status, name) or change its place
    // in the sort (total), so refetch the visible list instead of patching the row in place.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) markSignedOut(queryClient);
      if (error instanceof ApiError && error.status === 404) void queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
