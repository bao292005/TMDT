import { ButtonHTMLAttributes, forwardRef } from "react";

type ActionButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
type ActionButtonSize = "sm" | "md";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionButtonVariant;
  size?: ActionButtonSize;
};

const BASE_CLASS =
  "inline-flex items-center justify-center rounded-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const VARIANT_CLASS: Record<ActionButtonVariant, string> = {
  primary: "bg-[#ee4d2d] text-white hover:bg-[#f05d40] focus-visible:ring-[#ee4d2d]",
  secondary: "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 focus-visible:ring-[#ee4d2d]",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
  ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:ring-[#ee4d2d]",
};

const SIZE_CLASS: Record<ActionButtonSize, string> = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-sm",
};

export const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(function ActionButton(
  { className = "", variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${BASE_CLASS} ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`.trim()}
      {...props}
    />
  );
});
