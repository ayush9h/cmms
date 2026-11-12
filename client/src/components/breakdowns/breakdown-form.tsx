"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/provider";
import { PHASES, shiftOf } from "@/lib/constants";
import { fmt } from "@/lib/format";
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

const today = () => new Date().toLocaleDateString("en-CA");
const nowTime = () => new Date().toTimeString().slice(0, 5);
const toInt = (v) => (v === "" ? 0 : Math.max(0, Math.floor(Number(v)) || 0));

function addMinutes(start, minutes) {
  if (!/^\d{2}:\d{2}$/.test(start)) return null;
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const clock = `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  return { clock, nextDay: total >= 1440 };
}

export function BreakdownForm({ edit }: any) {
  const router = useRouter();
  const { user } = useAuth();
  const options = useJson("/api/options");
  const entry = useJson(edit ? `/api/breakdowns/${edit}` : null);
  const [form, setForm] = useState(() => ({
    date: today(),
    start: nowTime(),
    shift: shiftOf(nowTime()),
    asset_id: "",
    category: "",
    problem: "",
    diagnose: "",
    spares: "",
    wrench: "",
    description: "",
    action: "",
  }));
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
      start: d.start,
      shift: d.shift,
      asset_id: d.id,
      category: d.category,
      problem: d.problem,
      diagnose: String(d.diagnose),
      spares: String(d.spares),
      wrench: String(d.wrench),
      description: d.description,
      action: d.action,
    });
  }, [entry.data]);

  const minutes = {
    diagnose: toInt(form.diagnose),
    spares: toInt(form.spares),
    wrench: toInt(form.wrench),
  };
  const total = minutes.diagnose + minutes.spares + minutes.wrench;
  const stop = total ? addMinutes(form.start, total) : null;
  const asset = options.data?.asset.find((a) => a.id === form.asset_id);

  async function submit(e) {
    e.preventDefault();
    if (!form.asset_id) return setError("Choose the asset that broke down.");
    if (!form.category) return setError("Choose a breakdown category.");
    if (total < 1)
      return setError(
        "Enter at least one minute of diagnosis, spares or wrench time.",
      );
    if (total >= 1440)
      return setError(
        "Total time must be under 24 hours. Log longer stoppages as separate entries.",
      );
    if (form.description.trim().length < 5)
      return setError(
        "Describe the problem in a few words (at least 5 characters).",
      );
    if (form.action.trim().length < 3)
      return setError("Describe the action taken to fix it.");
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...form,
        ...minutes,
        description: form.description.trim(),
        action: form.action.trim(),
      };
      const res = await (edit
        ? putJson(`/api/breakdowns/${edit}`, body)
        : postJson("/api/breakdowns", body));
      router.push(
        `/breakdowns?logged=${encodeURIComponent(`${res.asset_id}|${res.date}|${res.start}`)}`,
      );
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        title={edit ? "Edit breakdown" : "Log breakdown"}
        sub={
          edit
            ? "Correct the details of a logged stoppage."
            : "Record a stoppage as soon as the machine is back in service."
        }
        icon={Wrench}
        tone="bd"
      >
        <Link
          href="/breakdowns"
          className={
            "inline-flex items-center min-h-10 px-4 rounded-lg border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap shadow-card hover:border-steel hover:bg-hover"
          }
        >
          Breakdown log
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
            <Link href="/breakdowns" className="font-semibold underline">
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
              "rounded-2xl border border-line bg-panel shadow-card border-t-[3px] border-t-bd"
            }
            onSubmit={submit}
          >
            <FormSection
              id="sec-when"
              title="When & where"
              sub="The machine that stopped, when the stoppage began and the shift it happened in."
              cols={4}
            >
              <Field as="div" label="Asset" hint={asset?.area}>
                <Select
                  label="Asset"
                  hideLabel
                  required
                  value={form.asset_id}
                  placeholder="Choose an asset"
                  options={options.data.asset.map((a) => ({
                    value: a.id,
                    label: `${a.id} · ${a.name}`,
                  }))}
                  onChange={set("asset_id")}
                  field
                />
              </Field>
              <Field label="Date">
                <input {...bind("date")} type="date" required max={today()} />
              </Field>
              <Field label="Start time">
                <input
                  name="start"
                  value={form.start}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      start: e.target.value,
                      shift: shiftOf(e.target.value),
                    }))
                  }
                  type="time"
                  required
                />
              </Field>
              <Field
                as="div"
                label="Shift"
                hint="Set from the start time; change it if needed."
              >
                <ShiftPicker value={form.shift} onChange={set("shift")} />
              </Field>
            </FormSection>

            <FormSection
              id="sec-what"
              title="What happened"
              sub="Classify the fault, describe it, and record how it was fixed."
              cols={2}
            >
              <Field as="div" label="Category">
                <Select
                  label="Category"
                  hideLabel
                  required
                  field
                  value={form.category}
                  placeholder="Choose a category"
                  options={options.data.category.map((c) => ({
                    value: c,
                    label: c,
                  }))}
                  onChange={set("category")}
                />
              </Field>
              <Field label="Problem">
                <input
                  {...bind("problem")}
                  required
                  minLength={2}
                  maxLength={120}
                  list="problems"
                  placeholder="e.g. Bearing failure"
                />
                <datalist id="problems">
                  {options.data.problem.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </Field>
              <Field
                label="Problem description"
                hint="What was observed: symptoms, readings, alarms or error codes."
              >
                <textarea
                  {...bind("description")}
                  rows={3}
                  className="min-h-24"
                  required
                  minLength={5}
                  maxLength={500}
                  placeholder="e.g. Spindle vibrating above 6 mm/s at full speed, noise from front bearing"
                />
              </Field>
              <Field
                label="Action taken"
                hint="What was done to restore the machine: parts replaced, adjustments, follow-up needed."
              >
                <textarea
                  {...bind("action")}
                  rows={3}
                  className="min-h-24"
                  required
                  minLength={3}
                  maxLength={500}
                  placeholder="e.g. Replaced front spindle bearing, rebalanced and test-ran for 30 min"
                />
              </Field>
            </FormSection>

            <FormSection
              id="sec-time"
              title="Time taken"
              sub="Minutes spent in each phase. Downtime and stop time are worked out for you."
              cols={4}
            >
              {PHASES.map((p) => (
                <Field key={p.key} label={`${p.short} (min)`}>
                  <input
                    {...bind(p.key)}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={1440}
                    step={1}
                    placeholder="0"
                  />
                </Field>
              ))}
              <Field as="div" label="Total downtime">
                <output
                  className="flex items-baseline justify-between gap-2 h-10 px-3 py-1 leading-[30px] whitespace-nowrap rounded-md border border-dashed border-line-strong bg-panel-2"
                  aria-live="polite"
                >
                  <b className="text-[15px] font-[650] tabular-nums">
                    {total ? fmt.mins(total) : "—"}
                  </b>
                  <small className="text-xs text-muted">
                    {stop
                      ? `Ends ${stop.clock}${stop.nextDay ? " +1d" : ""}`
                      : "Ends —"}
                  </small>
                </output>
              </Field>
            </FormSection>

            <FormFoot
              error={error}
              note={
                edit
                  ? `Logged by ${entry.data.entered_by || "import"}`
                  : `Logged as ${user.id} · ${user.name}`
              }
            >
              <Link
                href="/breakdowns"
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
                {saving ? "Saving…" : edit ? "Save changes" : "Log breakdown"}
              </button>
            </FormFoot>
          </form>
        )}
      </main>
    </>
  );
}
