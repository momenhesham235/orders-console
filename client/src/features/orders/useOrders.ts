import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchOrders, type OrderFilters } from "../../api/orders.ts";

// Why a slow, earlier response can never overwrite the latest one:
// 1. Every response is cached under the filters that requested it (the query key). The
//    component only ever reads the entry for the *current* filters, so a late answer for
//    old filters lands in the old entry and is never rendered.
// 2. The AbortSignal is passed to fetch, so when the filters change, the request for the
//    abandoned key is cancelled instead of finishing in the background.
export function useOrders(filters: OrderFilters) {
  return useInfiniteQuery({
    queryKey: ["orders", filters],
    queryFn: ({ pageParam, signal }) => fetchOrders(filters, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
