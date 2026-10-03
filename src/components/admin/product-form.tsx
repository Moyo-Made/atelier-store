"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Field, SelectField, TextAreaField } from "@/components/field";
import type { ProductFormState, ProductFormValues } from "@/lib/admin";

const copy = {
  create: { submit: "Add product", pending: "Adding…" },
  edit: { submit: "Save details", pending: "Saving…" },
};

// The form for a new product and for a product's details. Everything is
// checked by the Server Action; the attributes here only help with typing.
// After each attempt the action sends back what was typed, and the fields
// take it as their default, so a refused form is not emptied.
export function ProductForm({
  mode,
  action,
  initial,
  categories,
}: {
  mode: "create" | "edit";
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  initial: ProductFormValues;
  categories: { id: number; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(action, {
    values: initial,
    errors: {},
  });
  const { values, errors } = state;
  const text = copy[mode];
  const refused = Object.values(errors).some(Boolean);

  // After a refusal, go to the first field that needs correcting.
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    form.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state]);

  return (
    <form
      ref={form}
      action={formAction}
      noValidate
      aria-busy={pending}
      className="grid max-w-reading gap-6"
    >
      {state.message || refused ? (
        <p
          role="alert"
          className="type-body border-l-2 border-danger pl-4 text-danger"
        >
          {state.message ?? "Nothing was saved. Correct the marked fields."}
        </p>
      ) : null}
      {state.saved ? (
        <p role="status" className="type-body border-l-2 border-foreground pl-4">
          Details saved. The store shows them now.
        </p>
      ) : null}

      <Field
        label="Name"
        name="name"
        type="text"
        defaultValue={values.name}
        error={errors.name}
        readOnly={pending}
        required
        maxLength={120}
      />
      {mode === "create" ? (
        <Field
          label="Web address"
          name="slug"
          type="text"
          defaultValue={values.slug}
          error={errors.slug}
          readOnly={pending}
          hint="The end of the product's link, such as saddle-stitched-satchel. Leave it empty to make it from the name. It cannot be changed later."
          autoCapitalize="none"
          spellCheck={false}
          maxLength={80}
        />
      ) : null}
      <Field
        label="Style number"
        name="styleNumber"
        type="text"
        defaultValue={values.styleNumber}
        error={errors.styleNumber}
        readOnly={pending}
        hint="Unique to this piece, such as AT-1042."
        required
        spellCheck={false}
        maxLength={40}
      />

      <SelectField
        // Remounted when the choice changes: a select does not take a new
        // default once it is on the page.
        key={values.categoryId}
        label="Category"
        name="categoryId"
        defaultValue={values.categoryId}
        error={errors.categoryId}
        required
      >
        <option value="">Choose a category</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <Field
        label="Price"
        name="price"
        type="text"
        inputMode="numeric"
        defaultValue={values.price}
        error={errors.price}
        readOnly={pending}
        hint="Whole US dollars, such as 1950."
        required
      />
      <Field
        label="Badge"
        name="badge"
        type="text"
        defaultValue={values.badge}
        error={errors.badge}
        readOnly={pending}
        hint="Optional. A short tag on the product card, such as New."
        maxLength={40}
      />

      <TextAreaField
        label="Description"
        name="description"
        rows={4}
        defaultValue={values.description}
        error={errors.description}
        readOnly={pending}
        required
      />
      <TextAreaField
        label="Details"
        name="details"
        rows={5}
        defaultValue={values.details}
        error={errors.details}
        readOnly={pending}
        hint="One per line."
        required
      />
      <TextAreaField
        label="Materials"
        name="materials"
        rows={2}
        defaultValue={values.materials}
        error={errors.materials}
        readOnly={pending}
        required
      />

      <fieldset className="mt-4 grid gap-6 border-t pt-6">
        <legend className="type-ui float-left w-full">Images</legend>
        <p className="type-caption text-muted">
          Addresses on images.unsplash.com only. The first image is the one on
          product cards. Leave a row empty to leave it out.
        </p>
        {errors.images ? (
          <p role="alert" className="type-caption text-danger">
            {errors.images}
          </p>
        ) : null}
        {values.images.map((image, index) => (
          <div key={index} className="grid gap-4 md:grid-cols-2 md:gap-grid">
            <Field
              label={`Image ${index + 1} address`}
              name="imageSrc"
              type="url"
              inputMode="url"
              defaultValue={image.src}
              readOnly={pending}
              spellCheck={false}
              autoCapitalize="none"
            />
            <Field
              label={`Image ${index + 1} description`}
              name="imageAlt"
              type="text"
              defaultValue={image.alt}
              readOnly={pending}
              maxLength={200}
            />
          </div>
        ))}
      </fieldset>

      {mode === "create" ? (
        <fieldset className="mt-4 grid gap-6 border-t pt-6">
          <legend className="type-ui float-left w-full">Availability</legend>
          <Field
            label="Units in stock"
            name="stock"
            type="text"
            inputMode="numeric"
            defaultValue={values.stock}
            error={errors.stock}
            readOnly={pending}
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
        </fieldset>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-6">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? text.pending : text.submit}
        </button>
        <Link href="/admin/products" prefetch={false} className="link type-ui">
          {mode === "create" ? "Cancel" : "All products"}
        </Link>
      </div>
    </form>
  );
}
