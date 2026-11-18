"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { Field, Input, Select } from "@/components/ui/Field";
import { LogoUpload } from "@/components/ui/LogoUpload";
import { StepLayout } from "@/components/wizard/StepLayout";
import {
  COMPANY_SIZES,
  COUNTRIES,
  CURRENCIES,
  INDUSTRIES,
  MONTHS,
  TIME_ZONES,
  companySchema,
  type CompanyDetails,
} from "@/lib/schemas";
import { useWizard } from "@/lib/store";

const EMPTY = {
  name: "",
  industry: "",
  size: "",
  address: "",
  city: "",
  country: "",
  timeZone: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  fiscalYearStart: "January",
  currency: "USD",
  logo: null,
} as unknown as CompanyDetails;

export function CompanyStep() {
  const saved = useWizard((s) => s.company);
  const saveCompany = useWizard((s) => s.saveCompany);
  const advance = useWizard((s) => s.advance);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyDetails>({
    resolver: zodResolver(companySchema),
    defaultValues: saved ?? EMPTY,
    mode: "onTouched",
  });

  const onSubmit = handleSubmit((data) => {
    saveCompany(data);
    advance();
  });

  return (
    <StepLayout
      title="Tell us about your company"
      description="We'll use this to brand your workspace, set defaults for depreciation and reporting, and know who to contact about your implementation."
      onSubmit={onSubmit}
      nextLoading={isSubmitting}
    >
      <div className="space-y-7">
        <Controller
          control={control}
          name="logo"
          render={({ field }) => <LogoUpload value={field.value} onChange={field.onChange} />}
        />

        <Section title="Organization">
          <Field id="name" label="Company name" error={errors.name?.message} className="sm:col-span-2">
            {(a) => <Input {...a} {...register("name")} autoComplete="organization" placeholder="Acme Manufacturing Inc." />}
          </Field>
          <Field id="industry" label="Industry" error={errors.industry?.message}>
            {(a) => <Select {...a} {...register("industry")} options={INDUSTRIES} />}
          </Field>
          <Field id="size" label="Company size" error={errors.size?.message}>
            {(a) => <Select {...a} {...register("size")} options={COMPANY_SIZES.map((s) => s)} placeholder="Employees…" />}
          </Field>
        </Section>

        <Section title="Headquarters">
          <Field id="address" label="Street address" error={errors.address?.message} className="sm:col-span-2">
            {(a) => <Input {...a} {...register("address")} autoComplete="street-address" placeholder="100 Main Street" />}
          </Field>
          <Field id="city" label="City" error={errors.city?.message}>
            {(a) => <Input {...a} {...register("city")} autoComplete="address-level2" />}
          </Field>
          <Field id="country" label="Country" error={errors.country?.message}>
            {(a) => <Select {...a} {...register("country")} options={COUNTRIES} />}
          </Field>
          <Field id="timeZone" label="Time zone" error={errors.timeZone?.message} className="sm:col-span-2" hint="Scheduled syncs and reports run in this time zone.">
            {(a) => <Select {...a} {...register("timeZone")} options={TIME_ZONES} />}
          </Field>
        </Section>

        <Section title="Primary admin">
          <Field id="adminName" label="Full name" error={errors.adminName?.message} className="sm:col-span-2">
            {(a) => <Input {...a} {...register("adminName")} autoComplete="name" />}
          </Field>
          <Field id="adminEmail" label="Work email" error={errors.adminEmail?.message}>
            {(a) => <Input {...a} {...register("adminEmail")} type="email" autoComplete="email" placeholder="you@company.com" />}
          </Field>
          <Field id="adminPhone" label="Phone" optional error={errors.adminPhone?.message}>
            {(a) => <Input {...a} {...register("adminPhone")} type="tel" autoComplete="tel" placeholder="+1 555 123 4567" />}
          </Field>
        </Section>

        <Section title="Finance defaults">
          <Field id="fiscalYearStart" label="Fiscal year starts" error={errors.fiscalYearStart?.message}>
            {(a) => <Select {...a} {...register("fiscalYearStart")} options={MONTHS} />}
          </Field>
          <Field id="currency" label="Reporting currency" error={errors.currency?.message}>
            {(a) => <Select {...a} {...register("currency")} options={CURRENCIES} />}
          </Field>
        </Section>
      </div>
    </StepLayout>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
