import { useEffect, useRef, useState } from "react";
import { getJson } from "./api";

type Json = { data: any; error: any; busy: boolean };

export function useJson(url: string | null | undefined, nonce = 0): Json {
  const [state, setState] = useState<Json>({
    data: null,
    error: null,
    busy: true,
  });
  useEffect(() => {
    if (!url) {
      setState({ data: null, error: null, busy: false });
      return;
    }
    const ctl = new AbortController();
    setState((s) => ({ ...s, busy: true }));
    getJson(url, { signal: ctl.signal })
      .then((data) => setState({ data, error: null, busy: false }))
      .catch(
        (error) =>
          !ctl.signal.aborted &&
          setState((s) => ({ ...s, error, busy: false })),
      );
    return () => ctl.abort();
  }, [url, nonce]);
  return state;
}

export function useCountUp(target: number | null | undefined, ms = 700) {
  const [value, setValue] = useState<number | null>(0);
  const shown = useRef(0);
  useEffect(() => {
    if (target == null) {
      setValue(null);
      return;
    }
    const from = Number.isFinite(shown.current) ? shown.current : 0;
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      from === target
    ) {
      shown.current = target;
      return setValue(target);
    }
    const start = performance.now();
    let raf: number;
    const tick = (now) => {
      const k = Math.min(1, (now - start) / ms);
      shown.current = from + (target - from) * (1 - (1 - k) ** 3);
      setValue(shown.current);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

export function useDebounced(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
