import { BagProvider } from "@/components/bag";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <BagProvider>
      <SiteHeader />
      {children}
      <SiteFooter />
    </BagProvider>
  );
}
