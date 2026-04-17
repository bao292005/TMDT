"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { TryOnConfidencePanel, type TryOnState } from "./try-on-confidence-panel";

type ProductVariant = {
  size: string;
  color: string;
  stock: number;
  inStock: boolean;
};

type TryOnPanelProps = {
  productSlug: string;
  selectedVariant: ProductVariant;
};

function getStateMessage(state: TryOnState, fallbackMessage: string) {
  if (state === "processing") return "Đang xử lý thử đồ AI...";
  if (state === "timeout") return "Hết thời gian xử lý. Vui lòng thử lại.";
  if (state === "error") return fallbackMessage || "Không thể xử lý thử đồ AI.";
  if (state === "success") return "Xử lý thành công.";
  return "";
}

export function TryOnPanel({ productSlug, selectedVariant }: TryOnPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<TryOnState>("idle");
  const [message, setMessage] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState("");
  const requestVersionRef = useRef(0);

  const selectedVariantId = `${selectedVariant.size}-${selectedVariant.color}`;
  const statusMessage = useMemo(() => getStateMessage(state, message), [state, message]);

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestVersionRef.current;

    async function loadLatestSessionResult() {
      try {
        const response = await fetch(`/api/try-on?productSlug=${encodeURIComponent(productSlug)}`);

        if (cancelled || requestVersionRef.current !== requestId) {
          return;
        }

        if (!response.ok) {
          setState("idle");
          setMessage("");
          setConfidence(null);
          setResultImageUrl("");
          return;
        }

        const payload = await response.json();
        if (cancelled || requestVersionRef.current !== requestId) {
          return;
        }

        if (!payload?.success) {
          setState("idle");
          setMessage("");
          setConfidence(null);
          setResultImageUrl("");
          return;
        }

        const snapshotVariantId = payload?.data?.variantContext?.variantId;
        if (typeof snapshotVariantId === "string" && snapshotVariantId !== selectedVariantId) {
          setState("idle");
          setMessage("");
          setConfidence(null);
          setResultImageUrl("");
          return;
        }

        setState("success");
        setMessage("Đã khôi phục kết quả thử đồ gần nhất trong phiên.");
        setConfidence(typeof payload?.data?.confidence === "number" ? payload.data.confidence : null);
        setResultImageUrl(typeof payload?.data?.tryOnImageUrl === "string" ? payload.data.tryOnImageUrl : "");
      } catch {
        // no-op
      }
    }

    loadLatestSessionResult();

    return () => {
      cancelled = true;
    };
  }, [productSlug, selectedVariantId]);

  async function submitTryOn(isRetry: boolean) {
    if (!file) {
      setState("error");
      setMessage("Vui lòng chọn ảnh trước khi thử đồ.");
      return;
    }

    const requestId = ++requestVersionRef.current;

    setState("processing");
    setMessage("");
    setConfidence(null);
    setResultImageUrl("");

    const formData = new FormData();
    formData.set("image", file);
    formData.set("productSlug", productSlug);
    formData.set("variantId", selectedVariantId);

    if (isRetry) {
      formData.set("retry", "true");
    }

    try {
      const response = await fetch("/api/try-on", {
        method: "POST",
        body: formData,
      });

      let payload = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (requestVersionRef.current !== requestId) {
        return;
      }

      if (!response.ok || !payload?.success) {
        const nextState = payload?.state === "timeout" ? "timeout" : "error";
        setState(nextState);

        if (response.status >= 500 && !payload?.message) {
          setMessage("Dịch vụ thử đồ AI đang bận. Vui lòng thử lại.");
        } else {
          setMessage(payload?.message ?? "Không thể xử lý thử đồ AI.");
        }

        return;
      }

      setState("success");
      setMessage("Kết quả thử đồ đã sẵn sàng.");
      setConfidence(typeof payload?.data?.confidence === "number" ? payload.data.confidence : null);
      setResultImageUrl(typeof payload?.data?.tryOnImageUrl === "string" ? payload.data.tryOnImageUrl : "");
    } catch {
      if (requestVersionRef.current !== requestId) {
        return;
      }

      setState("error");
      setMessage("Không thể kết nối tới dịch vụ thử đồ AI.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitTryOn(false);
  }

  function handleRetry() {
    void submitTryOn(true);
  }

  return (
    <TryOnConfidencePanel
      state={state}
      statusMessage={statusMessage}
      confidence={confidence}
      resultImageUrl={resultImageUrl}
      ctaLabel={state === "processing" ? "Đang xử lý..." : "Thử đồ ngay"}
      submitDisabled={state === "processing" || !file}
      showRetryAction={state === "error" || state === "timeout"}
      retryDisabled={state === "processing" || !file}
      onSubmit={handleSubmit}
      onRetry={handleRetry}
      onFileChange={setFile}
    />
  );
}
