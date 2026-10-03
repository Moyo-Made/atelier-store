import { revalidatePath } from "next/cache";

// The storefront's catalogue pages are regenerated at most once a minute
// (`revalidate = 60`). After the admin changes the catalogue this makes them
// regenerate on their next visit instead, so the change shows at once. Only
// callable from a Server Action or Route Handler.
export function revalidateCatalogue() {
  revalidatePath("/");
  revalidatePath("/new");
  // A pattern is the route's file path, route group included.
  revalidatePath("/(store)/[category]", "page");
  revalidatePath("/(store)/products/[slug]", "page");
}
