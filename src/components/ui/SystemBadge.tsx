import clsx from "clsx";
import type { IntegrationSystem } from "@/lib/catalog";

/** Generic colored initials mark for an integration (avoids shipping trademarked logos). */
export function SystemBadge({ system, size = "md" }: { system: IntegrationSystem; size?: "sm" | "md" }) {
  const initials = system.name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]+$/.test(w)) // "Microsoft 365" → M, "SAP S/4HANA" → S
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-white shadow-sm",
        size === "md" ? "size-10 text-sm" : "size-7 text-[11px]",
      )}
      style={{ backgroundColor: system.color, textShadow: "0 1px 1px rgb(0 0 0 / 0.25)" }}
    >
      {initials}
    </span>
  );
}
