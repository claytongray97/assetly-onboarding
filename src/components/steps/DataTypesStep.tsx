"use client";

import { DollarSign, FileText, KeyRound, MapPin, Package, Radio, Truck, Users, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { StepLayout } from "@/components/wizard/StepLayout";
import { DATA_TYPES, pruneSystems, type DataTypeId } from "@/lib/catalog";
import { dataTypesSchema } from "@/lib/schemas";
import { useWizard } from "@/lib/store";

const ICONS: Record<string, LucideIcon> = { Package, Users, DollarSign, MapPin, Truck, FileText, KeyRound, Radio };

export function DataTypesStep() {
  const saved = useWizard((s) => s.dataTypes);
  const savedSystems = useWizard((s) => s.systems);
  const saveDataTypes = useWizard((s) => s.saveDataTypes);
  const advance = useWizard((s) => s.advance);

  const [selected, setSelected] = useState<DataTypeId[]>(saved);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: DataTypeId, on: boolean) => {
    setError(null);
    setSelected((prev) => (on ? [...prev, id] : prev.filter((d) => d !== id)));
  };

  const removed = savedSystems.length - pruneSystems(savedSystems, selected).length;

  const onSubmit = () => {
    const result = dataTypesSchema.safeParse(selected);
    if (!result.success) return setError(result.error.issues[0].message);
    // Keep catalog order regardless of click order.
    saveDataTypes(DATA_TYPES.map((d) => d.id).filter((id) => selected.includes(id)));
    advance();
  };

  return (
    <StepLayout
      title="What data do you want to bring in?"
      description="Choose everything you'd like Assetly to manage. We'll suggest the right systems to pull it from in the next step."
      onSubmit={onSubmit}
      footerNote={
        removed > 0 ? (
          <span className="text-amber-700">
            {removed} previously selected system{removed > 1 ? "s" : ""} will be removed.
          </span>
        ) : selected.length > 0 ? (
          `${selected.length} selected`
        ) : null
      }
    >
      <fieldset aria-describedby={error ? "data-error" : undefined}>
        <legend className="sr-only">Data types to import</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DATA_TYPES.map((dt) => {
            const Icon = ICONS[dt.icon];
            const checked = selected.includes(dt.id);
            return (
              <SelectableCard
                key={dt.id}
                name="dataTypes"
                value={dt.id}
                checked={checked}
                onChange={(on) => toggle(dt.id, on)}
                title={dt.label}
                description={dt.description}
                icon={
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                }
              />
            );
          })}
        </div>
      </fieldset>
      {error && (
        <p id="data-error" role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </StepLayout>
  );
}
