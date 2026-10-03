"use client"; // Error boundaries must be Client Components

import { ErrorPage } from "@/components/error-page";

// For a page outside the store group that fails to render: the admin and the
// styleguide. It renders in the root layout alone, with no header or footer.
export default ErrorPage;
