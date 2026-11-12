"use client";

import { Factory } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/provider";
import { postJson, putJson } from "@/lib/api";
import { useJson } from "@/lib/hooks";
import {
  Field,
  FormFoot,
  FormSection,
  PageHead,
  Select,
  ShiftPicker,
} from "@/components/ui";
import { shiftOf } from "@/lib/constants";

const today = () => new Date().toLocaleDateString("en-CA");
const toInt = (v) => (v === "" ? 0 : Math.max(0, Math.floor(Number(v)) || 0));
const DISPOSITION = {
  Scrap: "Part is discarded and counted as lost.",
  Rework: "Part goes back for correction and re-inspection.",
};

export function RejectionForm({ edit }: any) {
  const router = useRouter();
  const { user } = useAuth();
  const options = useJson("/api/options");
  const entry = useJson(edit ? `/api/rejections/${edit}` : null);
  const [form, setForm] = useState(() => ({
    date: today(),
    shift: shiftOf(new Date().toTimeString()),
    asset_id: "",
    part: "",
    produced: "",
    defect: "",
    disposition: "Scrap",
  }));
  const [qty, setQty] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<any>(null);
  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const bind = (key) => ({
    name: key,
    value: form[key],
    onChange: (e) => set(key)(e.target.value),
  });

  useEffect(() => {
    const d = entry.data;
    if (!d) return;
    setForm({
      date: d.date,
      shift: d.shift,
      asset_id: d.id,
      part: d.part,
      produced: String(d.produced),
      defect: d.defect,
      disposition: d.disposition || "Scrap",
    });
    setQty(
      Object.fromEntries(
        Object.entries(d)
          .filter(([k, v]) => k.startsWith("rej_") && v)
          .map(([k, v]) => [k, String(v)]),
      ),
    );
  }, [entry.data]);

  const causes = options.data?.cause ?? [];
  const asset = options.data?.asset.find((a) => a.id === form.asset_id);
  const produced = toInt(form.produced);
  const rejected = causes.reduce((sum, c) => sum + toInt(qty[c.key] ?? ""), 0);
  const over = produced > 0 && rejected > produced;
  const rate = produced && !over ? (rejected / produced) * 100 : null;

  async function submit(e) {
    e.preventDefault();
    if (!form.asset_id)
      return setError("Choose the machine the parts came from.");
    if (form.part.trim().length < 2)
      return setError("Enter the part name or number.");
    if (produced < 1) return setError("Enter the quantity produced.");
    if (over)
      return setError(
        "Total rejected can't be more than the quantity produced.",
      );
    if (rejected && !form.defect)
      return setError("Choose the main defect for the rejected parts.");
    setSaving(true);
    setError(null);
    try {
      const res = await (edit ? putJson : postJson)(
        edit ? `/api/rejections/${edit}` : "/api/rejections",
        {
          date: form.date,
          shift: form.shift,
          asset_id: form.asset_id,
          part: form.part.trim(),
          produced,
          ...Object.fromEntries(
            causes.map((c) => [c.key, toInt(qty[c.key] ?? "")]),
          ),
          defect: rejected ? form.defect : null,
          disposition: rejected ? form.disposition : null,
        },
      );
      router.push(
        `/rejections?logged=${encodeURIComponent(`${res.asset_id}|${res.date}|${res.part}`)}`,
      );
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        title={
          edit ? "Edit Production & Rejection" : "Log Production & Rejection"
        }
        sub={
          edit
            ? "Correct the quantities of a logged entry."
            : "Record parts produced and rejected by machine, shift and cause."
        }
        icon={Factory}
        tone="pr"
      >
        <Link
          href="/rejections"
          className={
            "inline-flex items-center min-h-10 px-4 rounded-lg border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap shadow-card hover:border-steel hover:bg-hover"
          }
        >
          Production log
        </Link>
      </PageHead>
      <main
        className={"px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity"}
      >
        {entry.error ? (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-md border border-danger-line bg-danger-bg text-danger-ink"
            }
            role="alert"
          >
            Can’t open this entry: {entry.error.message}{" "}
            <Link href="/rejections" className="font-semibold underline">
              Back to the log
            </Link>
          </p>
        ) : options.error ? (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-md border border-danger-line bg-danger-bg text-danger-ink"
            }
            role="alert"
          >
            Can’t reach the CMMS server: {options.error.message}.
          </p>
        ) : !options.data || (edit && !entry.data) ? (
          <div
            className={
              "rounded-2xl border border-line bg-panel shadow-card p-5"
            }
            role="status"
            aria-label="Loading form"
          >
            <div
              className={
                "h-[220px] rounded-md bg-[linear-gradient(90deg,var(--ground),var(--panel-2),var(--ground))] bg-[length:200%_100%] animate-shimmer"
              }
            />
          </div>
        ) : (
          <form
            className={
              "rounded-2xl border border-line bg-panel shadow-card border-t-[3px] border-t-pr"
            }
            onSubmit={submit}
          >
            <FormSection
              id="sec-when"
              title="When & where"
              sub="The machine that produced the parts and the shift they were made in."
              cols={3}
            >
              <Field as="div" label="Machine" hint={asset?.area}>
                <Select
                  label="Machine"
                  hideLabel
                  required
                  field
                  value={form.asset_id}
                  placeholder="Choose a machine"
                  options={options.data.asset.map((a) => ({
                    value: a.id,
                    label: `${a.id} · ${a.name}`,
                  }))}
                  onChange={set("asset_id")}
                />
              </Field>
              <Field label="Date">
                <input {...bind("date")} type="date" required max={today()} />
              </Field>
              <Field as="div" label="Shift">
                <ShiftPicker value={form.shift} onChange={set("shift")} />
              </Field>
            </FormSection>

            <FormSection
              id="sec-prod"
              title="Production"
              sub="The part made and how many were produced in this shift."
              cols={2}
            >
              <Field
                label="Part"
                hint="Part name or number as on the job card."
              >
                <input
                  {...bind("part")}
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="e.g. Gearbox housing GH-204"
                />
              </Field>
              <Field label="Produced">
                <input
                  {...bind("produced")}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000000}
                  step={1}
                  required
                  placeholder="0"
                />
              </Field>
            </FormSection>

            <FormSection
              id="sec-rej"
              title="Rejection by cause"
              sub="Rejected parts against the department responsible. Leave at 0 if none."
              cols={3}
            >
              {causes.map((c) => (
                <Field key={c.key} label={c.label}>
                  <input
                    name={c.key}
                    value={qty[c.key] ?? ""}
                    onChange={(e) =>
                      setQty((q) => ({ ...q, [c.key]: e.target.value }))
                    }
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1000000}
                    step={1}
                    placeholder="0"
                  />
                </Field>
              ))}
              <div className="sm:col-span-3">
                <Field
                  as="div"
                  label="Total rejected"
                  hint={over ? "More than the quantity produced." : undefined}
                >
                  <output
                    className={`flex items-baseline justify-between gap-2 h-10 px-3 py-1 leading-[30px] whitespace-nowrap rounded-md border border-dashed bg-panel-2 ${over ? "border-crit" : "border-line-strong"}`}
                    aria-live="polite"
                  >
                    <b className="text-[15px] font-[650] tabular-nums">
                      {rejected}
                    </b>
                    <small className="text-xs text-muted">
                      {rate == null
                        ? "of produced"
                        : `${rate.toFixed(1)}% of ${produced} produced`}
                    </small>
                  </output>
                </Field>
              </div>
            </FormSection>

            {rejected > 0 && (
              <FormSection
                id="sec-defect"
                title="Defect"
                sub="The main defect found and what happens to the rejected parts."
                cols={2}
              >
                <Field as="div" label="Main defect">
                  <Select
                    label="Main defect"
                    hideLabel
                    required
                    field
                    value={form.defect}
                    placeholder="Choose a defect"
                    options={options.data.defect.map((d) => ({
                      value: d,
                      label: d,
                    }))}
                    onChange={set("defect")}
                  />
                </Field>
                <div />
                <div className="sm:col-span-2">
                  <Field as="div" label="Disposition">
                    <div
                      className="grid gap-2 sm:grid-cols-2"
                      role="radiogroup"
                      aria-label="Disposition"
                    >
                      {options.data.disposition.map((d) => {
                        const on = form.disposition === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => set("disposition")(d)}
                            className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                              on
                                ? "border-accent bg-brand-soft shadow-[inset_0_0_0_1px_var(--accent)]"
                                : "border-line-strong hover:border-field-hover"
                            }`}
                          >
                            <span
                              className={`grid place-items-center size-4 mt-0.5 shrink-0 rounded-full border-2 ${on ? "border-accent" : "border-line-strong"}`}
                            >
                              {on && (
                                <span className="size-1.5 rounded-full bg-accent" />
                              )}
                            </span>
                            <span className="grid gap-0.5">
                              <span className="text-sm font-semibold">{d}</span>
                              <span className="text-xs text-muted">
                                {DISPOSITION[d]}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              </FormSection>
            )}

            <FormFoot
              error={error}
              note={
                edit
                  ? `Logged by ${entry.data.entered_by || "import"}`
                  : `Logged as ${user.id} · ${user.name}`
              }
            >
              <Link
                href="/rejections"
                className={
                  "inline-flex items-center min-h-10 px-4 rounded-lg border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap shadow-card hover:border-steel hover:bg-hover"
                }
              >
                Cancel
              </Link>
              <button
                type="submit"
                className={
                  "inline-flex items-center justify-center gap-2 rounded-md bg-btn text-on-btn font-semibold whitespace-nowrap hover:bg-btn-hover disabled:opacity-60 disabled:cursor-progress disabled:hover:bg-btn min-h-10 px-4"
                }
                disabled={saving}
              >
                {saving ? "Saving…" : edit ? "Save changes" : "Save entry"}
              </button>
            </FormFoot>
          </form>
        )}
      </main>
    </>
  );
}
