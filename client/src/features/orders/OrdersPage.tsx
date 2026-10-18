import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  fetchOrder,
  ORDER_STATUSES,
  type OrderDetail,
  type OrderFilters,
  type OrderStatus,
  type OrderSummary,
  type SortDirection,
  type SortField,
} from "../../api/orders.ts";
import { describeError } from "../../lib/describeError.ts";
import { useDebouncedValue } from "../../lib/useDebouncedValue.ts";
import { DeleteOrderDialog } from "./DeleteOrderDialog.tsx";
import { OrderFormModal } from "./OrderFormModal.tsx";
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

interface Toast {
  message: string;
  tone: "success" | "error";
}

interface OrdersPageProps {
  /** UI only: decides whether Delete buttons are shown. The server is what enforces the role. */
  canDelete: boolean;
}

export function OrdersPage({ canDelete }: OrdersPageProps) {
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [isCreating, setIsCreating] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrderDetail | null>(null);
  const [openingOrderId, setOpeningOrderId] = useState<number | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderSummary | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const queryClient = useQueryClient();

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
        onEditOrder={openEditor}
        openingOrderId={openingOrderId}
        onDeleteOrder={canDelete ? setOrderToDelete : undefined}
      />
    </section>
  );
}
