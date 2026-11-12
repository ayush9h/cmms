const FIELD = {
  asset_id: "Asset",
  start: "Start time",
  installed: "Installation date",
  cls: "Class",
  oem: "OEM",
};

function detail(d: any, status: number): string {
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((e) => {
        const key = e.loc?.at(-1);
        const msg = String(e.msg ?? "").replace(/^Value error, /, "");
        return typeof key === "string" && key !== "body"
          ? `${FIELD[key] ?? key[0].toUpperCase() + key.slice(1)}: ${msg}`
          : msg;
      })
      .join(" ");
  }
  return `Server answered ${status}`;
}

export async function getJson(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const body = await r.json().catch(() => null);
  if (r.status === 401 && !url.startsWith("/api/auth/login"))
    window.dispatchEvent(new Event("cmms:unauthorized"));
  if (!r.ok) {
    const err: Error & { status?: number } = new Error(
      detail(body?.detail, r.status),
    );
    err.status = r.status;
    throw err;
  }
  return body;
}

const send = (method: string) => (url: string, data: unknown) =>
  getJson(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
export const postJson = send("POST");
export const putJson = send("PUT");

export const query = (params: Record<string, unknown>) =>
  new URLSearchParams(
    Object.entries(params).flatMap(([k, v]) =>
      [v]
        .flat()
        .filter((x) => x !== "" && x != null)
        .map((x) => [k, String(x)] as [string, string]),
    ),
  ).toString();
