"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import type { AvailabilityFormState } from "@/lib/admin";
import { getStockState } from "@/lib/products";

// Stock and made-to-order for one product. `stock` and `madeToOrder` are what
// the database holds; the form shows them unless the last attempt was refused,
// in which case it shows what was typed.
export function AvailabilityForm({
  action,
  stock,
  madeToOrder,
}: {
  action: (
    state: AvailabilityFormState,
    formData: FormData,
  ) => Promise<AvailabilityFormState>;
  stock: number;
  madeToOrder: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // What was typed is kept only while the stock it was typed against is
  // still the stock.
  const values =
    state.values && state.expected === stock
      ? state.values
      : { stock: String(stock), madeToOrder };
  const error = state.expected === stock ? state.error : undefined;

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={pending}
      className="grid max-w-reading gap-6"
    >
      {state.message ? (
        <p
          role="alert"
          className="type-body border-l-2 border-danger pl-4 text-danger"
        >
          {state.message}
        </p>
      ) : null}
      {state.saved ? (
        <p role="status" className="type-body border-l-2 border-foreground pl-4">
          Availability saved. The store shows it now.
        </p>
      ) : null}

      <p className="type-body text-muted">
        Customers see: {getStockState({ stock, madeToOrder }).label}.
      </p>

      <Field
        // Remounted when the stock changes on the server, so the box never
        // holds typing meant for a figure that has since moved: the save is
        // always made against the number on screen.
        key={stock}
        label="Units in stock"
        name="stock"
        type="text"
        inputMode="numeric"
        defaultValue={values.stock}
        error={error}
        readOnly={pending}
        hint="Units a pending checkout is holding are already taken out of this figure."
        required
      />
      <label className="type-body flex items-center gap-3">
        <input
          key={String(values.madeToOrder)}
          type="checkbox"
          name="madeToOrder"
          defaultChecked={values.madeToOrder}
          className="size-4 accent-foreground"
        />
        Made to order: it can be bought with no stock
      </label>

      <div className="mt-4">
        <button type="submit" disabled={pending} className="btn btn-secondary">
          {pending ? "Saving…" : "Save availability"}
        </button>
      </div>
    </form>
  );
}
