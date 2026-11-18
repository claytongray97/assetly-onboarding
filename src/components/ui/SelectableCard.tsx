import clsx from "clsx";
import { Check } from "lucide-react";
import type { ReactNode } from "react";

interface SelectableCardProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  name: string;
  value: string;
}

/** A large checkbox rendered as a card. Native input keeps it keyboard- and screen-reader-friendly. */
export function SelectableCard({ checked, onChange, icon, title, description, children, name, value }: SelectableCardProps) {
  return (
    <label
      className={clsx(
        "relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500/50",
        checked
          ? "border-brand-600 bg-brand-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-600">{description}</span>}
        {children}
      </span>
      <span
        aria-hidden
        className={clsx(
          "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-white",
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </label>
  );
}
