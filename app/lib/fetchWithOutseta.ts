// app/lib/fetchWithOutseta.ts
const OUTSETA_WAIT_MS = 1200;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
async function getOutseta(): Promise<any | null> {
  if (typeof window === "undefined") return null;
  const start = Date.now();
  while (Date.now() - start < OUTSETA_WAIT_MS) {
    // @ts-ignore
    if ((window as any)?.Outseta?.getUser) return (window as any).Outseta;
    await sleep(100);
  }
  return null;
}

export async function fetchWithOutseta(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const outseta = await getOutseta();
  if (outseta) {
    try {
      const u = await outseta.getUser();
      if (u?.Account?.Uid) headers.set("x-outseta-account", u.Account.Uid);
      if (u?.Uid) headers.set("x-outseta-user", u.Uid);
      // Optional token forward if you plan to verify on server:
      // const tok = outseta.getAccessToken?.(); if (tok) headers.set("authorization", `Bearer ${tok}`);
    } catch {}
  }
  headers.set("x-client", "landhunt-web");
  return fetch(input, { ...init, headers });
}
