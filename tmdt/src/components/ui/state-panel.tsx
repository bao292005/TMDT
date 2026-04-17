import { ActionButton } from "./action-button";

type StateType = "loading" | "empty" | "error" | "info";

type StatePanelProps = {
  state: StateType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

const STATE_CLASS: Record<StateType, string> = {
  loading: "border-zinc-200 bg-white text-zinc-700",
  empty: "border-zinc-200 bg-white text-zinc-700",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-[#ffd4cc] bg-[#fff4f2] text-[#9a3412]",
};

export function StatePanel({ state, title, description, actionLabel, onAction }: StatePanelProps) {
  return (
    <section className={`rounded-sm border px-4 py-3 ${STATE_CLASS[state]}`} aria-live={state === "loading" ? "polite" : undefined}>
      <p className="font-medium">{title}</p>
      <p className="text-sm">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-3">
          <ActionButton variant={state === "error" ? "destructive" : "secondary"} size="sm" onClick={onAction}>
            {actionLabel}
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}
