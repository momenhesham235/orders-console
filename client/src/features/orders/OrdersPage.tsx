import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchOrder,
  ORDER_STATUSES,
  type OrderDetail,
  type OrderFilters,
  type OrderStatus,
  type OrderSummary,
} from "../../api/orders.ts";
import { describeError } from "../../lib/describeError.ts";
import { useDebouncedValue } from "../../lib/useDebouncedValue.ts";
import { DeleteOrderDialog } from "./DeleteOrderDialog.tsx";
import { readFilterParams, SORT_OPTIONS, writeFilterParams, type SortOption } from "./filterParams.ts";
import { OrderFormModal } from "./OrderFormModal.tsx";
import { OrdersTable } from "./OrdersTable.tsx";

const SEARCH_DEBOUNCE_MS = 300;
const TOAST_DURATION_MS = 5_000;

interface Toast {
  message: string;
  tone: "success" | "error";
}

interface OrdersPageProps {
  /** UI only: decides whether Delete buttons are shown. The server is what enforces the role. */
  canDelete: boolean;
}

export function OrdersPage({ canDelete }: OrdersPageProps) {
  // Start from the address bar, so a refresh or a shared link reopens the same view.
  const [initialParams] = useState(readFilterParams);
  const [searchInput, setSearchInput] = useState(initialParams.search);
  const [status, setStatus] = useState<OrderStatus | "">(initialParams.status);
  const [sortOption, setSortOption] = useState<SortOption>(initialParams.sort);
  const [isCreating, setIsCreating] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrderDetail | null>(null);
  const [openingOrderId, setOpeningOrderId] = useState<number | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderSummary | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // One request once typing pauses, instead of one per keystroke.
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  const filters = useMemo<OrderFilters>(() => {
    const { sort, direction } = SORT_OPTIONS[sortOption];
    return { search: search || undefined, status: status || undefined, sort, direction };
  }, [search, status, sortOption]);

  // The debounced search, not every keystroke, goes into the URL.
  useEffect(() => writeFilterParams({ search, status, sort: sortOption }), [search, status, sortOption]);

  const hasActiveFilters = Boolean(filters.search || filters.status);
  // From the inputs, not the debounced filters, so the button appears as soon as you type.
  const hasFilterInput = Boolean(searchInput.trim() || status);

  function clearFilters() {
    setSearchInput("");
    setStatus("");
    searchInputRef.current?.focus();
  }

  // The list row only has a summary, so load the full order (items and version) before opening
  // the form. Fetched fresh every time: the version must be current, or saving would conflict.
  async function openEditor(order: OrderSummary) {
    setOpeningOrderId(order.id);
    try {
      const detail = await queryClient.fetchQuery({
        queryKey: ["order", order.id],
        queryFn: ({ signal }) => fetchOrder(order.id, signal),
        staleTime: 0,
      });
      setOrderToEdit(detail);
    } catch (error) {
      setToast({ message: `Could not open order #${order.id}. ${describeError(error)}`, tone: "error" });
    } finally {
      setOpeningOrderId(null);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <section className="orders-page">
      {isCreating && (
        <OrderFormModal
          mode="create"
          onSaved={(order) => {
            setToast({ message: `Order #${order.id} created for ${order.customerName}.`, tone: "success" });
            setIsCreating(false);
          }}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {orderToEdit && (
        <OrderFormModal
          mode="edit"
          order={orderToEdit}
          onSaved={(order) => {
            setToast({ message: `Order #${order.id} updated.`, tone: "success" });
            setOrderToEdit(null);
          }}
          onCancel={() => setOrderToEdit(null)}
        />
      )}

      {orderToDelete && (
        <DeleteOrderDialog
          order={orderToDelete}
          onDeleted={(order) => {
            setToast({ message: `Order #${order.id} deleted.`, tone: "success" });
            setOrderToDelete(null);
          }}
          onCancel={() => setOrderToDelete(null)}
        />
      )}

      {/* Fixed-position toast, so it never pushes the list down. */}
      {toast && (
        <p className={`toast toast--${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          {toast.message}
        </p>
      )}

      <div className="toolbar">
        <label className="field field--grow">
          <span>Search</span>
          <input
            ref={searchInputRef}
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

        {hasFilterInput && (
          <button type="button" className="toolbar-clear" onClick={clearFilters}>
            <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 5h18l-7 8v6l-4 2v-8z" />
              <path d="m16 16 5 5m0-5-5 5" />
            </svg>
            Clear filters
          </button>
        )}

        <button type="button" className="button-primary toolbar-action" onClick={() => setIsCreating(true)}>
          New order
        </button>
      </div>

      {/* Remount per filter set: scroll position resets, and the previous query loses its observer and is cancelled. */}
      <OrdersTable
        key={JSON.stringify(filters)}
        filters={filters}
        onClearFilters={hasActiveFilters ? clearFilters : undefined}
        onEditOrder={openEditor}
        openingOrderId={openingOrderId}
        onDeleteOrder={canDelete ? setOrderToDelete : undefined}
      />
    </section>
  );
}
