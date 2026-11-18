"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { SystemBadge } from "@/components/ui/SystemBadge";
import { StepLayout } from "@/components/wizard/StepLayout";
import { AUTH_LABELS, getDataType, systemsForDataTypes, type IntegrationSystem } from "@/lib/catalog";
import { systemsSchema } from "@/lib/schemas";
import { useWizard } from "@/lib/store";

export function SystemsStep() {
  const dataTypes = useWizard((s) => s.dataTypes);
  const saved = useWizard((s) => s.systems);
  const saveSystems = useWizard((s) => s.saveSystems);
  const advance = useWizard((s) => s.advance);

  const available = useMemo(() => systemsForDataTypes(dataTypes), [dataTypes]);
  const [selected, setSelected] = useState<string[]>(saved);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = available.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = Object.entries(
    filtered.reduce<Record<string, IntegrationSystem[]>>((acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    }, {}),
  );

  // Data types the user picked that no selected system covers yet.
  const uncovered = dataTypes.filter(
    (d) => !available.some((s) => selected.includes(s.id) && s.supplies.includes(d)),
  );

  const toggle = (id: string, on: boolean) => {
    setError(null);
    setSelected((prev) => (on ? [...prev, id] : prev.filter((s) => s !== id)));
  };

  const allSelected = available.every((s) => selected.includes(s.id));

  const onSubmit = () => {
    const result = systemsSchema.safeParse(selected);
    if (!result.success) return setError(result.error.issues[0].message);
    saveSystems(available.map((s) => s.id).filter((id) => selected.includes(id)));
    advance();
  };

  return (
    <StepLayout
      title="Choose systems to connect"
      description="Based on the data you selected, these are the systems Assetly can import from. Pick the ones your organization uses."
      onSubmit={onSubmit}
      footerNote={`${selected.length} of ${available.length} selected`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search systems"
            aria-label="Search systems"
            className="w-full rounded-lg border border-slate-300 py-2 pr-3 pl-9 text-sm shadow-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-500/40 focus:outline-none"
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setError(null);
            setSelected(allSelected ? [] : available.map((s) => s.id));
          }}
        >
          {allSelected ? "Clear all" : "Select all"}
        </Button>
      </div>

      {groups.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No systems match “{query}”.</p>}

      <div className="space-y-6">
        {groups.map(([category, systems]) => (
          <fieldset key={category}>
            <legend className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">{category}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {systems.map((system) => (
                <SelectableCard
                  key={system.id}
                  name="systems"
                  value={system.id}
                  checked={selected.includes(system.id)}
                  onChange={(on) => toggle(system.id, on)}
                  title={system.name}
                  description={AUTH_LABELS[system.auth]}
                  icon={<SystemBadge system={system} />}
                >
                  <span className="mt-2 flex flex-wrap gap-1">
                    {system.supplies.map((d) => (
                      <span
                        key={d}
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          dataTypes.includes(d) ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {getDataType(d).label}
                      </span>
                    ))}
                  </span>
                </SelectableCard>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {uncovered.length > 0 && selected.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No selected system provides: {uncovered.map((d) => getDataType(d).label).join(", ")}. You can add one now or
          connect it later.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </StepLayout>
  );
}
