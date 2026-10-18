import { useEffect, useMemo, useState } from "react";
import {
  ORDER_STATUSES,
  type OrderFilters,
  type OrderStatus,
  type OrderSummary,
  type SortDirection,
  type SortField,
} from "../../api/orders.ts";
import { useDebouncedValue } from "../../lib/useDebouncedValue.ts";
import { CreateOrderForm } from "./CreateOrderForm.tsx";
import { OrdersTable } from "./OrdersTable.tsx";

const SEARCH_DEBOUNCE_MS = 300;
const TOAST_DURATION_MS = 5_000;

const SORT_OPTIONS = {
  newest: { label: "Newest first", sort: "createdAt", direction: "desc" },
  oldest: { label: "Oldest first", sort: "createdAt", direction: "asc" },
  highest: { label: "Highest amount", sort: "total", direction: "desc" },
  lowest: { label: "Lowest amount", sort: "total", direction: "asc" },
} satisfies Record<string, { label: string; sort: SortField; direction: SortDirection }>;

type SortOption = keyof typeof SORT_OPTIONS;

export function OrdersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isCreating, setIsCreating] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<OrderSummary | null>(null);

  // One request once typing pauses, instead of one per keystroke.
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  const filters = useMemo<OrderFilters>(() => {
    const { sort, direction } = SORT_OPTIONS[sortOption];
    return { search: search || undefined, status: status || undefined, sort, direction };
  }, [search, status, sortOption]);

  const hasActiveFilters = Boolean(filters.search || filters.status);

  function clearFilters() {
    setSearchInput("");
    setStatus("");
  }

  useEffect(() => {
    if (!createdOrder) return;
    const timer = setTimeout(() => setCreatedOrder(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [createdOrder]);

  return (
    <section className="orders-page">
      {isCreating && (
        <CreateOrderForm
          onCreated={(order) => {
            setCreatedOrder(order);
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {/* Fixed-position toast, so it never pushes the list down. */}
      {createdOrder && (
        <p className="toast" role="status">
          Order #{createdOrder.id} created for {createdOrder.customerName}.
        </p>
      )}

      <div className="toolbar">
        <label className="field field--grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Customer name or email"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </label>

        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus | "")}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value[0]!.toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Sort</span>
          <select value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
            {Object.entries(SORT_OPTIONS).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="button-primary toolbar-action" onClick={() => setIsCreating(true)}>
          New order
        </button>
      </div>

      {/* Remount per filter set: scroll position resets, and the previous query loses its observer and is cancelled. */}
      <OrdersTable
        key={JSON.stringify(filters)}
        filters={filters}
        onClearFilters={hasActiveFilters ? clearFilters : undefined}
      />
    </section>
  );
}
