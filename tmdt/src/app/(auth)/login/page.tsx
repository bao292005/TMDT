"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Input } from "@/components/ui/input";

type FormState = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Đăng nhập thất bại.");
        return;
      }

      router.push("/cart");
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-10">
      <section className="w-full rounded-sm border-t-4 border-[#ee4d2d] bg-white p-8 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-[#ee4d2d]">Đăng nhập</h1>
          <p className="text-sm text-zinc-500">Đăng nhập để tiếp tục mua sắm và checkout.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            autoComplete="email"
            required
          />

          <Input
            id="password"
            name="password"
            type="password"
            label="Mật khẩu"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            autoComplete="current-password"
            required
          />

          {error ? <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-sm bg-[#ee4d2d] px-4 py-3 text-sm font-medium uppercase text-white transition-colors hover:bg-[#f05d40] disabled:opacity-50"
          >
            {submitting ? "Đang xử lý..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 border-t pt-4 text-center text-sm text-zinc-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-[#ee4d2d]">
            Đăng ký
          </Link>
        </p>
      </section>
    </main>
  );
}
