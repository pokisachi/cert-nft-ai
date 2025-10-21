// src/lib/fetcher.ts
export async function fetcher<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
