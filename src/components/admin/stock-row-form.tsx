"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import type { StockFormState } from "@/lib/admin";

// The stock of one product, on its row of the stock screen. `stock` is what
// the database holds. Each row has its own state, so a mistake or a save in
// one says nothing about the others.
export function StockRowForm({
  action,
  stock,
  name,
}: {
  action: (
    state: StockFormState,
    formData: FormData,
  ) => Promise<StockFormState>;
  stock: number;
  name: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();

  // What the last attempt said belongs to one stock figure, and is dropped
  // once the stock is something else.
  const current = state.expected === undefined || state.expected === stock;
  const error = current ? state.error : undefined;
  const problem = error ?? (current ? state.message : undefined);
  const saved = current && state.saved;

  // After a refusal, go back to the figure to correct it.
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.error) input.current?.focus();
  }, [state]);

  return (
    <form action={formAction} noValidate aria-busy={pending} className="md:w-56">
      <label htmlFor={id} className="type-caption text-muted">
        Available<span className="sr-only">: {name}</span>
      </label>
      <div className="flex items-end gap-4">
        <input
          // Remounted when the stock changes on the server, so the box never
          // holds typing meant for a figure that has since moved: the save
          // is always made against the number on screen.
          key={stock}
          ref={input}
          id={id}
          name="stock"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={current ? (state.value ?? stock) : stock}
          readOnly={pending}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-note`}
          className="field min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn btn-secondary btn-sm shrink-0"
        >
          {pending ? "Saving…" : "Save"}
          <span className="sr-only"> stock of {name}</span>
        </button>
      </div>
      {/* The line is always there, so a message does not move the rows. */}
      <p
        id={`${id}-note`}
        role={problem ? "alert" : "status"}
        className={`type-caption mt-2 min-h-4 ${problem ? "text-danger" : "text-muted"}`}
      >
        {problem ?? (saved ? "Saved. The store shows it now." : null)}
      </p>
    </form>
  );
}
