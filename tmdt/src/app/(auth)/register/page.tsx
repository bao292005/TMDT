"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  email: string;
  password: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) {
        setError(registerData.message ?? "Đăng ký thất bại.");
        return;
      }

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        setError(loginData.message ?? "Đăng nhập tự động thất bại.");
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
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6">
      <h1 className="text-2xl font-semibold">Đăng ký tài khoản</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="w-full rounded border px-3 py-2"
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="w-full rounded border px-3 py-2"
            autoComplete="new-password"
            required
          />
        </div>

        {error ? (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      <p className="text-sm text-zinc-600">
        Đã có tài khoản? <Link href="/login" className="underline">Đăng nhập</Link>
      </p>
    </main>
  );
}
