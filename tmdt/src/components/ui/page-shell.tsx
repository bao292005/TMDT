import { ReactNode } from "react";

type PageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl";
};

const WIDTH_CLASS = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
};

export function PageShell({ title, description, children, maxWidth = "5xl" }: PageShellProps) {
  return (
    <main className={`mx-auto flex min-h-screen w-full flex-col gap-6 px-4 py-6 md:px-6 md:py-8 ${WIDTH_CLASS[maxWidth]}`}>
      <header className="space-y-2 rounded-sm border border-zinc-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        {description ? <p className="text-sm text-zinc-600">{description}</p> : null}
      </header>
      {children}
    </main>
  );
}
