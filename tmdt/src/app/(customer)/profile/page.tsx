"use client";

import { FormEvent, useEffect, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";

type ProfilePayload = {
  fullName: string;
  phone: string;
  addresses: string[];
};

const EMPTY_PROFILE: ProfilePayload = {
  fullName: "",
  phone: "",
  addresses: [""],
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfilePayload>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (!response.ok) {
          setError(data.message ?? "Không thể tải hồ sơ.");
          return;
        }

        const profile = data.data?.profile;
        setForm({
          fullName: profile?.fullName ?? "",
          phone: profile?.phone ?? "",
          addresses: profile?.addresses?.length ? profile.addresses : [""],
        });
      } catch {
        setError("Không thể kết nối tới máy chủ.");
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  function updateAddress(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.addresses];
      next[index] = value;
      return { ...prev, addresses: next };
    });
  }

  function addAddress() {
    setForm((prev) => {
      if (prev.addresses.length >= 3) {
        return prev;
      }
      return { ...prev, addresses: [...prev.addresses, ""] };
    });
  }

  function removeAddress(index: number) {
    setForm((prev) => {
      if (prev.addresses.length === 1) {
        return { ...prev, addresses: [""] };
      }

      return {
        ...prev,
        addresses: prev.addresses.filter((_, addressIndex) => addressIndex !== index),
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          addresses: form.addresses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Cập nhật hồ sơ thất bại.");
        return;
      }

      setSuccess("Cập nhật hồ sơ thành công.");
      const profile = data.data?.profile;
      setForm({
        fullName: profile?.fullName ?? "",
        phone: profile?.phone ?? "",
        addresses: profile?.addresses?.length ? profile.addresses : [""],
      });
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PageShell title="Hồ sơ cá nhân" maxWidth="3xl">
        <StatePanel state="loading" title="Đang tải dữ liệu" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  return (
    <PageShell title="Hồ sơ cá nhân" maxWidth="3xl">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
        <Input
          id="fullName"
          name="fullName"
          type="text"
          label="Họ và tên"
          value={form.fullName}
          onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          required
        />

        <Input
          id="phone"
          name="phone"
          type="tel"
          label="Số điện thoại"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          required
        />

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-zinc-700">Địa chỉ giao hàng (tối đa 3)</legend>

          {form.addresses.map((address, index) => (
            <div key={`address-${index}`} className="flex gap-2">
              <Input
                id={`address-${index}`}
                name={`address-${index}`}
                type="text"
                value={address}
                onChange={(event) => updateAddress(index, event.target.value)}
                placeholder={`Địa chỉ ${index + 1}`}
                required
              />
              <ActionButton
                type="button"
                variant="ghost"
                onClick={() => removeAddress(index)}
                disabled={form.addresses.length === 1}
                className="self-end"
              >
                Xóa
              </ActionButton>
            </div>
          ))}

          <ActionButton type="button" variant="secondary" size="sm" onClick={addAddress} disabled={form.addresses.length >= 3}>
            Thêm địa chỉ
          </ActionButton>
        </fieldset>

        {error ? <FeedbackMessage tone="error" message={error} /> : null}
        {success ? <FeedbackMessage tone="success" message={success} /> : null}

        <ActionButton type="submit" disabled={submitting} className="w-full">
          {submitting ? "Đang lưu..." : "Lưu thay đổi"}
        </ActionButton>
      </form>
    </PageShell>
  );
}
