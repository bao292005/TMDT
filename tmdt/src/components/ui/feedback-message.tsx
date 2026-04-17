import { ReactNode } from "react";

type FeedbackTone = "error" | "success" | "warning" | "info";

type FeedbackMessageProps = {
  tone: FeedbackTone;
  message: string;
  title?: string;
  children?: ReactNode;
  className?: string;
};

const TONE_CLASS: Record<FeedbackTone, string> = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-[#ffd4cc] bg-[#fff4f2] text-[#9a3412]",
};

const TONE_LABEL: Record<FeedbackTone, string> = {
  error: "Lỗi",
  success: "Thành công",
  warning: "Cảnh báo",
  info: "Thông tin",
};

export function FeedbackMessage({ tone, title, message, children, className = "" }: FeedbackMessageProps) {
  const role = tone === "error" || tone === "warning" ? "alert" : "status";

  return (
    <div role={role} className={`rounded-sm border px-3 py-2 text-sm ${TONE_CLASS[tone]} ${className}`.trim()}>
      <p className="font-medium">{title ?? TONE_LABEL[tone]}</p>
      <p>{message}</p>
      {children}
    </div>
  );
}
