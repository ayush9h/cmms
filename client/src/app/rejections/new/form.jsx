"use client";

import { Factory } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../auth";
import { postJson, useJson } from "../../lib";
import { Select } from "../../select";
import { Field, FormFoot, FormSection, PageHead, TONE, banner, btn, btnQuiet, cx, formCard, pageMain, skeleton } from "../../ui";

const today = () => new Date().toLocaleDateString("en-CA");
const shiftNow = () => ["A", "B", "C"][Math.floor(((new Date().getHours() + 18) % 24) / 8)];
const DISPOSITION = {
  Scrap: "Part is discarded and counted as lost.",
  Rework: "Part goes back for correction and re-inspection.",
};

export function RejectionForm() {
  const router = useRouter();
  const { user } = useAuth();
  const options = useJson("/api/options");
  const [form, setForm] = useState(() => ({ date: today(), shift: shiftNow(), asset_id: "", part: "", defect: "", disposition: "Scrap" }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const bind = (key) => ({ name: key, value: form[key], onChange: (e) => set(key)(e.target.value) });

  const asset = options.data?.asset.find((a) => a.id === form.asset_id);

  async function submit(e) {
    e.preventDefault();
    if (!form.asset_id) return setError("Choose the machine the parts came from.");
    if (!form.defect) return setError("Choose the defect type.");
    if (form.part.trim().length < 2) return setError("Enter the part name or number.");
    setSaving(true);
    setError(null);
    try {
      const res = await postJson("/api/rejections", { ...form, part: form.part.trim() });
      router.push(`/rejections?logged=${encodeURIComponent(`${res.asset_id}|${res.date}|${res.part}`)}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead title="Log Production & Rejection" sub="Record rejected parts by machine, shift and defect." icon={Factory} tone="pr">
        <Link href="/rejections" className={btnQuiet}>Production log</Link>
      </PageHead>
      <main className={pageMain}>
        {options.error ? (
          <p className={banner} role="alert">Can’t reach the CMMS server: {options.error.message}.</p>
        ) : !options.data ? (
          <div className={cx(formCard, "p-5")} role="status" aria-label="Loading form"><div className={skeleton} /></div>
        ) : (
          <form className={cx(formCard, TONE.pr.bar)} onSubmit={submit}>
            <FormSection id="sec-when" title="When & where" sub="The machine that produced the parts and the shift they were inspected in." cols={3}>
              <Field as="div" label="Machine" hint={asset?.area}>
                <Select
                  label="Machine"
                  hideLabel
                  required
                  field
                  value={form.asset_id}
                  placeholder="Choose a machine"
                  options={options.data.asset.map((a) => ({ value: a.id, label: `${a.id} · ${a.name}` }))}
                  onChange={set("asset_id")}
                />
              </Field>
              <Field label="Date">
                <input {...bind("date")} type="date" required max={today()} />
              </Field>
              <Field as="div" label="Shift">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg border border-line-strong bg-panel-2" role="radiogroup" aria-label="Shift">
                  {options.data.shift.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={form.shift === s}
                      onClick={() => set("shift")(s)}
                      className={cx("h-8 rounded-md text-sm font-semibold", form.shift === s ? "bg-panel text-ink shadow-card" : "text-muted hover:text-ink")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </FormSection>

            <FormSection id="sec-what" title="What was rejected" sub="The part, the defect found and what happens to the rejected parts." cols={2}>
              <Field label="Part" hint="Part name or number as on the job card.">
                <input {...bind("part")} required minLength={2} maxLength={60} placeholder="e.g. Gearbox housing GH-204" />
              </Field>
              <Field as="div" label="Defect">
                <Select label="Defect" hideLabel required field value={form.defect} placeholder="Choose a defect"
                  options={options.data.defect.map((d) => ({ value: d, label: d }))} onChange={set("defect")} />
              </Field>
              <div className="sm:col-span-2">
                <Field as="div" label="Disposition">
                  <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Disposition">
                    {options.data.disposition.map((d) => {
                      const on = form.disposition === d;
                      return (
                        <button
                          key={d}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => set("disposition")(d)}
                          className={cx(
                            "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                            on ? "border-accent bg-brand-soft shadow-[inset_0_0_0_1px_var(--accent)]" : "border-line-strong hover:border-field-hover",
                          )}
                        >
                          <span className={cx("grid place-items-center size-4 mt-0.5 shrink-0 rounded-full border-2", on ? "border-accent" : "border-line-strong")}>
                            {on && <span className="size-1.5 rounded-full bg-accent" />}
                          </span>
                          <span className="grid gap-0.5">
                            <span className="text-sm font-semibold">{d}</span>
                            <span className="text-xs text-muted">{DISPOSITION[d]}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </FormSection>

            <FormFoot error={error} note={`Logged as ${user.id} · ${user.name}`}>
              <Link href="/rejections" className={btnQuiet}>Cancel</Link>
              <button type="submit" className={btn} disabled={saving}>{saving ? "Saving…" : "Save entry"}</button>
            </FormFoot>
          </form>
        )}
      </main>
    </>
  );
}
