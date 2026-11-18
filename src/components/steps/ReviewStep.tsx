"use client";

import clsx from "clsx";
import { AlertCircle, Building2, ChevronDown, Database, RefreshCw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SystemBadge } from "@/components/ui/SystemBadge";
import { StepLayout } from "@/components/wizard/StepLayout";
import { importIntegration } from "@/lib/api";
import { getDataType, getSystem, relevantDataTypes, type DataTypeId, type IntegrationSystem } from "@/lib/catalog";
import { sumCounts } from "@/lib/recordCounts";
import { sampleContext } from "@/lib/sampleRecords";
import { useWizard, type ImportResult } from "@/lib/store";

const fmt = new Intl.NumberFormat("en-US");

export function ReviewStep() {
  const company = useWizard((s) => s.company);
  const dataTypes = useWizard((s) => s.dataTypes);
  const systemIds = useWizard((s) => s.systems);
  const connections = useWizard((s) => s.connections);
  const imports = useWizard((s) => s.imports);
  const setImport = useWizard((s) => s.setImport);
  const complete = useWizard((s) => s.complete);

  const systems = systemIds.map(getSystem).filter((s): s is IntegrationSystem => !!s);
  const connected = systems.filter((s) => connections[s.id]?.status === "connected");
  const notConnected = systems.filter((s) => connections[s.id]?.status !== "connected");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const inFlight = useRef(new Set<string>());
  const [, force] = useState(0);

  const runImport = async (system: IntegrationSystem) => {
    if (!company || inFlight.current.has(system.id)) return;
    inFlight.current.add(system.id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[system.id];
      return next;
    });
    force((n) => n + 1);
    try {
      const { counts, samples } = await importIntegration({
        systemId: system.id,
        dataTypes: relevantDataTypes(system, dataTypes),
        companySize: company.size,
        context: sampleContext(company),
      });
      setImport(system.id, { counts, samples });
    } catch (e) {
      setErrors((prev) => ({ ...prev, [system.id]: e instanceof Error ? e.message : "Import failed" }));
    } finally {
      inFlight.current.delete(system.id);
      force((n) => n + 1);
    }
  };

  useEffect(() => {
    connected.filter((s) => !imports[s.id]).forEach((s) => void runImport(s));
    // Run once on mount; retries are manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = connected.filter((s) => imports[s.id]).length;
  const importing = done < connected.length;
  const grandTotal = connected.reduce((sum, s) => sum + sumCounts(imports[s.id]?.counts), 0);

  return (
    <StepLayout
      title={importing ? "Importing your data…" : "Your data is in Assetly"}
      description={
        importing
          ? "We're running the first sync from each connected system. This usually takes a few seconds."
          : "Here's what we imported. Preview a few records from each system, then finish setup to open your workspace."
      }
      onSubmit={complete}
      nextLabel="Complete setup"
      nextDisabled={importing}
      footerNote={importing ? `${done} of ${connected.length} imports finished` : null}
    >
      {company && (
        <section aria-label="Company summary" className="mb-5 flex items-center gap-4 rounded-xl border border-slate-200 p-4">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
            {company.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL
              <img src={company.logo} alt={`${company.name} logo`} className="size-full object-contain p-1" />
            ) : (
              <Building2 className="size-5 text-slate-400" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{company.name}</p>
            <p className="text-xs text-slate-600">
              {company.industry} · {company.size} employees · {company.city}, {company.country}
            </p>
            <p className="text-xs text-slate-500">
              Admin: {company.adminName} ({company.adminEmail})
            </p>
          </div>
        </section>
      )}

      <section aria-label="Records imported per integration" className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex justify-between bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-500" aria-hidden>
          <span>Integration</span>
          <span>Records</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {connected.map((system) => (
            <ImportRow
              key={system.id}
              system={system}
              result={imports[system.id]}
              error={errors[system.id]}
              onRetry={() => void runImport(system)}
            />
          ))}
        </ul>
        <div className="flex items-center justify-between bg-brand-50/60 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Database className="size-4 text-brand-700" aria-hidden /> Total records
          </span>
          <span className="text-base font-bold text-brand-800 tabular-nums" data-testid="grand-total">
            {importing ? "—" : fmt.format(grandTotal)}
          </span>
        </div>
      </section>

      {notConnected.length > 0 && (
        <p className="mt-4 text-xs text-slate-500">
          Not connected yet: {notConnected.map((s) => s.name).join(", ")}. You can finish these from Settings →
          Integrations at any time.
        </p>
      )}
    </StepLayout>
  );
}

interface ImportRowProps {
  system: IntegrationSystem;
  result: ImportResult | undefined;
  error: string | undefined;
  onRetry: () => void;
}

function ImportRow({ system, result, error, onRetry }: ImportRowProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sampleTypes = Object.keys(result?.samples ?? {}) as DataTypeId[];

  return (
    <li data-testid={`import-${system.id}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <SystemBadge system={system} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-900">{system.name}</p>
          {result ? (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
                {Object.entries(result.counts).map(([dt, n]) => (
                  <li key={dt}>
                    {getDataType(dt as DataTypeId).label}: <span className="tabular-nums">{fmt.format(n ?? 0)}</span>
                  </li>
                ))}
              </ul>
              {sampleTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className="inline-flex items-center gap-0.5 rounded text-xs font-medium text-brand-700 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  {open ? "Hide records" : "Preview records"}
                  <ChevronDown className={clsx("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
                </button>
              )}
            </div>
          ) : error ? (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {error}
            </p>
          ) : (
            <div
              className="mt-2 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-label={`Importing from ${system.name}`}
            >
              <div className="animate-progress h-full w-2/5 rounded-full bg-brand-500" />
            </div>
          )}
        </div>
        <div className="text-right text-sm font-semibold text-slate-900 tabular-nums">
          {result ? (
            fmt.format(sumCounts(result.counts))
          ) : error ? (
            <Button variant="ghost" size="sm" onClick={onRetry}>
              <RefreshCw className="size-3.5" aria-hidden /> Retry
            </Button>
          ) : (
            <span className="text-xs font-normal text-slate-500">Syncing…</span>
          )}
        </div>
      </div>

      {open && result && (
        <div id={panelId} className="animate-fade-in space-y-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4">
          {sampleTypes.map((dt) => (
            <SamplePreview
              key={dt}
              system={system}
              label={getDataType(dt).label}
              total={result.counts[dt] ?? 0}
              table={result.samples[dt]!}
            />
          ))}
        </div>
      )}
    </li>
  );
}

function SamplePreview({
  system,
  label,
  total,
  table,
}: {
  system: IntegrationSystem;
  label: string;
  total: number;
  table: NonNullable<ImportResult["samples"][DataTypeId]>;
}) {
  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">
            Sample {label.toLowerCase()} imported from {system.name}
          </caption>
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {table.columns.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={clsx("px-3 py-2 whitespace-nowrap", j === 0 && "font-medium text-slate-900")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1.5 text-[11px] text-slate-500">
        Showing {table.rows.length} of {fmt.format(total)} {label.toLowerCase()} · full list available in your workspace
      </p>
    </div>
  );
}
