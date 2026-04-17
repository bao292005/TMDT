"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { PageShell } from "@/components/ui/page-shell";
import { StatePanel } from "@/components/ui/state-panel";
import { resolveAuthRedirectPath } from "@/shared/utils/auth-redirect";

import {
  formatTimelineTimestamp,
  resolveCheckoutFieldError,
} from "./checkout-client-logic.js";

type CartItem = {
  productSlug: string;
  variantId: string;
  quantity: number;
  title: string;
  price: number;
};

type CheckoutSummary = {
  cart: {
    items: CartItem[];
    invalidItems: CartItem[];
    itemCount: number;
  };
  availableAddresses: string[];
  shippingOptions: Array<{ id: string; label: string; fee: number }>;
  selectedAddress: string;
  selectedShippingMethod: string;
  note: string;
  pricing: {
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
  };
};

type OrderPlacement = {
  order: {
    id: string;
    status: string;
  };
  payment: {
    id: string;
    method: string;
    status: string;
    checkoutUrl: string | null;
  };
};

type ApiPayload = {
  success: boolean;
  state?: string;
  error?: string;
  message?: string;
  data?: unknown;
};

type PaymentStatusPayload = {
  orderId: string;
  orderStatus: string;
  payment: {
    id: string;
    status: string;
    checkoutUrl: string | null;
  };
  stateLabel: string;
  stateTimestamp: string | null;
  stateSource: string;
  nextAction: "retry_payment" | "refresh_status" | "none";
  nextActionLabel: string;
  nextActionGuidance: string;
};

type FieldError = "address" | "addressFormat" | "shippingMethod" | "paymentMethod" | null;

const CUSTOM_ADDRESS_VALUE = "__custom__";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function isCheckoutSummary(value: unknown): value is CheckoutSummary {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { pricing?: unknown; shippingOptions?: unknown; availableAddresses?: unknown };
  return (
    Boolean(maybe.pricing && typeof maybe.pricing === "object") &&
    Array.isArray(maybe.shippingOptions) &&
    Array.isArray(maybe.availableAddresses)
  );
}

function isOrderPlacement(value: unknown): value is OrderPlacement {
  if (!value || typeof value !== "object") return false;
  const maybe = value as { order?: unknown; payment?: unknown };
  return Boolean(maybe.order && typeof maybe.order === "object" && maybe.payment && typeof maybe.payment === "object");
}

function isPaymentStatusPayload(value: unknown): value is PaymentStatusPayload {
  if (!value || typeof value !== "object") return false;
  const maybe = value as {
    payment?: unknown;
    orderId?: unknown;
    nextAction?: unknown;
    stateLabel?: unknown;
    stateTimestamp?: unknown;
    stateSource?: unknown;
    nextActionLabel?: unknown;
    nextActionGuidance?: unknown;
  };

  const nextActionValid =
    maybe.nextAction === "retry_payment" || maybe.nextAction === "refresh_status" || maybe.nextAction === "none";

  return Boolean(
    maybe.payment &&
      typeof maybe.payment === "object" &&
      typeof maybe.orderId === "string" &&
      nextActionValid &&
      (typeof maybe.stateLabel === "string" || maybe.stateLabel === undefined) &&
      (typeof maybe.stateTimestamp === "string" || maybe.stateTimestamp === null || maybe.stateTimestamp === undefined) &&
      (typeof maybe.stateSource === "string" || maybe.stateSource === undefined) &&
      (typeof maybe.nextActionLabel === "string" || maybe.nextActionLabel === undefined) &&
      (typeof maybe.nextActionGuidance === "string" || maybe.nextActionGuidance === undefined),
  );
}

function PaymentStatusTimeline({
  stateLabel,
  stateTimestamp,
  stateSource,
  nextActionLabel,
  nextActionGuidance,
  mode,
}: {
  stateLabel: string;
  stateTimestamp: string | null;
  stateSource: string;
  nextActionLabel: string;
  nextActionGuidance: string;
  mode: "summary" | "full";
}) {
  return (
    <ol className="space-y-2 rounded border border-zinc-200 bg-zinc-50 px-4 py-3" aria-label="Timeline trạng thái thanh toán">
      <li className="text-sm text-zinc-800">
        <p className="font-medium">{stateLabel}</p>
        <p className="text-zinc-600">Mốc thời gian: {formatTimelineTimestamp(stateTimestamp)}</p>
      </li>
      <li className="text-sm text-zinc-800">
        <p className="font-medium">Hành động tiếp theo: {nextActionLabel}</p>
        <p className="text-zinc-600">{nextActionGuidance}</p>
      </li>
      {mode === "full" ? (
        <li className="text-sm text-zinc-700">Nguồn cập nhật: {stateSource}</li>
      ) : null}
    </ol>
  );
}

export function CheckoutClient() {
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderPlacement | null>(null);
  const [selectedAddressOption, setSelectedAddressOption] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [error, setError] = useState("");
  const [paymentStatusError, setPaymentStatusError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusPayload | null>(null);
  const [fieldError, setFieldError] = useState<FieldError>(null);

  const addressRef = useRef<HTMLSelectElement | null>(null);
  const customAddressRef = useRef<HTMLInputElement | null>(null);
  const shippingRef = useRef<HTMLSelectElement | null>(null);
  const paymentRef = useRef<HTMLSelectElement | null>(null);
  const retryPaymentRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    async function loadDraft() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/checkout", { cache: "no-store" });
        const payload: ApiPayload = await response.json();

        const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
        if (authRedirectPath) {
          window.location.assign(authRedirectPath);
          return;
        }

        if (!response.ok || !payload.success || !isCheckoutSummary(payload.data)) {
          setError(payload.message ?? "Không thể tải thông tin checkout.");
          setSummary(null);
          return;
        }

        setSummary(payload.data);
        if (payload.data.availableAddresses.includes(payload.data.selectedAddress)) {
          setSelectedAddressOption(payload.data.selectedAddress);
          setCustomAddress("");
        } else {
          setSelectedAddressOption(CUSTOM_ADDRESS_VALUE);
          setCustomAddress(payload.data.selectedAddress);
        }
        setShippingMethod(payload.data.selectedShippingMethod);
        setPaymentMethod("online");
        setNote(payload.data.note ?? "");
      } catch {
        setError("Không thể kết nối tới máy chủ.");
        setSummary(null);
      } finally {
        setLoading(false);
      }
    }

    void loadDraft();
  }, []);

  function focusFirstErrorField(nextFieldError: FieldError) {
    if (nextFieldError === "address") {
      if (selectedAddressOption === CUSTOM_ADDRESS_VALUE) {
        customAddressRef.current?.focus();
      } else {
        addressRef.current?.focus();
      }
      return;
    }

    if (nextFieldError === "addressFormat") {
      if (selectedAddressOption === CUSTOM_ADDRESS_VALUE) {
        customAddressRef.current?.focus();
      } else {
        addressRef.current?.focus();
      }
      return;
    }

    if (nextFieldError === "shippingMethod") {
      shippingRef.current?.focus();
      return;
    }

    if (nextFieldError === "paymentMethod") {
      paymentRef.current?.focus();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const resolvedAddress =
      selectedAddressOption === CUSTOM_ADDRESS_VALUE ? customAddress : selectedAddressOption;

    const nextFieldError = resolveCheckoutFieldError(
      resolvedAddress,
      shippingMethod,
      paymentMethod,
    ) as FieldError;
    setFieldError(nextFieldError);

    if (nextFieldError) {
      focusFirstErrorField(nextFieldError);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: resolvedAddress,
          shippingMethod,
          paymentMethod,
          note,
        }),
      });

      const payload: ApiPayload = await response.json();
      const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
      if (authRedirectPath) {
        window.location.assign(authRedirectPath);
        return;
      }

      if (!response.ok || !payload.success || !isOrderPlacement(payload.data)) {
        setError(payload.message ?? "Không thể đặt hàng.");
        return;
      }

      setPlacedOrder(payload.data);
      setPaymentStatus(null);
      setPaymentStatusError("");
      setFieldError(null);
    } catch {
      setError("Không thể kết nối tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  const refreshPaymentStatus = useCallback(async (orderId: string) => {
    setPaymentStatusError("");

    try {
      const response = await fetch(`/api/checkout/payment-status?orderId=${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      const payload: ApiPayload = await response.json();

      const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
      if (authRedirectPath) {
        window.location.assign(authRedirectPath);
        return;
      }

      if (!response.ok || !payload.success || !isPaymentStatusPayload(payload.data)) {
        setPaymentStatusError(payload.message ?? "Không thể cập nhật trạng thái thanh toán.");
        return;
      }

      setPaymentStatus(payload.data);
    } catch {
      setPaymentStatusError("Không thể kết nối để cập nhật trạng thái thanh toán.");
    }
  }, []);

  const handleRetryPayment = useCallback(async (orderId: string) => {
    setRetryingPayment(true);
    setPaymentStatusError("");

    try {
      const response = await fetch("/api/checkout/retry-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const payload: ApiPayload = await response.json();

      const authRedirectPath = resolveAuthRedirectPath(response.status, payload.error);
      if (authRedirectPath) {
        window.location.assign(authRedirectPath);
        return;
      }

      if (!response.ok || !payload.success) {
        setPaymentStatusError(payload.message ?? "Không thể thực hiện thanh toán lại.");
        return;
      }

      if (isOrderPlacement(payload.data)) {
        setPlacedOrder(payload.data);
      }

      await refreshPaymentStatus(orderId);
    } catch {
      setPaymentStatusError("Không thể kết nối để retry thanh toán.");
    } finally {
      setRetryingPayment(false);
    }
  }, [refreshPaymentStatus]);

  useEffect(() => {
    if (!placedOrder) return;

    void refreshPaymentStatus(placedOrder.order.id);
  }, [placedOrder, refreshPaymentStatus]);

  useEffect(() => {
    if (!placedOrder || paymentStatus?.nextAction !== "refresh_status") {
      return;
    }

    const timer = window.setInterval(() => {
      void refreshPaymentStatus(placedOrder.order.id);
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [placedOrder, paymentStatus?.nextAction, refreshPaymentStatus]);

  useEffect(() => {
    if (paymentStatus?.nextAction !== "retry_payment") {
      return;
    }

    retryPaymentRef.current?.focus();
  }, [paymentStatus?.nextAction]);

  const pricing = useMemo(
    () => summary?.pricing ?? { subtotal: 0, shippingFee: 0, discount: 0, total: 0 },
    [summary?.pricing],
  );

  if (loading) {
    return (
      <PageShell title="Checkout" maxWidth="3xl">
        <StatePanel state="loading" title="Đang tải checkout" description="Vui lòng chờ trong giây lát." />
      </PageShell>
    );
  }

  if (placedOrder) {
    const displayedOrderStatus = paymentStatus?.orderStatus ?? placedOrder.order.status;
    const timelineStateLabel = paymentStatus?.stateLabel ?? "Đang cập nhật trạng thái thanh toán";
    const timelineStateTimestamp = paymentStatus?.stateTimestamp ?? null;
    const timelineStateSource = paymentStatus?.stateSource ?? "unknown";
    const timelineActionLabel = paymentStatus?.nextActionLabel ?? "Kiểm tra trạng thái";
    const timelineActionGuidance =
      paymentStatus?.nextActionGuidance ?? "Hệ thống đang đồng bộ trạng thái thanh toán mới nhất.";

    return (
      <PageShell title="Đặt hàng thành công" maxWidth="3xl">
        <FeedbackMessage tone="success" message={`Mã đơn hàng: ${placedOrder.order.id}`} />
        <p className="text-sm text-zinc-700">Trạng thái đơn: {displayedOrderStatus}</p>
        <p className="text-sm text-zinc-700" aria-live="polite">
          Trạng thái thanh toán hiện tại: {timelineStateLabel}
        </p>

        <PaymentStatusTimeline
          stateLabel={timelineStateLabel}
          stateTimestamp={timelineStateTimestamp}
          stateSource={timelineStateSource}
          nextActionLabel={timelineActionLabel}
          nextActionGuidance={timelineActionGuidance}
          mode="summary"
        />

        {paymentStatusError ? <FeedbackMessage tone="error" message={paymentStatusError} /> : null}

        {paymentStatus?.nextAction === "retry_payment" ? (
          <div className="flex flex-wrap gap-2">
            <ActionButton
              ref={retryPaymentRef}
              onClick={() => void handleRetryPayment(placedOrder.order.id)}
              disabled={retryingPayment}
              aria-disabled={retryingPayment}
            >
              {retryingPayment ? "Đang tạo giao dịch mới..." : timelineActionLabel}
            </ActionButton>
            <ActionButton
              onClick={() => void refreshPaymentStatus(placedOrder.order.id)}
              disabled={retryingPayment}
              variant="secondary"
            >
              Làm mới trạng thái
            </ActionButton>
          </div>
        ) : null}

        {paymentStatus?.nextAction === "refresh_status" ? (
          <ActionButton onClick={() => void refreshPaymentStatus(placedOrder.order.id)} variant="secondary">
            {timelineActionLabel}
          </ActionButton>
        ) : null}

        {(paymentStatus?.payment.checkoutUrl ?? placedOrder.payment.checkoutUrl) ? (
          <a
            href={paymentStatus?.payment.checkoutUrl ?? placedOrder.payment.checkoutUrl ?? "#"}
            className="inline-flex w-fit rounded bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Tiếp tục thanh toán online
          </a>
        ) : (
          <p className="text-sm text-zinc-700">Bạn đã chọn COD. Đơn hàng sẽ thanh toán khi nhận hàng.</p>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell title="Checkout" maxWidth="3xl">
      {error ? <FeedbackMessage tone="error" message={error} /> : null}

      {!summary ? (
        <StatePanel state="empty" title="Chưa có dữ liệu checkout" description="Chưa có dữ liệu checkout khả dụng." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm" aria-label="Biểu mẫu checkout">
          <div className="space-y-1">
            <label htmlFor="checkout-address" className="block text-sm font-medium">
              Địa chỉ nhận hàng
            </label>
            <select
              id="checkout-address"
              ref={addressRef}
              value={selectedAddressOption}
              onChange={(event) => {
                setSelectedAddressOption(event.target.value);
                if (event.target.value !== CUSTOM_ADDRESS_VALUE) {
                  setCustomAddress("");
                }
                if (fieldError === "address" || fieldError === "addressFormat") {
                  setFieldError(null);
                }
              }}
              aria-invalid={fieldError === "address"}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d2d] focus-visible:ring-offset-2"
              disabled={submitting}
            >
              <option value="">Chọn địa chỉ giao hàng</option>
              {summary.availableAddresses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
              <option value={CUSTOM_ADDRESS_VALUE}>Nhập địa chỉ khác</option>
            </select>
            {fieldError === "address" ? <p className="text-sm text-red-700">Vui lòng chọn địa chỉ giao hàng.</p> : null}
          </div>

          {selectedAddressOption === CUSTOM_ADDRESS_VALUE ? (
            <div className="space-y-1">
              <label htmlFor="checkout-custom-address" className="block text-sm font-medium">
                Địa chỉ giao hàng khác
              </label>
              <input
                id="checkout-custom-address"
                ref={customAddressRef}
                type="text"
                value={customAddress}
                onChange={(event) => {
                  setCustomAddress(event.target.value);
                  if (fieldError === "address" || fieldError === "addressFormat") {
                    setFieldError(null);
                  }
                }}
                aria-invalid={fieldError === "address" || fieldError === "addressFormat"}
                className="w-full rounded-sm border border-zinc-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d2d] focus-visible:ring-offset-2"
                disabled={submitting}
              />
              {fieldError === "addressFormat" ? (
                <p className="text-sm text-red-700">Địa chỉ giao hàng không đúng định dạng tối thiểu.</p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1">
            <label htmlFor="checkout-shipping" className="block text-sm font-medium">
              Phương thức vận chuyển
            </label>
            <select
              id="checkout-shipping"
              ref={shippingRef}
              value={shippingMethod}
              onChange={(event) => {
                setShippingMethod(event.target.value);
                if (fieldError === "shippingMethod") {
                  setFieldError(null);
                }
              }}
              aria-invalid={fieldError === "shippingMethod"}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d2d] focus-visible:ring-offset-2"
              disabled={submitting}
            >
              <option value="">Chọn phương thức vận chuyển</option>
              {summary.shippingOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label} - {formatCurrency(option.fee)}
                </option>
              ))}
            </select>
            {fieldError === "shippingMethod" ? (
              <p className="text-sm text-red-700">Vui lòng chọn phương thức vận chuyển.</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="checkout-payment-method" className="block text-sm font-medium">
              Phương thức thanh toán
            </label>
            <select
              id="checkout-payment-method"
              ref={paymentRef}
              value={paymentMethod}
              onChange={(event) => {
                setPaymentMethod(event.target.value);
                if (fieldError === "paymentMethod") {
                  setFieldError(null);
                }
              }}
              aria-invalid={fieldError === "paymentMethod"}
              className="w-full rounded-sm border border-zinc-300 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d2d] focus-visible:ring-offset-2"
              disabled={submitting}
            >
              <option value="">Chọn phương thức thanh toán</option>
              <option value="online">Thanh toán online</option>
              <option value="cod">Thanh toán khi nhận hàng (COD)</option>
            </select>
            {fieldError === "paymentMethod" ? (
              <p className="text-sm text-red-700">Vui lòng chọn phương thức thanh toán.</p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label htmlFor="checkout-note" className="block text-sm font-medium">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              id="checkout-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="min-h-24 w-full rounded border px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              disabled={submitting}
            />
          </div>

          <section className="space-y-2 rounded-sm border border-zinc-200 bg-zinc-50 p-3" aria-label="Tổng tiền checkout">
            <p className="flex items-center justify-between text-sm text-zinc-700">
              <span>Tạm tính</span>
              <span>{formatCurrency(pricing.subtotal)}</span>
            </p>
            <p className="flex items-center justify-between text-sm text-zinc-700">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(pricing.shippingFee)}</span>
            </p>
            <p className="flex items-center justify-between text-sm text-zinc-700">
              <span>Khuyến mãi</span>
              <span>-{formatCurrency(pricing.discount)}</span>
            </p>
            <p className="flex items-center justify-between text-base font-semibold">
              <span>Tổng cộng</span>
              <span className="text-[#ee4d2d]">{formatCurrency(pricing.total)}</span>
            </p>
          </section>

          <ActionButton type="submit" disabled={submitting} className="w-full">
            {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
          </ActionButton>
        </form>
      )}
    </PageShell>
  );
}
