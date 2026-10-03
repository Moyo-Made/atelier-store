import { BagProvider } from "@/components/bag";
import { NotFoundPage } from "@/components/not-found-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// For an address that matches no route, and for `notFound()` outside the
// store group, which is how /admin answers anyone who is not an admin. It
// renders in the root layout alone, so it brings the store's header and
// footer itself and looks exactly like the store's own 404: nothing about
// the page says which of the two it was.
export default function NotFound() {
  return (
    <BagProvider>
      <SiteHeader />
      <NotFoundPage />
      <SiteFooter />
    </BagProvider>
  );
}
