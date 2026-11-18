"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { STEPS } from "@/lib/store";

interface StepTrackerProps {
  current: number;
  furthest: number;
  completed?: boolean;
  onSelect: (step: number) => void;
}

export function StepTracker({ current, furthest, completed, onSelect }: StepTrackerProps) {
  const pct = completed ? 100 : (current / (STEPS.length - 1)) * 100;
  return (
    <nav aria-label="Onboarding progress">
      {/* Compact tracker for small screens */}
      <div className="sm:hidden">
        <p className="text-xs font-medium text-slate-600">
          Step {current + 1} of {STEPS.length} · <span className="text-brand-700">{STEPS[current].label}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200" aria-hidden>
          <div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <ol className="hidden items-start sm:flex">
        {STEPS.map((step, i) => {
          const isCurrent = !completed && i === current;
          const isDone = !isCurrent && (completed || i < furthest);
          const reachable = !completed && i <= furthest && i !== current;
          const state = isCurrent ? "current" : isDone ? "complete" : "upcoming";
          return (
            <li key={step.id} className="relative flex flex-1 flex-col items-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={clsx(
                    "absolute top-3.5 right-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)] rounded-full transition-colors",
                    completed || i <= furthest ? "bg-brand-600" : "bg-slate-200",
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={!reachable}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.label}, step ${i + 1} of ${STEPS.length}, ${state}`}
                className={clsx(
                  "group relative z-10 flex flex-col items-center gap-1.5 rounded-md px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                  reachable ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={clsx(
                    "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                    isDone && "bg-brand-600 text-white group-hover:bg-brand-700",
                    isCurrent && "border-2 border-brand-600 bg-white text-brand-700 ring-4 ring-brand-100",
                    !isDone && !isCurrent && "border border-slate-300 bg-white text-slate-500",
                  )}
                >
                  {isDone ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span
                  className={clsx(
                    "text-xs",
                    isCurrent ? "font-semibold text-brand-700" : isDone ? "text-slate-700" : "text-slate-500",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
