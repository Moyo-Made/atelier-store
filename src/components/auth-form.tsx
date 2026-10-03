"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/field";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";
type FieldName = "name" | "email" | "password";
type FieldErrors = Partial<Record<FieldName, string>>;

const copy = {
  "sign-in": {
    submit: "Sign in",
    pending: "Signing in…",
    other: "New to Atelier?",
    otherLabel: "Create an account",
    otherHref: "/sign-up",
  },
  "sign-up": {
    submit: "Create account",
    pending: "Creating account…",
    other: "Already have an account?",
    otherLabel: "Sign in",
    otherHref: "/sign-in",
  },
};

// The same limits Better Auth enforces, so most mistakes never leave the page.
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(mode: Mode, field: FieldName, value: string) {
  switch (field) {
    case "name":
      return value.trim() ? undefined : "Enter your name.";
    case "email":
      if (!value.trim()) return "Enter your email address.";
      return EMAIL_SHAPE.test(value.trim())
        ? undefined
        : "Enter a full email address, such as name@example.com.";
    case "password":
      if (!value) return "Enter your password.";
      // An existing password is not judged here, only checked by the server.
      if (mode === "sign-in") return undefined;
      if (value.length < MIN_PASSWORD) {
        return `Use at least ${MIN_PASSWORD} characters.`;
      }
      return value.length > MAX_PASSWORD
        ? `Use ${MAX_PASSWORD} characters or fewer.`
        : undefined;
  }
}

// Turns a Better Auth error into wording for the customer, on the field it
// concerns when there is one.
function describe(
  mode: Mode,
  error: { code?: string; status?: number },
): { field?: FieldName; message: string } {
  switch (error.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return {
        field: "email",
        message:
          "An account with this email address already exists. Sign in instead.",
      };
    case "INVALID_EMAIL":
      return { field: "email", message: "Enter a valid email address." };
    case "PASSWORD_TOO_SHORT":
      return {
        field: "password",
        message: `Use at least ${MIN_PASSWORD} characters.`,
      };
    case "PASSWORD_TOO_LONG":
      return {
        field: "password",
        message: `Use ${MAX_PASSWORD} characters or fewer.`,
      };
    case "INVALID_EMAIL_OR_PASSWORD":
      return {
        message:
          "That email address and password do not match an account. Check both and try again.",
      };
  }

  if (error.status === 429) {
    return {
      message: "Too many attempts. Wait a few seconds, then try again.",
    };
  }
  if (!error.status) {
    return {
      message:
        "We could not reach the store. Check your connection and try again.",
    };
  }
  return {
    message:
      mode === "sign-up"
        ? "We could not create your account. Please try again."
        : "We could not sign you in. Please try again.",
  };
}

// Goes through /api/auth rather than a Server Action so Better Auth's rate
// limiter sees every attempt.
export function AuthForm({
  mode,
  next,
}: {
  mode: Mode;
  // Where to go once signed in. Already checked by `safeNext` on the server.
  next: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const text = copy[mode];
  const fields: FieldName[] =
    mode === "sign-up" ? ["name", "email", "password"] : ["email", "password"];

  // A field is checked when it is left with something in it, and again on
  // every keystroke while it shows an error, so the message goes as soon as
  // the value is right. Empty fields are only reported on submit.
  function fieldProps(field: FieldName) {
    return {
      name: field,
      required: true,
      readOnly: pending,
      error: errors[field],
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        const { value } = event.target;
        if (!value) return;
        setErrors((current) => ({
          ...current,
          [field]: validate(mode, field, value),
        }));
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
        setFormError(null);
        if (!errors[field]) return;
        const { value } = event.target;
        setErrors((current) => ({
          ...current,
          [field]: validate(mode, field, value),
        }));
      },
    };
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };
    const focus = (field: FieldName) =>
      (form.elements.namedItem(field) as HTMLInputElement | null)?.focus();

    const found: FieldErrors = {};
    for (const field of fields) {
      found[field] = validate(mode, field, values[field]);
    }
    setErrors(found);
    setFormError(null);

    const firstInvalid = fields.find((field) => found[field]);
    if (firstInvalid) {
      focus(firstInvalid);
      return;
    }

    setPending(true);

    let error: { code?: string; status?: number } | null;
    try {
      ({ error } =
        mode === "sign-up"
          ? await authClient.signUp.email(values)
          : await authClient.signIn.email({
              email: values.email,
              password: values.password,
            }));
    } catch {
      error = {};
    }

    if (error) {
      const problem = describe(mode, error);
      if (problem.field) {
        setErrors({ [problem.field]: problem.message });
      } else {
        setFormError(problem.message);
      }
      setPending(false);
      // After a refused sign-in the password is the field to retype.
      focus(problem.field ?? "password");
      return;
    }

    // Still pending: the button stays busy until the next page replaces this.
    router.push(next);
    router.refresh();
  }

  return (
    <>
      <form
        onSubmit={submit}
        noValidate
        aria-busy={pending}
        className="mt-10 grid gap-6"
      >
        {formError ? (
          <p
            role="alert"
            className="type-body border-l-2 border-danger pl-4 text-danger"
          >
            {formError}
          </p>
        ) : null}

        {mode === "sign-up" ? (
          <Field
            {...fieldProps("name")}
            label="Name"
            type="text"
            autoComplete="name"
            autoFocus
          />
        ) : null}
        <Field
          {...fieldProps("email")}
          label="Email address"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus={mode === "sign-in"}
        />
        <Field
          {...fieldProps("password")}
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          autoCapitalize="none"
          spellCheck={false}
          maxLength={MAX_PASSWORD}
          hint={
            mode === "sign-up"
              ? `At least ${MIN_PASSWORD} characters.`
              : undefined
          }
          action={
            <button
              type="button"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((shown) => !shown)}
              className="link type-caption"
            >
              {showPassword ? "Hide" : "Show"}
              <span className="sr-only"> password</span>
            </button>
          }
        />

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary btn-block mt-2"
        >
          {pending ? text.pending : text.submit}
        </button>
      </form>

      <p className="type-body mt-8 text-muted">
        {text.other}{" "}
        <Link
          href={
            next === "/account"
              ? text.otherHref
              : `${text.otherHref}?next=${encodeURIComponent(next)}`
          }
          className="link text-foreground"
        >
          {text.otherLabel}
        </Link>
      </p>
    </>
  );
}
