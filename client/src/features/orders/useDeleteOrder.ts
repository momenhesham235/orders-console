import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { ApiError } from "../../api/http.ts";
import { deleteOrder, type OrderSummary, type OrdersPage } from "../../api/orders.ts";
import { CURRENT_USER_KEY, markSignedOut } from "../auth/useAuth.ts";

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  // Remove the row from every cached list in place. No refetch of the loaded pages is needed:
  // keyset cursors are positions ("after this value and id"), not offsets, so removing a row
  // never shifts the pages that follow. Other filter sets are marked stale and refetch when
  // they are next shown.
  function removeFromLists(orderId: number) {
    queryClient.setQueriesData<InfiniteData<OrdersPage>>({ queryKey: ["orders"] }, (data) =>
      data
        ? { ...data, pages: data.pages.map((page) => ({ ...page, orders: page.orders.filter((o) => o.id !== orderId) })) }
        : data,
    );
    void queryClient.invalidateQueries({ queryKey: ["orders"], refetchType: "none" });
  }

  return useMutation({
    mutationFn: (order: OrderSummary) => deleteOrder(order.id),
    onSuccess: (_result, order) => removeFromLists(order.id),
    onError: (error, order) => {
      if (!(error instanceof ApiError)) return;
      if (error.status === 401) markSignedOut(queryClient);
      // The role may have changed since the page loaded: re-read it, so the button disappears.
      if (error.status === 403) void queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY });
      // Someone else already deleted it: the list should not keep showing it.
      if (error.status === 404) removeFromLists(order.id);
    },
  });
}
