"use client";

import { useState } from "react";

// Not connected to a mailing service yet: submitting only confirms on screen.
export function NewsletterForm() {
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return (
      <p role="status" className="type-body">
        Subscribed. We will write when the next collection opens.
      </p>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSubscribed(true);
      }}
      className="flex flex-col gap-4 md:flex-row md:items-end"
    >
      <label className="flex-1 text-left">
        <span className="type-caption text-muted">Email address</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="name@example.com"
          className="field"
        />
      </label>
      <button type="submit" className="btn btn-primary">
        Subscribe
      </button>
    </form>
  );
}
