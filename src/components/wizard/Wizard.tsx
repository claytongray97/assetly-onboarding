"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useHasHydrated, useWizard } from "@/lib/store";
import { CompanyStep } from "@/components/steps/CompanyStep";
import { DataTypesStep } from "@/components/steps/DataTypesStep";
import { SystemsStep } from "@/components/steps/SystemsStep";
import { ConnectStep } from "@/components/steps/ConnectStep";
import { ReviewStep } from "@/components/steps/ReviewStep";
import { CompleteScreen } from "@/components/steps/CompleteScreen";
import { StepTracker } from "./StepTracker";

const STEP_COMPONENTS = [CompanyStep, DataTypesStep, SystemsStep, ConnectStep, ReviewStep];

export function Wizard() {
  const hydrated = useHasHydrated();
  const currentStep = useWizard((s) => s.currentStep);
  const furthestStep = useWizard((s) => s.furthestStep);
  const completed = useWizard((s) => s.completed);
  const goTo = useWizard((s) => s.goTo);

  const Step = STEP_COMPONENTS[currentStep];

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-7 shadow-xl shadow-slate-900/5 sm:px-10 sm:py-9">
        <div className="mb-7 flex items-center justify-between">
          <Brand />
          {hydrated && (furthestStep > 0 || completed) && <StartOver />}
        </div>

        {!hydrated ? (
          <Skeleton />
        ) : (
          <>
            <div className="mb-8">
              <StepTracker current={currentStep} furthest={furthestStep} completed={completed} onSelect={goTo} />
            </div>
            {completed ? <CompleteScreen /> : <Step key={currentStep} />}
          </>
        )}
      </div>
      <p className="mt-5 text-center text-xs text-slate-500">
        Progress is saved in this browser automatically. Integrations are simulated for demo purposes.
      </p>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-brand-600" />
        <path d="M9 22 16 9l7 13" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="16" cy="19" r="2.2" fill="white" />
      </svg>
      <span className="text-lg font-semibold tracking-tight text-slate-900">Assetly</span>
    </div>
  );
}

/** Two-click reset (no browser confirm() dialog). */
function StartOver() {
  const reset = useWizard((s) => s.reset);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      variant={armed ? "danger" : "ghost"}
      size="sm"
      onClick={() => (armed ? (reset(), setArmed(false)) : setArmed(true))}
    >
      <RotateCcw className="size-3.5" aria-hidden />
      {armed ? "Click again to reset" : "Start over"}
    </Button>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 rounded bg-slate-100" />
      <div className="mx-auto h-7 w-2/3 rounded bg-slate-100" />
      <div className="h-48 rounded-xl bg-slate-50" />
    </div>
  );
}
