import { forwardRef, InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className = "", id, ...props },
  ref,
) {
  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={id}
        className={`w-full rounded-sm border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#ee4d2d] ${
          error ? "border-red-500 focus:border-red-500" : "border-zinc-300"
        } ${className}`.trim()}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
});
