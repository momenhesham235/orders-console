import { useEffect, useRef, useState, type FormEvent } from "react";
import type { OrderSummary } from "../../api/orders.ts";
import { Modal } from "../../components/Modal.tsx";
import { describeError } from "../../lib/describeError.ts";
import { formatMoney } from "../../lib/format.ts";
import { parseOrderDraft, priceToCents, type ItemDraft, type OrderDraft, type OrderFormErrors } from "./orderForm.schema.ts";
import { isRetryable, useCreateOrder } from "./useCreateOrder.ts";

function emptyItem(): ItemDraft {
  return { rowId: crypto.randomUUID(), productName: "", quantity: "1", unitPrice: "" };
}

function emptyDraft(): OrderDraft {
  return { customerName: "", customerEmail: "", items: [emptyItem()] };
}

function isDraftEmpty(draft: OrderDraft): boolean {
  return (
    !draft.customerName.trim() &&
    !draft.customerEmail.trim() &&
    draft.items.length === 1 &&
    draft.items.every((item) => !item.productName.trim() && !item.unitPrice.trim() && item.quantity === "1")
  );
}

interface CreateOrderFormProps {
  onCreated: (order: OrderSummary) => void;
  onCancel: () => void;
}

export function CreateOrderForm({ onCreated, onCancel }: CreateOrderFormProps) {
  const [draft, setDraft] = useState(emptyDraft);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  // One key per order being entered. It survives failed attempts and edits, so a retry after an
  // ambiguous failure (timeout, dropped connection) can never create a second order; a new key
  // is generated only once this order is confirmed created.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const createMutation = useCreateOrder();
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);

  // Runs after Modal has called showModal(): an element inside a closed dialog cannot take focus.
  useEffect(() => nameInputRef.current?.focus(), []);

  useEffect(() => {
    if (confirmingDiscard) keepEditingRef.current?.focus();
  }, [confirmingDiscard]);

  // Cancel, Escape and a backdrop click all end up here.
  function requestClose() {
    if (createMutation.isPending) return; // closing now would hide whether the order was created
    if (confirmingDiscard) {
      setConfirmingDiscard(false); // Escape on the confirmation means "keep editing"
      return;
    }
    if (isDraftEmpty(draft)) onCancel();
    else setConfirmingDiscard(true);
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
    // The disabled button stops most double-clicks; the Idempotency-Key handles the rest.
    if (createMutation.isPending) return;

    const parsed = parseOrderDraft(draft);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});

    createMutation.mutate(
      { input: parsed.input, idempotencyKey },
      {
        onSuccess: (order) => {
          setDraft(emptyDraft());
          setIdempotencyKey(crypto.randomUUID());
          onCreated(order);
        },
      },
    );
  }

  return (
    <Modal labelledBy="new-order-title" onRequestClose={requestClose}>
      <form className="order-form" onSubmit={handleSubmit} noValidate>
        <h2 id="new-order-title">New order</h2>

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
        </div>

        <fieldset className="order-items">
          <legend>Items</legend>
          {draft.items.map((item, index) => (
            <div key={item.rowId} className="order-form-row">
              <label className="field field--grow">
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

              <label className="field field--narrow">
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

              <label className="field field--narrow">
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

        {createMutation.isError && (
          <p className="form-error" role="alert">
            Could not create the order. {describeError(createMutation.error)}
          </p>
        )}

        {confirmingDiscard ? (
          <div className="discard-confirm" role="alert">
            <p>
              <strong>Discard this order?</strong> What you entered will be lost.
              {createMutation.isError && isRetryable(createMutation.error) && (
                <> The last attempt may still have reached the server, so check the list before entering it again.</>
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
              <button type="button" onClick={requestClose} disabled={createMutation.isPending}>
                Cancel
              </button>
              <button type="submit" className="button-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating…" : "Create order"}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
