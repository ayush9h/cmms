"use client";

import { Check, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/auth/provider";
import {
  Field,
  FormFoot,
  FormSection,
  PageHead,
  Select,
} from "@/components/ui";
import { getJson, postJson, query } from "@/lib/api";
import { SHIFTS } from "@/lib/constants";
import { fmt, plural } from "@/lib/format";
import { useJson } from "@/lib/hooks";

const iso = (d) => d.toLocaleDateString("en-CA");
const now = new Date();
const MONTH: [string, string] = [
  iso(new Date(now.getFullYear(), now.getMonth(), 1)),
  iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
];
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const toNum = (v) => (v === "" ? 0 : Math.max(0, Number(v)) || 0);
const READOUT =
  "flex items-baseline justify-between gap-2 h-10 px-3 py-1 leading-[30px] whitespace-nowrap rounded-md border border-dashed border-line-strong bg-panel-2";
const BLANK = {
  shift_hours: "8",
  short_breaks: "2",
  short_break_minutes: "15",
  meal_breaks: "1",
  meal_break_minutes: "30",
};

function dates(from, to) {
  const out: any[] = [];
  if (!from || !to || from > to) return out;
  for (
    let d = new Date(`${from}T00:00`);
    iso(d) <= to && out.length < 400;
    d.setDate(d.getDate() + 1)
  )
    out.push(iso(d));
  return out;
}
const weekday = (day) => new Date(`${day}T00:00`).getDay() % 6 !== 0;
const plan = (
  from: string,
  to: string,
  shifts: string[],
): Record<string, string[]> =>
  Object.fromEntries(
    dates(from, to)
      .filter(weekday)
      .map((d) => [d, [...shifts]]),
  );

function Count({ label, hint, bind, step = 1, min = 0, max, required }: any) {
  return (
    <Field label={label} hint={hint}>
      <input
        {...bind}
        type="number"
        inputMode={step === 1 ? "numeric" : "decimal"}
        min={min}
        max={max}
        step={step}
        required={required}
        placeholder="0"
      />
    </Field>
  );
}

const NAV =
  "grid place-items-center size-8 rounded-lg border border-line-strong text-ink-2 hover:bg-hover hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed";

function Calendar({ from, to, running, shifts, onChange }: any) {
  const [page, setPage] = useState(0);
  const days = dates(from, to);
  if (!days.length) return null;
  const today = iso(new Date());
  const months = [...new Set(days.map((d) => d.slice(0, 7)))];
  const at = Math.min(page, months.length - 1);
  const month = months[at];
  const list = days.filter((d) => d.startsWith(month));
  const flip = (day, s) => {
    const cur = running[day] ?? [];
    const next = cur.includes(s)
      ? cur.filter((x) => x !== s)
      : SHIFTS.filter((x) => x === s || cur.includes(x));
    onChange({ ...running, [day]: next });
  };
  const flipDay = (day) =>
    onChange({
      ...running,
      [day]: running[day]?.length ? [] : [...(shifts.length ? shifts : SHIFTS)],
    });

  const lead = (new Date(`${list[0]}T00:00`).getDay() + 6) % 7;
  const tail = (7 - ((lead + list.length) % 7)) % 7;
  const count = list.reduce((sum, d) => sum + (running[d]?.length ?? 0), 0);
  const worked = list.filter((d) => running[d]?.length).length;

  return (
    <div className="sm:col-span-3 grid gap-4">
      <section
        className="overflow-hidden rounded-xl border border-line-strong shadow-card"
        aria-label={fmt.monthLong(month)}
      >
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2.5 bg-panel border-b border-line-strong">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={NAV}
              onClick={() => setPage(at - 1)}
              disabled={at === 0}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={NAV}
              onClick={() => setPage(at + 1)}
              disabled={at === months.length - 1}
              aria-label="Next month"
            >
              <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <h3
              className="ml-1 text-[15px] font-semibold tracking-[-0.01em]"
              aria-live="polite"
            >
              {fmt.monthLong(month)}
            </h3>
            {months.length > 1 && (
              <span className="text-xs text-muted tabular-nums">
                {at + 1} of {months.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted tabular-nums">
            {plural(count, "shift")} · {plural(worked, "working day")}
          </p>
        </header>
        <div className="grid grid-cols-7 gap-px bg-line">
          {WEEK.map((w, i) => (
            <span
              key={w}
              className={`py-2 text-center text-[11px] font-semibold uppercase tracking-[0.06em] bg-shell ${i > 4 ? "text-muted" : "text-ink-2"}`}
            >
              {w}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead${i}`} className="bg-panel-2" />
          ))}
          {list.map((day) => {
            const on = running[day] ?? [];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`grid content-between gap-2 min-h-[76px] sm:min-h-[84px] p-1.5 sm:p-2 ${on.length ? "bg-panel" : "bg-panel-2"}`}
              >
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => flipDay(day)}
                    title={
                      on.length
                        ? "Mark the day as not running"
                        : "Mark the day as running"
                    }
                    aria-label={`${fmt.day(day)}: ${on.length ? `runs shift ${on.join(", ")}. Mark as not running` : "not running. Mark as running"}`}
                    className={`grid place-items-center min-w-7 h-7 px-1 rounded-full text-[13px] font-semibold tabular-nums ${
                      isToday
                        ? "bg-ink text-panel"
                        : on.length
                          ? "text-ink hover:bg-hover"
                          : "text-muted hover:bg-line"
                    }`}
                  >
                    {Number(day.slice(8))}
                  </button>
                  {!on.length && (
                    <span className="hidden sm:inline text-[11px] font-medium text-muted">
                      Off
                    </span>
                  )}
                </div>
                <div className="grid sm:grid-cols-3 gap-0.5 sm:gap-1">
                  {SHIFTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={on.includes(s)}
                      aria-label={`${fmt.day(day)} shift ${s}`}
                      onClick={() => flip(day, s)}
                      className={`h-5 sm:h-6 rounded-md text-[11px] font-semibold transition-colors ${
                        on.includes(s)
                          ? "bg-pr text-white"
                          : "border border-line text-muted hover:border-line-strong hover:text-ink"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {Array.from({ length: tail }, (_, i) => (
            <span key={`tail${i}`} className="bg-panel-2" />
          ))}
        </div>
      </section>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-3 rounded bg-pr" /> Shift runs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-3 rounded border border-line-strong" /> Shift off
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-3 rounded-full bg-ink" /> Today
        </span>
        <span>Select a date to switch the whole day on or off.</span>
      </p>
    </div>
  );
}

export function PpcForm() {
  const router = useRouter();
  const { user } = useAuth();
  const options = useJson("/api/options");
  const [form, setForm] = useState(() => ({
    date_from: MONTH[0],
    date_to: MONTH[1],
    asset_id: "",
    ideal_rate: "",
    ...BLANK,
  }));
  const [shifts, setShifts] = useState(SHIFTS);
  const [running, setRunning] = useState(() => plan(...MONTH, SHIFTS));
  const [entryId, setEntryId] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<any>(null);
  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));
  const bind = (key) => ({
    name: key,
    value: form[key],
    onChange: (e) => set(key)(e.target.value),
  });
  const rateOf = (id) => options.data?.asset.find((a) => a.id === id)?.run_rate;

  useEffect(() => {
    const { asset_id, date_from, date_to } = form;
    if (!asset_id || !date_from || !date_to || date_from > date_to)
      return setEntryId(null);
    const ctl = new AbortController();
    getJson(`/api/ppc/find?${query({ asset_id, date_from, date_to })}`, {
      signal: ctl.signal,
    })
      .then((found) => {
        if (!found) {
          setEntryId((cur) => {
            if (cur)
              setForm((f) => ({
                ...f,
                ...BLANK,
                ideal_rate: rateOf(asset_id) ? String(rateOf(asset_id)) : "",
              }));
            return null;
          });
          return;
        }
        const {
          entry_id,
          running: saved,
          ...rest
        } = found as {
          entry_id: any;
          running: Record<string, string[]>;
          [k: string]: any;
        };
        setEntryId(entry_id);
        setRunning(saved);
        setShifts(
          SHIFTS.filter((s) => Object.values(saved).some((d) => d.includes(s))),
        );
        setForm((f) => ({
          ...f,
          ...Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, String(v)]),
          ),
        }));
      })
      .catch(() => {});
    return () => ctl.abort();
  }, [form.asset_id, form.date_from, form.date_to]);

  const setRange = (key) => (e) => {
    const next = { ...form, [key]: e.target.value };
    setForm(next);
    setRunning(plan(next.date_from, next.date_to, shifts));
  };
  const pickAsset = (id) =>
    setForm((f) => ({
      ...f,
      asset_id: id,
      ideal_rate: rateOf(id) ? String(rateOf(id)) : f.ideal_rate,
    }));
  const toggleShift = (s) => {
    const on = !shifts.includes(s);
    setShifts(SHIFTS.filter((x) => (x === s ? on : shifts.includes(x))));
    setRunning((r) =>
      Object.fromEntries(
        dates(form.date_from, form.date_to)
          .map((d) => {
            const cur = r[d] ?? [];
            const next = on
              ? weekday(d) || cur.length
                ? SHIFTS.filter((x) => x === s || cur.includes(x))
                : cur
              : cur.filter((x) => x !== s);
            return [d, next];
          })
          .filter(([, v]) => v.length),
      ),
    );
  };

  const n = Object.fromEntries(
    Object.entries(form).map(([k, v]) => [k, toNum(v)]),
  );
  const asset = options.data?.asset.find((a) => a.id === form.asset_id);
  const perShift =
    Math.round(n.shift_hours * 60) -
    n.short_breaks * n.short_break_minutes -
    n.meal_breaks * n.meal_break_minutes;
  const inRange = Object.entries(running).filter(
    ([d, v]) => d >= form.date_from && d <= form.date_to && v.length,
  );
  const slots = inRange.reduce((sum, [, v]) => sum + v.length, 0);
  const badRange = !dates(form.date_from, form.date_to).length;
  const projected =
    perShift > 0 ? Math.round(perShift * slots * n.ideal_rate) : 0;
  const even =
    inRange.length > 0 &&
    inRange.every(([, v]) => v.length === inRange[0][1].length);

  async function submit(e) {
    e.preventDefault();
    if (!form.asset_id) return setError("Choose the machine.");
    if (badRange) return setError("“From” must be on or before “To”.");
    if (!slots) return setError("Tick at least one shift the machine ran.");
    if (perShift < 1) return setError("Breaks can't take up the whole shift.");
    if (n.ideal_rate <= 0)
      return setError("Enter the ideal run rate in pieces per minute.");
    setSaving(true);
    setError(null);
    try {
      const { date_from, date_to, asset_id, ...numbers } = form;
      const body = {
        date_from,
        date_to,
        asset_id,
        running: Object.fromEntries(inRange),
        ...Object.fromEntries(Object.keys(numbers).map((k) => [k, n[k]])),
      };
      const res = await (entryId
        ? getJson(`/api/ppc/${entryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : postJson("/api/ppc", body));
      router.push(
        `/oee?logged=${encodeURIComponent(`${res.asset_id}|${res.date}`)}`,
      );
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <>
      <PageHead
        title="PPC entry"
        sub="Planned time and run rate for one machine. Down time and pieces come from the logs."
        icon={ClipboardList}
        tone="pr"
      >
        <Link
          href="/oee"
          className={
            "inline-flex items-center min-h-10 px-4 rounded-lg border border-line-strong bg-panel text-ink font-semibold whitespace-nowrap shadow-card hover:border-steel hover:bg-hover"
          }
        >
          OEE overview
        </Link>
      </PageHead>
      <main
        className={"px-[clamp(16px,2.5vw,28px)] pt-2 pb-10 transition-opacity"}
      >
        {options.error ? (
          <p
            className={
              "mb-4 px-3.5 py-2.5 rounded-md border border-danger-line bg-danger-bg text-danger-ink"
            }
            role="alert"
          >
            Can’t reach the OPMAX server: {options.error.message}.
          </p>
        ) : !options.data ? (
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
          <>
            {entryId && (
              <p
                className={
                  "mb-4 px-3.5 py-2.5 rounded-md border border-ok-line bg-ok-bg text-ok-ink"
                }
                role="status"
              >
                {form.asset_id} already has an entry for{" "}
                {fmt.day(form.date_from)} – {fmt.day(form.date_to)}, so it’s
                loaded below. Saving updates it, and OEE for those months.
              </p>
            )}
            <form
              className={
                "rounded-2xl border border-line bg-panel shadow-card border-t-[3px] border-t-pr"
              }
              onSubmit={submit}
            >
              <FormSection
                id="sec-when"
                title="Machine & period"
                sub="This month by default, Monday to Friday."
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
                    onChange={pickAsset}
                  />
                </Field>
                <Field label="From">
                  <input
                    name="date_from"
                    type="date"
                    required
                    value={form.date_from}
                    max={form.date_to || undefined}
                    onChange={setRange("date_from")}
                  />
                </Field>
                <Field label="To">
                  <input
                    name="date_to"
                    type="date"
                    required
                    value={form.date_to}
                    min={form.date_from || undefined}
                    onChange={setRange("date_to")}
                  />
                </Field>
              </FormSection>

              <FormSection
                id="sec-days"
                title="Shifts run"
                sub="Tick the shifts the machine works. Untick a shift or a whole day (select the date) when the machine isn’t planned to run. OEE is calculated for each shift that has production or a breakdown logged."
                cols={3}
              >
                <div
                  className="sm:col-span-3 flex flex-wrap items-center gap-2"
                  role="group"
                  aria-label="Shifts"
                >
                  {SHIFTS.map((s) => {
                    const on = shifts.includes(s);
                    return (
                      <label
                        key={s}
                        className={`inline-flex items-center gap-2 h-9 pl-2 pr-3 rounded-lg border text-sm font-semibold cursor-pointer ${
                          on
                            ? "border-pr bg-pr-soft text-pr"
                            : "border-line-strong text-ink-2 hover:border-field-hover"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => toggleShift(s)}
                          className="sr-only"
                        />
                        <span
                          className={`grid place-items-center size-4 rounded border ${
                            on
                              ? "border-pr bg-pr text-white"
                              : "border-line-strong bg-panel"
                          }`}
                          aria-hidden="true"
                        >
                          {on && <Check size={12} strokeWidth={3} />}
                        </span>
                        Shift {s}
                      </label>
                    );
                  })}
                  <p
                    className="ml-auto text-[13px] text-muted tabular-nums"
                    aria-live="polite"
                  >
                    {plural(slots, "shift")} over{" "}
                    {plural(inRange.length, "day")}
                  </p>
                </div>
                <Calendar
                  from={form.date_from}
                  to={form.date_to}
                  running={running}
                  shifts={shifts}
                  onChange={setRunning}
                />
              </FormSection>

              <FormSection
                id="sec-time"
                title="Planned time"
                sub="Shift length less breaks, for every shift ticked above."
                cols={4}
              >
                <Count
                  label="Shift length (hours)"
                  bind={bind("shift_hours")}
                  step={0.5}
                  min={0.5}
                  max={24}
                  required
                />
                <Count
                  label="Short breaks"
                  bind={bind("short_breaks")}
                  max={20}
                />
                <Count
                  label="Short break (min each)"
                  bind={bind("short_break_minutes")}
                  max={120}
                />
                <Count
                  label="Meal breaks"
                  bind={bind("meal_breaks")}
                  max={10}
                />
                <Count
                  label="Meal break (min each)"
                  bind={bind("meal_break_minutes")}
                  max={180}
                />
                <div className="sm:col-span-1 lg:col-span-3">
                  <Field
                    as="div"
                    label="Planned production time"
                    hint={
                      perShift < 1
                        ? "Breaks take up the whole shift."
                        : undefined
                    }
                  >
                    <output
                      className={`${READOUT} ${perShift < 1 ? "border-crit" : ""}`}
                      aria-live="polite"
                    >
                      <b className="text-[15px] font-[650] tabular-nums">
                        {perShift < 1 || badRange
                          ? "—"
                          : fmt.mins(perShift * slots)}
                      </b>
                      <small className="min-w-0 truncate text-xs text-muted">
                        {perShift < 1
                          ? "Shift length − breaks"
                          : even
                            ? `${fmt.mins(perShift)} × ${plural(slots / inRange.length, "shift")} × ${plural(inRange.length, "day")}`
                            : `${fmt.mins(perShift)} a shift × ${plural(slots, "shift")}`}
                      </small>
                    </output>
                  </Field>
                </div>
              </FormSection>

              <FormSection
                id="sec-rate"
                title="Run rate"
                sub="Filled from the machine's asset record. Change it if this part runs at a different rate."
                cols={4}
              >
                <Count
                  label="Ideal run rate (PPM)"
                  hint={
                    asset && !asset.run_rate
                      ? "No run rate on this asset yet."
                      : "Pieces per minute. 3,600 per hour is 60 per minute."
                  }
                  bind={bind("ideal_rate")}
                  step="any"
                  min={0.001}
                  required
                />
                <div className="sm:col-span-1 lg:col-span-3">
                  <Field
                    as="div"
                    label="Projected pieces"
                    hint="For the whole plan. Each logged shift is measured against its own share: planned time for the shift × run rate."
                  >
                    <output className={READOUT} aria-live="polite">
                      <b className="text-[15px] font-[650] tabular-nums">
                        {projected ? fmt.n(projected) : "—"}
                      </b>
                      <small className="min-w-0 truncate text-xs text-muted">
                        {projected
                          ? `${fmt.mins(perShift * slots)} planned × ${fmt.n(n.ideal_rate)} a minute`
                          : "Planned production time × run rate"}
                      </small>
                    </output>
                  </Field>
                </div>
              </FormSection>

              <FormFoot
                error={error}
                note={`Logged as ${user.id} · ${user.name}`}
              >
                <Link
                  href="/oee"
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
                  {saving ? "Saving…" : entryId ? "Update entry" : "Save entry"}
                </button>
              </FormFoot>
            </form>
          </>
        )}
      </main>
    </>
  );
}
