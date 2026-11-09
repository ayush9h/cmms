"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../auth";
import { PHASES, fmt, postJson, useJson } from "../../lib";
import { Select } from "../../select";
import { Field, FormFoot, FormSection, PageHead, TONE, banner, btn, btnQuiet, cx, formCard, pageMain, skeleton } from "../../ui";

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

export function BreakdownForm() {
  const router = useRouter();
  const { user } = useAuth();
  const options = useJson("/api/options");
  const [form, setForm] = useState(() => ({ date: today(), start: nowTime(), asset_id: "", category: "", problem: "", diagnose: "", spares: "", wrench: "", description: "", action: "" }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const bind = (key) => ({ name: key, value: form[key], onChange: (e) => set(key)(e.target.value) });

  const minutes = { diagnose: toInt(form.diagnose), spares: toInt(form.spares), wrench: toInt(form.wrench) };
  const total = minutes.diagnose + minutes.spares + minutes.wrench;
  const stop = total ? addMinutes(form.start, total) : null;
  const asset = options.data?.asset.find((a) => a.id === form.asset_id);

  async function submit(e) {
    e.preventDefault();
    if (!form.asset_id) return setError("Choose the asset that broke down.");
    if (!form.category) return setError("Choose a breakdown category.");
    if (total < 1) return setError("Enter at least one minute of diagnosis, spares or wrench time.");
    if (total >= 1440) return setError("Total time must be under 24 hours. Log longer stoppages as separate entries.");
    if (form.description.trim().length < 5) return setError("Describe the problem in a few words (at least 5 characters).");
    if (form.action.trim().length < 3) return setError("Describe the action taken to fix it.");
    setSaving(true);
    setError(null);
    try {
      const res = await postJson("/api/breakdowns", { ...form, ...minutes, description: form.description.trim(), action: form.action.trim() });
      router.push(`/breakdowns?logged=${encodeURIComponent(`${res.asset_id}|${res.date}|${res.start}`)}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead title="Log breakdown" sub="Record a stoppage as soon as the machine is back in service." icon={Wrench} tone="bd">
        <Link href="/breakdowns" className={btnQuiet}>Breakdown log</Link>
      </PageHead>
      <main className={pageMain}>
        {options.error ? (
          <p className={banner} role="alert">Can’t reach the CMMS server: {options.error.message}.</p>
        ) : !options.data ? (
          <div className={cx(formCard, "p-5")} role="status" aria-label="Loading form"><div className={skeleton} /></div>
        ) : (
          <form className={cx(formCard, TONE.bd.bar)} onSubmit={submit}>
            <FormSection id="sec-when" title="When & where" sub="The machine that stopped and when the stoppage began." cols={3}>
              <Field as="div" label="Asset" hint={asset?.area}>
                <Select
                  label="Asset"
                  hideLabel
                  required
                  value={form.asset_id}
                  placeholder="Choose an asset"
                  options={options.data.asset.map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` }))}
                  onChange={set("asset_id")}
                  field
                />
              </Field>
              <Field label="Date">
                <input {...bind("date")} type="date" required max={today()} />
              </Field>
              <Field label="Start time">
                <input {...bind("start")} type="time" required />
              </Field>
            </FormSection>

            <FormSection id="sec-what" title="What happened" sub="Classify the fault, describe it, and record how it was fixed." cols={2}>
              <Field as="div" label="Category">
                <Select label="Category" hideLabel required field value={form.category} placeholder="Choose a category"
                  options={options.data.category.map((c) => ({ value: c, label: c }))} onChange={set("category")} />
              </Field>
              <Field label="Problem">
                <input {...bind("problem")} required minLength={2} maxLength={120} list="problems" placeholder="e.g. Bearing failure" />
                <datalist id="problems">{options.data.problem.map((p) => <option key={p} value={p} />)}</datalist>
              </Field>
              <Field label="Problem description" hint="What was observed: symptoms, readings, alarms or error codes.">
                <textarea {...bind("description")} rows={3} className="min-h-24" required minLength={5} maxLength={500} placeholder="e.g. Spindle vibrating above 6 mm/s at full speed, noise from front bearing" />
              </Field>
              <Field label="Action taken" hint="What was done to restore the machine: parts replaced, adjustments, follow-up needed.">
                <textarea {...bind("action")} rows={3} className="min-h-24" required minLength={3} maxLength={500} placeholder="e.g. Replaced front spindle bearing, rebalanced and test-ran for 30 min" />
              </Field>
            </FormSection>

            <FormSection id="sec-time" title="Time taken" sub="Minutes spent in each phase. Downtime and stop time are worked out for you." cols={4}>
              {PHASES.map((p) => (
                <Field key={p.key} label={`${p.short} (min)`}>
                  <input {...bind(p.key)} type="number" inputMode="numeric" min={0} max={1440} step={1} placeholder="0" />
                </Field>
              ))}
              <Field as="div" label="Total downtime">
                <output className="flex items-baseline justify-between gap-2 h-10 px-3 py-1 leading-[30px] whitespace-nowrap rounded-md border border-dashed border-line-strong bg-panel-2" aria-live="polite">
                  <b className="text-[15px] font-[650] tabular-nums">{total ? fmt.mins(total) : "—"}</b>
                  <small className="text-xs text-muted">{stop ? `Ends ${stop.clock}${stop.nextDay ? " +1d" : ""}` : "Ends —"}</small>
                </output>
              </Field>
            </FormSection>

            <FormFoot error={error} note={`Logged as ${user.id} · ${user.name}`}>
              <Link href="/breakdowns" className={btnQuiet}>Cancel</Link>
              <button type="submit" className={btn} disabled={saving}>{saving ? "Saving…" : "Log breakdown"}</button>
            </FormFoot>
          </form>
        )}
      </main>
    </>
  );
}
