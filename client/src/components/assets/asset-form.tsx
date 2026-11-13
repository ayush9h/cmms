"use client";

import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer } from "react";
import { useAuth } from "@/auth/provider";
import { fmt } from "@/lib/format";
import { postJson, putJson, query } from "@/lib/api";
import { useJson } from "@/lib/hooks";
import {
  ErrorState,
  Field,
  FormFoot,
  FormSection,
  PageHead,
  Select,
} from "@/components/ui";

const today = () => new Date().toLocaleDateString("en-CA");

const EMPTY = {
  id: "",
  name: "",
  area: "",
  cls: "",
  application: "",
  oem: "",
  installed: "",
  run_rate: "",
};

type State = {
  form: typeof EMPTY;
  touched: boolean; // once true, server defaults stop overwriting what was typed
  saving: boolean;
  error: any;
};

const initial: State = {
  form: EMPTY,
  touched: false,
  saving: false,
  error: null,
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case "set":
      return {
        ...state,
        touched: true,
        error: null,
        form: { ...state.form, [action.key]: action.value },
      };
    // server-supplied defaults (next free id, or the asset being edited)
    case "load":
      return state.touched
        ? state
        : { ...state, form: { ...state.form, ...action.values } };
    case "saving":
      return { ...state, saving: true, error: null };
    case "failed":
      return { ...state, saving: false, error: action.error };
    default:
      return state;
  }
}

export function NewAssetForm() {
  const { isManager } = useAuth();
  return isManager ? <AssetForm /> : <NotPermitted />;
}

export function EditAssetForm({ assetId }: any) {
  const { isManager } = useAuth();
  return isManager ? <AssetForm assetId={assetId} /> : <NotPermitted edit />;
}

function NotPermitted({ edit }: any) {
  return (
    <>
      <PageHead
        title={edit ? "Edit asset" : "New asset"}
        sub="Changing the asset master is limited to managers."
      />
      <main
        className={"px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity"}
      >
        <ErrorState
          title={`Only managers can ${edit ? "edit" : "register"} assets`}
        >
          <p>
            Ask a maintenance manager to make the change. You can still log
            breakdowns against any registered asset.
          </p>
          <Link href="/breakdowns/new" className={buttonVariants()}>
            Log breakdown
          </Link>
        </ErrorState>
      </main>
    </>
  );
}

function AssetForm({ assetId }: any) {
  const editing = Boolean(assetId);
  const router = useRouter();
  const options = useJson("/api/options");
  // creating: ask for next_id only. editing: search the register for the row.
  // shortcut: no GET /assets/{id} endpoint, so the row is found via search;
  // add one if an ID search ever returns more than a page of matches.
  const assets = useJson(
    editing
      ? `/api/assets?${query({ q: assetId, page_size: 100 })}`
      : "/api/assets?page_size=1",
  );
  const [state, dispatch] = useReducer(reducer, initial);
  const { form, saving, error } = state;

  const existing = editing
    ? assets.data?.items?.find((a: any) => a.id === assetId)
    : null;
  const missing = editing && assets.data && !existing;
  const nextId = editing ? null : assets.data?.next_id;

  // both deps are stable between renders, so each prefill runs once
  useEffect(() => {
    if (nextId) dispatch({ type: "load", values: { id: nextId } });
  }, [nextId]);

  useEffect(() => {
    if (!existing) return;
    dispatch({
      type: "load",
      values: {
        id: existing.id,
        name: existing.name,
        area: existing.area,
        cls: existing.cls,
        application: existing.application,
        oem: existing.oem,
        installed: existing.installed,
        run_rate: existing.run_rate == null ? "" : String(existing.run_rate),
      },
    });
  }, [existing]);

  const set = (key: string, value: any) =>
    dispatch({ type: "set", key, value });
  const bind = (key: string) => ({
    name: key,
    value: (form as any)[key],
    onChange: (e: any) => set(key, e.target.value),
  });

  async function submit(e: any) {
    e.preventDefault();
    if (!form.area)
      return dispatch({ type: "failed", error: "Choose the shop." });
    if (!form.cls)
      return dispatch({ type: "failed", error: "Choose a category class." });
    dispatch({ type: "saving" });
    try {
      const body = { ...form, run_rate: Number(form.run_rate) };
      const res = editing
        ? await putJson(`/api/assets/${encodeURIComponent(assetId)}`, body)
        : await postJson("/api/assets", body);
      router.push(
        `/assets?${editing ? "updated" : "created"}=${encodeURIComponent(res.id)}`,
      );
    } catch (err: any) {
      dispatch({ type: "failed", error: err.message });
    }
  }

  const ready = options.data && assets.data && (!editing || existing);
  const age = form.installed
    ? Math.max(
        0,
        (Date.now() - new Date(form.installed).getTime()) / 3.15576e10,
      )
    : null;

  return (
    <>
      <PageHead
        title={editing ? `Edit ${assetId}` : "New asset"}
        sub={
          editing
            ? "Change any detail. Renaming the ID moves its breakdowns, rejections and PPC entries with it."
            : "Register equipment in the asset master. It appears on the dashboard straight away."
        }
      />
      <main
        className={"px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity"}
      >
        {options.error || assets.error ? (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-sm border border-danger-line bg-danger-bg text-danger-ink"
            }
            role="alert"
          >
            Can’t reach the OPMAX server:{" "}
            {(options.error ?? assets.error).message}.
          </p>
        ) : missing ? (
          <ErrorState title={`${assetId} is not in the asset register`}>
            <p>It may have been renamed or removed.</p>
            <Link href="/assets" className={buttonVariants()}>
              Back to register
            </Link>
          </ErrorState>
        ) : !ready ? (
          <div
            className={"rounded-sm border border-line bg-panel shadow-card p-5"}
            role="status"
            aria-label="Loading form"
          >
            <div
              className={
                "h-[220px] rounded-sm bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
              }
            />
          </div>
        ) : (
          <form
            className={"rounded-sm border border-line bg-panel shadow-card"}
            onSubmit={submit}
          >
            <FormSection
              id="sec-id"
              title="Identity"
              sub="How the asset is referenced across the plant."
              cols={3}
            >
              <Field
                label="Asset ID"
                hint={
                  editing
                    ? "Changing this renames the asset everywhere it is referenced."
                    : "Any format, up to 20 characters. A suggestion is filled in."
                }
              >
                <input
                  name="id"
                  required
                  maxLength={20}
                  value={form.id}
                  onChange={(e) => set("id", e.target.value)}
                  className={"font-mono text-[0.86em]"}
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
                  options={options.data.area.map((a: any) => ({
                    value: a,
                    label: a,
                  }))}
                  onChange={(v: any) => set("area", v)}
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
                  options={options.data.cls.map((c: any) => ({
                    value: c,
                    label: c,
                  }))}
                  onChange={(v: any) => set("cls", v)}
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
                  {options.data.application.map((a: any) => (
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
              <Link
                href="/assets"
                className={buttonVariants({ variant: "secondary" })}
              >
                Cancel
              </Link>
              <button
                type="submit"
                className={buttonVariants()}
                disabled={saving}
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Create asset"}
              </button>
            </FormFoot>
          </form>
        )}
      </main>
    </>
  );
}
