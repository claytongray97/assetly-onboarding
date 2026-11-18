"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useWizard } from "@/lib/store";

interface StepLayoutProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  onSubmit: () => void | Promise<void>;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  /** Footer content shown to the left of Next (e.g. a hint). */
  footerNote?: ReactNode;
  hidePrevious?: boolean;
}

/**
 * Shared step frame: focusable heading (moved to on step change for screen
 * readers), body, and Previous / Next footer. The body is a <form>, so Enter
 * submits and native validation semantics apply.
 */
export function StepLayout({
  title,
  description,
  children,
  onSubmit,
  nextLabel = "Next",
  nextDisabled,
  nextLoading,
  footerNote,
  hidePrevious,
}: StepLayoutProps) {
  const back = useWizard((s) => s.back);
  const currentStep = useWizard((s) => s.currentStep);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Skip the initial page load so we don't steal focus from the browser.
    if (document.activeElement && document.activeElement !== document.body) {
      headingRef.current?.focus({ preventScroll: true });
      headingRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="animate-fade-in">
      <header className="mb-6 text-center">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-slate-900 outline-none sm:text-[1.75rem]"
        >
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-pretty text-slate-600">{description}</p>
      </header>

      <div>{children}</div>

      <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
        {!hidePrevious && currentStep > 0 ? (
          <Button variant="secondary" onClick={back}>
            <ArrowLeft className="size-4" aria-hidden />
            Previous
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex flex-1 flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
          {footerNote && <div className="text-center text-xs text-slate-500 sm:text-right">{footerNote}</div>}
          <Button type="submit" disabled={nextDisabled} loading={nextLoading}>
            {nextLabel}
            {!nextLoading && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        </div>
      </footer>
    </form>
  );
}
