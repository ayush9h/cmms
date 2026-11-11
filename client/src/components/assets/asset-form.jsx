"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/auth/provider";
import { fmt } from "@/lib/format";
import { postJson } from "@/lib/api";
import { useJson } from "@/lib/hooks";
import {
  ErrorState,
  Field,
  FormFoot,
  FormSection,
  PageHead,
  Select,
  banner,
  btn,
  btnQuiet,
  cx,
  formCard,
  mono,
  pageMain,
  skeleton,
} from "@/components/ui";

const today = () => new Date().toLocaleDateString("en-CA");
const EMPTY = {
  name: "",
  area: "",
  cls: "",
  application: "",
  oem: "",
  installed: "",
  run_rate: "",
};

export function NewAssetForm() {
  const { isManager } = useAuth();
  return isManager ? <AssetForm /> : <NotPermitted />;
}

function NotPermitted() {
  return (
    <>
      <PageHead
        title="New asset"
        sub="Asset registration is limited to managers."
      />
      <main className={pageMain}>
        <ErrorState title="Only managers can register assets">
          <p>
            Ask a maintenance manager to add the equipment. You can still log
            breakdowns against any registered asset.
          </p>
          <Link href="/breakdowns/new" className={btn}>
            Log breakdown
          </Link>
        </ErrorState>
      </main>
    </>
  );
}

function AssetForm() {
  const router = useRouter();
  const options = useJson("/api/options");
  const assets = useJson("/api/assets?page_size=1");
  const [form, setForm] = useState(EMPTY);
  const [id, setId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const assetId = id ?? assets.data?.next_id ?? "";
  const bind = (key) => ({
    name: key,
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  async function submit(e) {
    e.preventDefault();
    if (!form.area) return setError("Choose the shop.");
    if (!form.cls) return setError("Choose a category class.");
    setSaving(true);
    setError(null);
    try {
      const res = await postJson("/api/assets", {
        id: assetId,
        ...form,
        run_rate: Number(form.run_rate),
      });
      router.push(`/assets?created=${encodeURIComponent(res.id)}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  const ready = options.data && assets.data;
  const age = form.installed
    ? Math.max(0, (Date.now() - new Date(form.installed)) / 3.15576e10)
    : null;

  return (
    <>
      <PageHead
        title="New asset"
        sub="Register equipment in the asset master. It appears on the dashboard straight away."
      />
      <main className={pageMain}>
        {options.error || assets.error ? (
          <p className={banner} role="alert">
            Can’t reach the CMMS server:{" "}
            {(options.error ?? assets.error).message}.
          </p>
        ) : !ready ? (
          <div
            className={cx(formCard, "p-5")}
            role="status"
            aria-label="Loading form"
          >
            <div className={skeleton} />
          </div>
        ) : (
          <form className={formCard} onSubmit={submit}>
            <FormSection
              id="sec-id"
              title="Identity"
              sub="How the asset is referenced across the plant."
              cols={3}
            >
              <Field
                label="Asset ID"
                hint="Next free ID is filled in. Format AST-000."
              >
                <input
                  name="id"
                  required
                  pattern="AST-\d{3,}"
                  value={assetId}
                  onChange={(e) => setId(e.target.value.toUpperCase())}
                  className={mono}
                />
              </Field>
              <Field label="Asset name">
                <input
                  {...bind("name")}
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder="e.g. Laser Cutter 01"
                  autoFocus
                />
              </Field>
              <Field
                label="Ideal run rate (PPM)"
                hint="Pieces per minute. Fills the PPC entry for OEE."
              >
                <input
                  {...bind("run_rate")}
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min={0.001}
                  max={100000}
                  required
                  placeholder="e.g. 60"
                />
              </Field>
            </FormSection>

            <FormSection
              id="sec-loc"
              title="Location & use"
              sub="The shop it runs in and what it does."
              cols={3}
            >
              <Field as="div" label="Shop">
                <Select
                  label="Shop"
                  hideLabel
                  required
                  field
                  value={form.area}
                  placeholder="Choose a shop"
                  options={options.data.area.map((a) => ({
                    value: a,
                    label: a,
                  }))}
                  onChange={(v) => setForm((f) => ({ ...f, area: v }))}
                />
              </Field>
              <Field as="div" label="Category class">
                <Select
                  label="Category class"
                  hideLabel
                  required
                  field
                  value={form.cls}
                  placeholder="Choose a class"
                  options={options.data.cls.map((c) => ({
                    value: c,
                    label: c,
                  }))}
                  onChange={(v) => setForm((f) => ({ ...f, cls: v }))}
                />
              </Field>
              <Field label="Application">
                <input
                  {...bind("application")}
                  required
                  minLength={2}
                  maxLength={60}
                  list="applications"
                  placeholder="e.g. Machining"
                />
                <datalist id="applications">
                  {options.data.application.map((a) => (
                    <option key={a} value={a} />
                  ))}
                </datalist>
              </Field>
            </FormSection>

            <FormSection
              id="sec-eq"
              title="Equipment"
              sub="Manufacturer and commissioning date."
              cols={2}
            >
              <Field label="OEM">
                <input
                  {...bind("oem")}
                  required
                  maxLength={60}
                  placeholder="e.g. Trumpf"
                />
              </Field>
              <Field
                label="Installation date"
                hint={
                  age == null
                    ? "Age is worked out from this date."
                    : `${fmt.n(Math.round(age * 10) / 10)} years in service`
                }
              >
                <input
                  {...bind("installed")}
                  type="date"
                  required
                  max={today()}
                />
              </Field>
            </FormSection>

            <FormFoot error={error} note="All fields are required.">
              <Link href="/assets" className={btnQuiet}>
                Cancel
              </Link>
              <button type="submit" className={btn} disabled={saving}>
                {saving ? "Saving…" : "Create asset"}
              </button>
            </FormFoot>
          </form>
        )}
      </main>
    </>
  );
}
