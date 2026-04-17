import { StorefrontLayout } from "@/components/layout/storefront-layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontLayout>{children}</StorefrontLayout>;
}
