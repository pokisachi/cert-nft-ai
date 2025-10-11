// lib/apiClient.ts
// Hàm fetch client-side tiện lợi, tự động gửi cookie "auth_token" (httpOnly)

export async function apiFetch<T = any>(
  path: string,
  init?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(path, {
      method: init?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      body: init?.body,
      credentials: "include", // gửi cookie auth_token
      cache: "no-store", // luôn lấy dữ liệu mới
    });

    if (!res.ok) {
      let message = "";
      try {
        message = await res.text();
      } catch {
        message = `HTTP ${res.status}`;
      }

      throw new Error(message || `Request failed with ${res.status}`);
    }

    return (await res.json()) as T;
  } catch (err: unknown) {
    console.error("[apiFetch] Error:", err);
    if (err instanceof Error) throw err;
    throw new Error("Unexpected network error");
  }
}
