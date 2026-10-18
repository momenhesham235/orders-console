import { useEffect, useRef } from "react";
import { ApiError } from "../../api/http.ts";
import type { OrderSummary } from "../../api/orders.ts";
import { Modal } from "../../components/Modal.tsx";
import { describeError } from "../../lib/describeError.ts";
import { formatMoney } from "../../lib/format.ts";
import { useDeleteOrder } from "./useDeleteOrder.ts";

function deleteErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 403) {
    return "Only admins can delete orders, and the server says you are not one (any more). The page has been updated.";
  }
  if (error instanceof ApiError && error.status === 404) {
    return "This order no longer exists. It has been removed from the list.";
  }
  return describeError(error);
}

interface DeleteOrderDialogProps {
  order: OrderSummary;
  onDeleted: (order: OrderSummary) => void;
  onCancel: () => void;
}

export function DeleteOrderDialog({ order, onDeleted, onCancel }: DeleteOrderDialogProps) {
  const deleteMutation = useDeleteOrder();
  const cancelRef = useRef<HTMLButtonElement>(null);
  // A 403 or 404 is final: retrying the same delete cannot succeed.
  const cannotRetry =
    deleteMutation.error instanceof ApiError && (deleteMutation.error.status === 403 || deleteMutation.error.status === 404);

  // Focus the safe choice, so pressing Enter by reflex does not delete anything.
  useEffect(() => cancelRef.current?.focus(), []);

  function close() {
    if (!deleteMutation.isPending) onCancel();
  }

  return (
    <Modal labelledBy="delete-order-title" onRequestClose={close}>
      <div className="confirm-dialog">
        <h2 id="delete-order-title">Delete order #{order.id}?</h2>
        <p>
          {order.customerName} · {formatMoney(order.totalCents)} · {order.itemCount}{" "}
          {order.itemCount === 1 ? "item" : "items"}
        </p>
        <p className="muted">This permanently deletes the order and its line items. It cannot be undone.</p>

        {deleteMutation.isError && (
          <p className="form-error" role="alert">
            {deleteErrorMessage(deleteMutation.error)}
          </p>
        )}

        <div className="confirm-actions">
          <button ref={cancelRef} type="button" onClick={close} disabled={deleteMutation.isPending}>
            {cannotRetry ? "Close" : "Cancel"}
          </button>
          {!cannotRetry && (
            <button
              type="button"
              className="button-danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(order, { onSuccess: () => onDeleted(order) })}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete order"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
