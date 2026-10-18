import { ORDER_STATUSES, type OrderStatus, type SortDirection, type SortField } from "../../api/orders.ts";

export const SORT_OPTIONS = {
  newest: { label: "Newest first", sort: "createdAt", direction: "desc" },
  oldest: { label: "Oldest first", sort: "createdAt", direction: "asc" },
  highest: { label: "Highest amount", sort: "total", direction: "desc" },
  lowest: { label: "Lowest amount", sort: "total", direction: "asc" },
} satisfies Record<string, { label: string; sort: SortField; direction: SortDirection }>;

export type SortOption = keyof typeof SORT_OPTIONS;

const DEFAULT_SORT: SortOption = "newest";

export interface FilterParams {
  search: string;
  status: OrderStatus | "";
  sort: SortOption;
}

function isOrderStatus(value: string | null): value is OrderStatus {
  return ORDER_STATUSES.some((status) => status === value);
}

function isSortOption(value: string | null): value is SortOption {
  return value !== null && Object.hasOwn(SORT_OPTIONS, value);
}

/** Filters from the address bar, e.g. ?q=alharbi&status=pending&sort=highest. Unknown values fall back to defaults. */
export function readFilterParams(): FilterParams {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const sort = params.get("sort");
  return {
    search: params.get("q") ?? "",
    status: isOrderStatus(status) ? status : "",
    sort: isSortOption(sort) ? sort : DEFAULT_SORT,
  };
}

/**
 * Mirrors the filters into the address bar so a refresh, a bookmark or a shared link reopens the
 * same view. replaceState rather than pushState: filter changes do not pile up as history entries,
 * so Back leaves the page instead of stepping through every keystroke.
 */
export function writeFilterParams({ search, status, sort }: FilterParams): void {
  const params = new URLSearchParams(window.location.search);
  const setOrDelete = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
  setOrDelete("q", search);
  setOrDelete("status", status);
  setOrDelete("sort", sort === DEFAULT_SORT ? "" : sort);

  const query = params.toString();
  const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
  if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", url);
  }
}
