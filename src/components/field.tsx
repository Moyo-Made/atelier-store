import { useId } from "react";

type FrameProps = {
  label: string;
  hint?: string;
  error?: string;
  // A control shown opposite the label, such as the password toggle.
  action?: React.ReactNode;
};

// The label above a control and the hint or error under it. `control` is
// given the attributes that tie the three together.
function FieldFrame({
  label,
  hint,
  error,
  action,
  control,
}: FrameProps & {
  control: (attributes: {
    id: string;
    className: string;
    "aria-invalid": true | undefined;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const id = useId();
  const described = [hint && `${id}-hint`, error && `${id}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="type-caption text-muted">
          {label}
        </label>
        {action}
      </div>
      {control({
        id,
        className: "field",
        "aria-invalid": error ? true : undefined,
        "aria-describedby": described || undefined,
      })}
      {hint && !error ? (
        <p id={`${id}-hint`} className="type-caption mt-2 text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="type-caption mt-2 text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  action,
  ...input
}: FrameProps & React.ComponentProps<"input">) {
  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      action={action}
      control={(attributes) => <input {...input} {...attributes} />}
    />
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  action,
  ...textarea
}: FrameProps & React.ComponentProps<"textarea">) {
  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      action={action}
      control={(attributes) => <textarea {...textarea} {...attributes} />}
    />
  );
}

export function SelectField({
  label,
  hint,
  error,
  action,
  ...select
}: FrameProps & React.ComponentProps<"select">) {
  return (
    <FieldFrame
      label={label}
      hint={hint}
      error={error}
      action={action}
      control={(attributes) => <select {...select} {...attributes} />}
    />
  );
}
