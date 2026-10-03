import { NotFoundPage } from "@/components/not-found-page";

// For `notFound()` thrown by a page in the store group: a product, category
// or order that does not exist. The store layout supplies the header and
// footer.
export default function StoreNotFound() {
  return <NotFoundPage />;
}
