import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef } from "react";
import type { OrderFilters, OrderSummary } from "../../api/orders.ts";
import { StateMessage } from "../../components/StateMessage.tsx";
import { describeError } from "../../lib/describeError.ts";
import { formatDateTime, formatMoney } from "../../lib/format.ts";
import { useOrders } from "./useOrders.ts";

const ROW_HEIGHT = 48;

interface OrdersTableProps {
  filters: OrderFilters;
  /** Present only while a search or status filter is active. */
  onClearFilters?: () => void;
  onEditOrder: (order: OrderSummary) => void;
  /** The order whose details are loading for the editor, if any. */
  openingOrderId: number | null;
  /** Present only for admins. Hiding the button is cosmetic: the server enforces the role. */
  onDeleteOrder?: (order: OrderSummary) => void;
}

export function OrdersTable({ filters, onClearFilters, onEditOrder, openingOrderId, onDeleteOrder }: OrdersTableProps) {
  const {
    data,
    error,
    isPending,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useOrders(filters);

  const rows = useMemo(() => data?.pages.flatMap((page) => page.orders) ?? [], [data]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Only the rows in view (plus overscan) are in the DOM; one extra row at the end is the
  // "loading more" sentinel while another page exists.
  const virtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const lastVisibleIndex = virtualRows.at(-1)?.index ?? -1;

  useEffect(() => {
    // A failed page waits for the user's retry instead of re-firing on every render.
    if (lastVisibleIndex >= rows.length - 1 && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage();
    }
  }, [lastVisibleIndex, rows.length, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (isPending) return <p className="table-message">Loading orders…</p>;

  if (isError && rows.length === 0) {
    return (
      <StateMessage
        tone="danger"
        icon="alert"
        title="Couldn't load orders"
        description={describeError(error)}
        action={
          <button type="button" className="button-primary" onClick={() => void refetch()}>
            Try again
          </button>
        }
      />
    );
  }

  // Every loaded row was deleted but more pages exist: the effect above is fetching the next one.
  if (rows.length === 0 && hasNextPage) return <p className="table-message">Loading orders…</p>;

  if (rows.length === 0) {
    return onClearFilters ? (
      <StateMessage
        icon="search"
        title="No orders match your filters"
        description="Try a different search term or status."
        action={
          <button type="button" onClick={onClearFilters}>
            Clear filters
          </button>
        }
      />
    ) : (
      <StateMessage icon="inbox" title="No orders yet" description="Orders you create will appear here." />
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={onDeleteOrder ? "orders-scroll orders-scroll--admin" : "orders-scroll"}
        role="table" aria-label="Orders" aria-rowcount={hasNextPage ? -1 : rows.length}>
        <div role="row" className="orders-row orders-row--header">
          <span role="columnheader">#</span>
          <span role="columnheader">Customer</span>
          <span role="columnheader">Email</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className="numeric">Items</span>
          <span role="columnheader" className="numeric">Total</span>
          <span role="columnheader">Created</span>
          <span role="columnheader">
            <span className="visually-hidden">Actions</span>
          </span>
        </div>

        <div className="orders-body" style={{ height: virtualizer.getTotalSize() }}>
          {virtualRows.map((virtualRow) => {
            const order = rows[virtualRow.index];
            const style = { height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` };

            if (!order) {
              return (
                <div key={virtualRow.key} role="row" className="orders-row orders-row--loader" style={style}>
                  {isFetchNextPageError ? (
                    <span role="alert">
                      Could not load more orders.{" "}
                      <button type="button" onClick={() => void fetchNextPage()}>
                        Retry
                      </button>
                    </span>
                  ) : (
                    <span>Loading more…</span>
                  )}
                </div>
              );
            }

            return (
              <div key={virtualRow.key} role="row" className="orders-row" style={style}>
                <span role="cell" className="muted">{order.id}</span>
                <span role="cell" className="truncate">{order.customerName}</span>
                <span role="cell" className="truncate muted">{order.customerEmail}</span>
                <span role="cell">
                  <span className={`status status--${order.status}`}>{order.status}</span>
                </span>
                <span role="cell" className="numeric">{order.itemCount}</span>
                <span role="cell" className="numeric">{formatMoney(order.totalCents)}</span>
                <span role="cell" className="muted">{formatDateTime(order.createdAt)}</span>
                <span role="cell" className="row-actions">
                  <button
                    type="button"
                    className="row-action"
                    aria-label={`Edit order ${order.id}`}
                    disabled={openingOrderId !== null}
                    onClick={() => onEditOrder(order)}
                  >
                    {openingOrderId === order.id ? "Opening…" : "Edit"}
                  </button>
                  {onDeleteOrder && (
                    <button
                      type="button"
                      className="row-action row-action--danger"
                      aria-label={`Delete order ${order.id}`}
                      onClick={() => onDeleteOrder(order)}
                    >
                      Delete
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="table-footer">
        {rows.length.toLocaleString()} orders loaded{hasNextPage ? " · scroll for more" : " · end of results"}
      </p>
    </>
  );
}
