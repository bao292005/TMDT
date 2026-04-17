import Link from "next/link";

import { ActionButton } from "@/components/ui/action-button";
import { PageShell } from "@/components/ui/page-shell";

export default function ForbiddenPage() {
  return (
    <PageShell
      title="Bạn không có quyền truy cập"
      description="Tài khoản hiện tại không có quyền để xem trang này."
      maxWidth="3xl"
    >
      <section className="space-y-3 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-700">
          Vui lòng đăng nhập bằng tài khoản phù hợp hoặc quay lại trang chính để tiếp tục.
        </p>

        <div className="flex flex-wrap gap-2">
          <Link href="/home">
            <ActionButton>Về trang chủ</ActionButton>
          </Link>
          <Link href="/login">
            <ActionButton variant="secondary">Đăng nhập tài khoản khác</ActionButton>
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
