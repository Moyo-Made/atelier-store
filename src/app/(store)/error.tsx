"use client"; // Error boundaries must be Client Components

import { ErrorPage } from "@/components/error-page";

// For a store page that fails to render. It sits inside the store layout, so
// the header and footer stay. `checkout/error.tsx` takes over for checkout.
export default ErrorPage;
