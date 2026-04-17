import Image from "next/image";
import { FormEvent } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { StatePanel } from "@/components/ui/state-panel";

export type TryOnState = "idle" | "processing" | "success" | "error" | "timeout";

type TryOnConfidencePanelProps = {
  state: TryOnState;
  statusMessage: string;
  confidence: number | null;
  resultImageUrl: string;
  ctaLabel: string;
  submitDisabled: boolean;
  showRetryAction: boolean;
  retryDisabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRetry: () => void;
  onFileChange: (file: File | null) => void;
};

export function TryOnConfidencePanel({
  state,
  statusMessage,
  confidence,
  resultImageUrl,
  ctaLabel,
  submitDisabled,
  showRetryAction,
  retryDisabled,
  onSubmit,
  onRetry,
  onFileChange,
}: TryOnConfidencePanelProps) {
  return (
    <section className="space-y-4 rounded-sm border border-zinc-200 bg-white p-4" aria-labelledby="tryon-heading">
      <div className="space-y-1">
        <h2 id="tryon-heading" className="text-lg font-semibold text-zinc-900">
          AI Try-On
        </h2>
        <p className="text-sm text-zinc-600">Tải ảnh để xem kết quả thử đồ cho sản phẩm đang chọn.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="tryon-image" className="block text-sm font-medium text-zinc-700">
            Ảnh người mẫu
          </label>
          <input
            id="tryon-image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            disabled={state === "processing"}
            className="w-full rounded-sm border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee4d2d] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton type="submit" variant="secondary" disabled={submitDisabled} aria-disabled={submitDisabled}>
            {ctaLabel}
          </ActionButton>

          {showRetryAction ? (
            <ActionButton type="button" variant="ghost" onClick={onRetry} disabled={retryDisabled} aria-disabled={retryDisabled}>
              Thử lại
            </ActionButton>
          ) : null}
        </div>
      </form>

      <div aria-live="polite" className="space-y-2 text-sm">
        {state === "processing" ? (
          <StatePanel state="loading" title="Đang xử lý thử đồ AI" description={statusMessage || "Vui lòng chờ trong giây lát."} />
        ) : null}

        {state !== "processing" && statusMessage ? (
          <FeedbackMessage
            tone={state === "success" ? "success" : state === "error" || state === "timeout" ? "warning" : "info"}
            message={statusMessage}
          />
        ) : null}
      </div>

      {state === "success" && resultImageUrl ? (
        <div className="space-y-2 rounded-sm border border-emerald-200 p-3">
          <p className="text-sm text-zinc-700">
            Độ phù hợp ước tính: {confidence !== null ? `${Math.round(confidence * 100)}%` : "N/A"}
          </p>
          <Image
            src={resultImageUrl}
            alt="Kết quả AI thử đồ"
            width={800}
            height={800}
            className="h-auto w-full rounded-sm border border-zinc-200 object-cover"
            unoptimized
          />
        </div>
      ) : null}
    </section>
  );
}
