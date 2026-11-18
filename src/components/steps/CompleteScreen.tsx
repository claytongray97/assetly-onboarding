"use client";

import { CheckCircle2, PencilLine } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useWizard } from "@/lib/store";
import { sumCounts } from "@/lib/recordCounts";

const fmt = new Intl.NumberFormat("en-US");

export function CompleteScreen() {
  const company = useWizard((s) => s.company);
  const connections = useWizard((s) => s.connections);
  const imports = useWizard((s) => s.imports);
  const dataTypes = useWizard((s) => s.dataTypes);
  const reopen = useWizard((s) => s.reopen);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  const connected = Object.values(connections).filter((c) => c.status === "connected").length;
  const total = Object.values(imports).reduce((sum, c) => sum + sumCounts(c.counts), 0);

  const rows = [
    { label: "Workspace", value: company?.name ?? "—" },
    { label: "Active integrations", value: String(connected) },
    { label: "Data types managed", value: String(dataTypes.length) },
    { label: "Records imported", value: fmt.format(total) },
    { label: "Next scheduled sync", value: `Tonight, 2:00 AM (${company?.timeZone ?? "UTC"})` },
  ];

  return (
    <div className="animate-fade-in text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100">
        <CheckCircle2 className="size-8 text-brand-700" aria-hidden />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 outline-none sm:text-[1.75rem]">
        You&apos;re all set
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        Your Assetly workspace is live. We&apos;ll keep your connected systems in sync automatically.
      </p>

      <dl className="mt-7 overflow-hidden rounded-xl border border-slate-200 text-left">
        <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">Setup summary</div>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
            <dt className="text-slate-600">{r.label}</dt>
            <dd className="font-medium text-slate-900 tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row">
        <Button variant="secondary" onClick={reopen}>
          <PencilLine className="size-4" aria-hidden />
          Review setup
        </Button>
      </div>
    </div>
  );
}
