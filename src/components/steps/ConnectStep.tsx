"use client";

import clsx from "clsx";
import { AlertCircle, CheckCircle2, ChevronDown, CircleDashed, LogIn, MinusCircle } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { SsoDialog } from "@/components/ui/SsoDialog";
import { SystemBadge } from "@/components/ui/SystemBadge";
import { StepLayout } from "@/components/wizard/StepLayout";
import { connectIntegration } from "@/lib/api";
import { AUTH_LABELS, getSystem, relevantDataTypes, type IntegrationSystem } from "@/lib/catalog";
import type { ConnectRequest } from "@/lib/schemas";
import { useWizard, type ConnectionState } from "@/lib/store";

export function ConnectStep() {
  const systemIds = useWizard((s) => s.systems);
  const connections = useWizard((s) => s.connections);
  const setConnection = useWizard((s) => s.setConnection);
  const advance = useWizard((s) => s.advance);

  const systems = systemIds.map(getSystem).filter((s): s is IntegrationSystem => !!s);
  const connectedCount = systems.filter((s) => connections[s.id]?.status === "connected").length;
  const [error, setError] = useState<string | null>(null);

  const onSubmit = () => {
    if (connectedCount === 0) return setError("Connect at least one system to continue.");
    // Anything left unconnected is recorded as skipped so it can be finished later.
    for (const s of systems) {
      if (connections[s.id]?.status !== "connected") setConnection(s.id, { status: "skipped" });
    }
    advance();
  };

  return (
    <StepLayout
      title="Connect your systems"
      description="Sign in or provide credentials for each system. Assetly only requests read-only access, and credentials are sent once to verify the connection — never stored in your browser."
      onSubmit={onSubmit}
      footerNote={`${connectedCount} of ${systems.length} connected`}
    >
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
        {systems.map((system) => (
          <ConnectionRow
            key={system.id}
            system={system}
            state={connections[system.id]}
            onChange={(state) => {
              setError(null);
              setConnection(system.id, state);
            }}
          />
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Demo tip: an API key shorter than 16 characters or containing “invalid” will be rejected so you can see error
        handling.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </StepLayout>
  );
}

interface RowProps {
  system: IntegrationSystem;
  state: ConnectionState | undefined;
  onChange: (state: ConnectionState | null) => void;
}

function ConnectionRow({ system, state, onChange }: RowProps) {
  const dataTypes = useWizard((s) => s.dataTypes);
  const adminEmail = useWizard((s) => s.company?.adminEmail);
  const [expanded, setExpanded] = useState(state?.status === "failed");
  const [ssoOpen, setSsoOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const relevant = relevantDataTypes(system, dataTypes);
  const status = busy ? "connecting" : (state?.status ?? "idle");

  async function connect(req: ConnectRequest) {
    setBusy(true);
    try {
      const res = await connectIntegration(req);
      onChange({ status: "connected", account: res.account, connectedAt: res.connectedAt });
      setExpanded(false);
    } catch (e) {
      onChange({ status: "failed", error: e instanceof Error ? e.message : "Connection failed." });
      setExpanded(true);
    } finally {
      setBusy(false);
    }
  }

  const primaryAction = () => {
    if (system.auth === "sso") setSsoOpen(true);
    else setExpanded((v) => !v);
  };

  return (
    <li className="bg-white" data-testid={`connection-${system.id}`}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <SystemBadge system={system} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{system.name}</p>
          <StatusLine status={status} state={state} auth={AUTH_LABELS[system.auth]} />
        </div>

        <div className="flex items-center gap-1.5">
          {status === "connected" ? (
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              Disconnect
            </Button>
          ) : (
            <>
              {status !== "skipped" && (
                <Button variant="ghost" size="sm" onClick={() => onChange({ status: "skipped" })} disabled={busy}>
                  Skip
                </Button>
              )}
              <Button
                variant={system.auth === "sso" ? "primary" : "secondary"}
                size="sm"
                onClick={primaryAction}
                loading={busy}
                aria-expanded={system.auth === "sso" ? undefined : expanded}
                aria-controls={system.auth === "sso" ? undefined : `${system.id}-creds`}
              >
                {system.auth === "sso" ? (
                  <>
                    <LogIn className="size-3.5" aria-hidden />
                    Sign in
                  </>
                ) : (
                  <>
                    {status === "failed" ? "Retry" : "Connect"}
                    <ChevronDown className={clsx("size-3.5 transition-transform", expanded && "rotate-180")} aria-hidden />
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {expanded && system.auth !== "sso" && status !== "connected" && (
        <CredentialsForm system={system} busy={busy} onConnect={connect} />
      )}

      {system.auth === "sso" && (
        <SsoDialog
          system={system}
          dataTypes={relevant}
          suggestedAccount={adminEmail}
          open={ssoOpen}
          onClose={() => setSsoOpen(false)}
          onAuthorize={(account) => {
            setSsoOpen(false);
            void connect({ systemId: system.id, method: "sso", credentials: { account } });
          }}
        />
      )}
    </li>
  );
}

function StatusLine({ status, state, auth }: { status: string; state?: ConnectionState; auth: string }) {
  const base = "mt-0.5 flex items-center gap-1 text-xs";
  switch (status) {
    case "connected":
      return (
        <p className={clsx(base, "text-emerald-700")}>
          <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
          Connected · {state?.status === "connected" && state.account}
        </p>
      );
    case "connecting":
      return <p className={clsx(base, "text-brand-700")}>Verifying connection…</p>;
    case "failed":
      return (
        <p className={clsx(base, "text-red-600")}>
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {state?.status === "failed" && state.error}
        </p>
      );
    case "skipped":
      return (
        <p className={clsx(base, "text-slate-500")}>
          <MinusCircle className="size-3.5 shrink-0" aria-hidden />
          Skipped — you can connect it later
        </p>
      );
    default:
      return (
        <p className={clsx(base, "text-slate-500")}>
          <CircleDashed className="size-3.5 shrink-0" aria-hidden />
          Not connected · {auth}
        </p>
      );
  }
}

function CredentialsForm({
  system,
  busy,
  onConnect,
}: {
  system: IntegrationSystem;
  busy: boolean;
  onConnect: (req: ConnectRequest) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [missing, setMissing] = useState(false);

  const submit = () => {
    if (system.auth === "apiKey") {
      if (!apiKey.trim()) return setMissing(true);
      onConnect({ systemId: system.id, method: "apiKey", credentials: { apiKey } });
    } else {
      if (!instanceUrl.trim() || !clientId.trim() || !clientSecret) return setMissing(true);
      onConnect({ systemId: system.id, method: "oauthClient", credentials: { instanceUrl, clientId, clientSecret } });
    }
  };

  // These inputs live inside the step's <form>; stop Enter from triggering "Next".
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const err = (v: string) => (missing && !v.trim() ? "Required" : undefined);
  const prefix = system.id;

  return (
    <div id={`${prefix}-creds`} className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {system.auth === "apiKey" ? (
          <Field id={`${prefix}-key`} label={`${system.name} API key`} error={err(apiKey)} className="sm:col-span-2">
            {(a) => (
              <Input {...a} type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} onKeyDown={onKeyDown} placeholder="sk_live_…" />
            )}
          </Field>
        ) : (
          <>
            <Field id={`${prefix}-url`} label="Instance URL" error={err(instanceUrl)} className="sm:col-span-2">
              {(a) => (
                <Input {...a} type="url" value={instanceUrl} onChange={(e) => setInstanceUrl(e.target.value)} onKeyDown={onKeyDown} placeholder={`https://yourcompany.${system.id.replace(/-/g, "")}.com`} />
              )}
            </Field>
            <Field id={`${prefix}-cid`} label="Client ID" error={err(clientId)}>
              {(a) => <Input {...a} autoComplete="off" value={clientId} onChange={(e) => setClientId(e.target.value)} onKeyDown={onKeyDown} />}
            </Field>
            <Field id={`${prefix}-secret`} label="Client secret" error={err(clientSecret)}>
              {(a) => (
                <Input {...a} type="password" autoComplete="off" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} onKeyDown={onKeyDown} />
              )}
            </Field>
          </>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={submit} loading={busy}>
          Test & connect
        </Button>
      </div>
    </div>
  );
}
