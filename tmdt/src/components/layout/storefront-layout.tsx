import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import ScrollToTop from "@/components/ui/ScrollToTop";
import { cookies } from "next/headers";
import { getAuthenticatedSession } from "@/modules/identity/auth-service.js";

export async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  const session = await getAuthenticatedSession(token);
  const headerUser = session ? { id: session.userId } : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={headerUser} />
      <div className="flex-1">{children}</div>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
