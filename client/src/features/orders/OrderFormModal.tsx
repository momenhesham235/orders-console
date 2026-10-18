import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../../api/http.ts";
import { ORDER_STATUSES, type OrderDetail, type OrderStatus, type OrderSummary } from "../../api/orders.ts";
import { Modal } from "../../components/Modal.tsx";
import { describeError } from "../../lib/describeError.ts";
import { formatMoney } from "../../lib/format.ts";
import {
  draftFromOrder,
  draftSignature,
  emptyDraft,
  emptyItem,
  parseOrderDraft,
  priceToCents,
  type ItemDraft,
  type OrderFormErrors,
} from "./orderForm.schema.ts";
import { isRetryable, useCreateOrder } from "./useCreateOrder.ts";
import { useUpdateOrder } from "./useUpdateOrder.ts";

type OrderFormModalProps = {
  onSaved: (order: OrderSummary) => void;
  onCancel: () => void;
} & ({ mode: "create" } | { mode: "edit"; order: OrderDetail });

function saveErrorMessage(isEdit: boolean, error: unknown): string {
  if (isEdit && error instanceof ApiError && error.status === 409) {
    return "Someone else changed this order while you were editing it. Close it and open it again to see their changes.";
  }
  const action = isEdit ? "Could not save the changes." : "Could not create the order.";
  return `${action} ${describeError(error)}`;
}

export function OrderFormModal(props: OrderFormModalProps) {
  const { onSaved, onCancel } = props;
  const editedOrder = props.mode === "edit" ? props.order : null;

  const [initialDraft] = useState(() => (editedOrder ? draftFromOrder(editedOrder) : emptyDraft()));
  const [draft, setDraft] = useState(initialDraft);
  const [status, setStatus] = useState<OrderStatus>(editedOrder?.status ?? "pending");
  const [errors, setErrors] = useState<OrderFormErrors>({});
  // Create only: one key per form. It survives failed attempts and edits, so a retry after an
  // ambiguous failure (timeout, dropped connection) can never create a second order. Opening the
  // form again (a new mount) means a new order, and so a new key.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const createMutation = useCreateOrder();
  const updateMutation = useUpdateOrder();
  const saveMutation = editedOrder ? updateMutation : createMutation;
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);

  const hasChanges =
    draftSignature(draft) !== draftSignature(initialDraft) || (editedOrder !== null && status !== editedOrder.status);

  // Runs after Modal has called showModal(): an element inside a closed dialog cannot take focus.
  useEffect(() => nameInputRef.current?.focus(), []);

  useEffect(() => {
    if (confirmingDiscard) keepEditingRef.current?.focus();
  }, [confirmingDiscard]);

  // Cancel, Escape and a backdrop click all end up here.
  function requestClose() {
    if (saveMutation.isPending) return; // closing now would hide whether the save happened
    if (confirmingDiscard) {
      setConfirmingDiscard(false); // Escape on the confirmation means "keep editing"
      return;
    }
    if (hasChanges) setConfirmingDiscard(true);
    else onCancel();
  }

  const totalCents = draft.items.reduce((sum, item) => {
    const cents = priceToCents(item.unitPrice);
    const quantity = Number(item.quantity);
    return cents !== null && Number.isInteger(quantity) && quantity > 0 ? sum + cents * quantity : sum;
  }, 0);

  function updateItem(rowId: string, changes: Partial<ItemDraft>) {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.rowId === rowId ? { ...item, ...changes } : item)),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // The disabled button stops most double-clicks; for a create, the Idempotency-Key handles the rest.
    if (saveMutation.isPending) return;

    const parsed = parseOrderDraft(draft);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    if (editedOrder) {
      updateMutation.mutate(
        { id: editedOrder.id, input: { ...parsed.input, status, version: editedOrder.version } },
        { onSuccess: onSaved },
      );
    } else {
      createMutation.mutate({ input: parsed.input, idempotencyKey }, { onSuccess: onSaved });
    }
  }

  return (
    <Modal labelledBy="order-form-title" onRequestClose={requestClose}>
      <form className="order-form" onSubmit={handleSubmit} noValidate>
        <h2 id="order-form-title">{editedOrder ? `Edit order #${editedOrder.id}` : "New order"}</h2>

        <div className="order-form-row">
          <label className="field field--grow">
            <span>Customer name</span>
            <input
              ref={nameInputRef}
              value={draft.customerName}
              maxLength={100}
              onChange={(event) => setDraft({ ...draft, customerName: event.target.value })}
              aria-invalid={Boolean(errors.customerName)}
            />
            {errors.customerName && <small className="field-error">{errors.customerName}</small>}
          </label>

          <label className="field field--grow">
            <span>Customer email</span>
            <input
              type="email"
              value={draft.customerEmail}
              maxLength={254}
              onChange={(event) => setDraft({ ...draft, customerEmail: event.target.value })}
              aria-invalid={Boolean(errors.customerEmail)}
            />
            {errors.customerEmail && <small className="field-error">{errors.customerEmail}</small>}
          </label>

          {editedOrder && (
            <label className="field">
              <span>Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value[0]!.toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <fieldset className="order-items">
          <legend>Items</legend>
          {draft.items.map((item, index) => (
            <div key={item.rowId} className="order-item-row">
              <label className="field">
                <span>Product</span>
                <input
                  value={item.productName}
                  maxLength={100}
                  onChange={(event) => updateItem(item.rowId, { productName: event.target.value })}
                  aria-invalid={Boolean(errors[`items.${index}.productName`])}
                />
                {errors[`items.${index}.productName`] && (
                  <small className="field-error">{errors[`items.${index}.productName`]}</small>
                )}
              </label>

              <label className="field">
                <span>Qty</span>
                <input
                  inputMode="numeric"
                  value={item.quantity}
                  onChange={(event) => updateItem(item.rowId, { quantity: event.target.value })}
                  aria-invalid={Boolean(errors[`items.${index}.quantity`])}
                />
                {errors[`items.${index}.quantity`] && (
                  <small className="field-error">{errors[`items.${index}.quantity`]}</small>
                )}
              </label>

              <label className="field">
                <span>Unit price (SAR)</span>
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(item.rowId, { unitPrice: event.target.value })}
                  aria-invalid={Boolean(errors[`items.${index}.unitPrice`])}
                />
                {errors[`items.${index}.unitPrice`] && (
                  <small className="field-error">{errors[`items.${index}.unitPrice`]}</small>
                )}
              </label>

              <button
                type="button"
                className="remove-item"
                aria-label={`Remove item ${index + 1}`}
                disabled={draft.items.length === 1}
                onClick={() => setDraft({ ...draft, items: draft.items.filter((other) => other.rowId !== item.rowId) })}
              >
                ✕
              </button>
            </div>
          ))}
          {errors.items && <small className="field-error">{errors.items}</small>}
          <button
            type="button"
            disabled={draft.items.length >= 20}
            onClick={() => setDraft({ ...draft, items: [...draft.items, emptyItem()] })}
          >
            + Add item
          </button>
        </fieldset>

        {/* Pinned to the bottom of the dialog: Save and the total stay visible however long the item list gets. */}
        <div className="order-form-sticky">
          {saveMutation.isError && (
            <p className="form-error" role="alert">
              {saveErrorMessage(editedOrder !== null, saveMutation.error)}
            </p>
          )}

          {confirmingDiscard ? (
            <div className="discard-confirm" role="alert">
              <p>
                <strong>{editedOrder ? "Discard your changes?" : "Discard this order?"}</strong> What you entered will be
                lost.
                {saveMutation.isError && isRetryable(saveMutation.error) && (
                  <>
                    {" "}
                    The last attempt may still have reached the server, so check the list before{" "}
                    {editedOrder ? "editing again." : "entering it again."}
                  </>
                )}
              </p>
              <div className="order-form-actions">
                <button ref={keepEditingRef} type="button" onClick={() => setConfirmingDiscard(false)}>
                  Keep editing
                </button>
                <button type="button" className="button-danger" onClick={onCancel}>
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="order-form-footer">
              <strong>Total: {formatMoney(totalCents)}</strong>
              <div className="order-form-actions">
                <button type="button" onClick={requestClose} disabled={saveMutation.isPending}>
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={saveMutation.isPending}>
                  {submitLabel(editedOrder !== null, saveMutation.isPending)}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

function submitLabel(isEdit: boolean, isPending: boolean): string {
  if (isEdit) return isPending ? "Saving…" : "Save changes";
  return isPending ? "Creating…" : "Create order";
}
