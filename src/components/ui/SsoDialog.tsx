"use client";

import { ChevronRight, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getDataType, type DataTypeId, type IntegrationSystem } from "@/lib/catalog";
import { Button } from "./Button";
import { SystemBadge } from "./SystemBadge";

const SCOPES: Record<DataTypeId, string> = {
  assets: "Read device and hardware inventory",
  users: "Read your organization's user directory",
  financial: "Read fixed-asset and GL records",
  locations: "Read buildings, rooms and resource calendars",
  vendors: "Read supplier records",
  contracts: "Read agreements and their metadata",
  licenses: "Read license assignments and seat usage",
  iot: "Read device telemetry",
};

interface SsoDialogProps {
  system: IntegrationSystem;
  dataTypes: DataTypeId[];
  suggestedAccount?: string;
  open: boolean;
  onClose: () => void;
  onAuthorize: (account: string) => void;
}

/**
 * Simulated OAuth consent popup: account chooser → permissions → authorize.
 * Uses native <dialog> for focus trapping, Esc-to-close and inert background.
 */
export function SsoDialog({ system, dataTypes, suggestedAccount, open, onClose, onAuthorize }: SsoDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setAccount(null);
      setCustom("");
      setCustomError(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const submitCustom = () => {
    if (!/^\S+@\S+\.\S+$/.test(custom.trim())) return setCustomError("Enter a valid email address");
    setAccount(custom.trim());
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="sso-title"
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-2xl bg-white p-0 shadow-2xl"
    >
      <div className="relative p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <SystemBadge system={system} />
          <h2 id="sso-title" className="mt-3 text-lg font-semibold text-slate-900">
            {account ? "Review permissions" : `Sign in with ${system.name}`}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {account ? (
              <>
                <span className="font-medium text-slate-800">Assetly</span> wants to access your account
              </>
            ) : (
              <>
                to continue to <span className="font-medium text-slate-800">Assetly</span>
              </>
            )}
          </p>
        </div>

        {!account ? (
          <div className="mt-5 space-y-2">
            {suggestedAccount && (
              <button
                type="button"
                onClick={() => setAccount(suggestedAccount)}
                className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-brand-500 hover:bg-brand-50/50 focus-visible:outline-2 focus-visible:outline-brand-600"
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <UserRound className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{suggestedAccount}</span>
                <ChevronRight className="size-4 text-slate-400" aria-hidden />
              </button>
            )}
            <div className="rounded-xl border border-slate-200 p-3">
              <label htmlFor="sso-email" className="text-xs font-medium text-slate-600">
                {suggestedAccount ? "Use another account" : "Email"}
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="sso-email"
                  type="email"
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    setCustomError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitCustom();
                    }
                  }}
                  placeholder="name@company.com"
                  aria-invalid={customError ? true : undefined}
                  aria-describedby={customError ? "sso-email-error" : undefined}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-500/40 focus:outline-none"
                />
                <Button size="sm" variant="secondary" onClick={submitCustom}>
                  Next
                </Button>
              </div>
              {customError && (
                <p id="sso-email-error" role="alert" className="mt-1 text-xs text-red-600">
                  {customError}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <p className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
              Signed in as <span className="font-medium text-slate-800">{account}</span>
            </p>
            <ul className="space-y-2">
              {dataTypes.map((d) => (
                <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  <span>
                    {SCOPES[d]} <span className="text-slate-400">({getDataType(d).label})</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">Read-only access. You can revoke it at any time from {system.name}.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAccount(null)}>
                Back
              </Button>
              <Button onClick={() => onAuthorize(account)}>Allow access</Button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
