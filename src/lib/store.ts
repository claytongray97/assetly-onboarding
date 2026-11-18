"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { pruneSystems, type DataTypeId } from "./catalog";
import type { CompanyDetails } from "./schemas";
import type { ImportResult } from "./integrations";

export const STEPS = [
  { id: "company", label: "Company" },
  { id: "data", label: "Data" },
  { id: "systems", label: "Systems" },
  { id: "connect", label: "Connect" },
  { id: "review", label: "Review" },
] as const;

export const LAST_STEP = STEPS.length - 1;

export type ConnectionState =
  | { status: "connected"; account: string; connectedAt: string }
  | { status: "failed"; error: string }
  | { status: "skipped" };

export type { ImportResult };

export interface WizardData {
  currentStep: number;
  /** Highest step index the user has been allowed to reach. */
  furthestStep: number;
  company: CompanyDetails | null;
  dataTypes: DataTypeId[];
  systems: string[];
  /** Connection status only — secrets are never stored. */
  connections: Record<string, ConnectionState>;
  /** Per-system import counts + sample rows. */
  imports: Record<string, ImportResult>;
  completed: boolean;
}

interface WizardActions {
  goTo: (step: number) => void;
  advance: () => void;
  back: () => void;
  saveCompany: (company: CompanyDetails) => void;
  saveDataTypes: (dataTypes: DataTypeId[]) => void;
  saveSystems: (systems: string[]) => void;
  setConnection: (systemId: string, state: ConnectionState | null) => void;
  setImport: (systemId: string, result: ImportResult) => void;
  complete: () => void;
  reopen: () => void;
  reset: () => void;
}

export type WizardState = WizardData & WizardActions;

export const initialData: WizardData = {
  currentStep: 0,
  furthestStep: 0,
  company: null,
  dataTypes: [],
  systems: [],
  connections: {},
  imports: {},
  completed: false,
};

const clampStep = (n: number) => Math.min(Math.max(n, 0), LAST_STEP);

function pick<T>(record: Record<string, T>, keys: string[]): Record<string, T> {
  return Object.fromEntries(keys.filter((k) => k in record).map((k) => [k, record[k]]));
}

export const useWizard = create<WizardState>()(
  persist(
    (set) => ({
      ...initialData,

      goTo: (step) =>
        set((s) => (step <= s.furthestStep ? { currentStep: clampStep(step) } : s)),

      advance: () =>
        set((s) => {
          const next = clampStep(s.currentStep + 1);
          return { currentStep: next, furthestStep: Math.max(s.furthestStep, next) };
        }),

      back: () => set((s) => ({ currentStep: clampStep(s.currentStep - 1) })),

      // Sample records are personalized from company details, so re-import if they change.
      saveCompany: (company) =>
        set((s) => {
          const prev = s.company;
          const changed =
            !prev || prev.adminEmail !== company.adminEmail || prev.city !== company.city ||
            prev.currency !== company.currency || prev.size !== company.size;
          return changed ? { company, imports: {} } : { company };
        }),

      // Changing data types prunes systems that no longer apply, along with their
      // connection/import state. Import counts are cleared since scope changed.
      saveDataTypes: (dataTypes) =>
        set((s) => {
          const systems = pruneSystems(s.systems, dataTypes);
          return { dataTypes, systems, connections: pick(s.connections, systems), imports: {} };
        }),

      saveSystems: (systems) =>
        set((s) => ({ systems, connections: pick(s.connections, systems), imports: pick(s.imports, systems) })),

      setConnection: (systemId, state) =>
        set((s) => {
          const connections = { ...s.connections };
          const imports = { ...s.imports };
          if (state) connections[systemId] = state;
          else delete connections[systemId];
          if (state?.status !== "connected") delete imports[systemId];
          return { connections, imports };
        }),

      setImport: (systemId, result) => set((s) => ({ imports: { ...s.imports, [systemId]: result } })),

      complete: () => set({ completed: true }),

      reopen: () => set({ completed: false, currentStep: LAST_STEP }),

      reset: () => set({ ...initialData }),
    }),
    {
      name: "assetly-onboarding",
      version: 2,
      // v1 stored bare counts per system; drop them so imports re-run with samples.
      migrate: (persisted, version) => {
        const data = persisted as WizardData;
        return version < 2 ? { ...data, imports: {} } : data;
      },
      storage: createJSONStorage(() => localStorage),
      // Persist data only (not actions or the hydration flag).
      partialize: (s): WizardData => ({
        currentStep: s.currentStep,
        furthestStep: s.furthestStep,
        company: s.company,
        dataTypes: s.dataTypes,
        systems: s.systems,
        connections: s.connections,
        imports: s.imports,
        completed: s.completed,
      }),
    },
  ),
);

/**
 * True once persisted state has been loaded from localStorage. Server render and
 * the first client render return false, avoiding hydration mismatches.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useWizard.persist.onFinishHydration(cb),
    () => useWizard.persist.hasHydrated(),
    () => false,
  );
}
