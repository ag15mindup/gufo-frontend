const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://gufo-backend1.onrender.com";

type SafeJsonFetchOptions = RequestInit & {
  headers?: Record<string, string>;
};

export async function safeJsonFetch(
  endpoint: string,
  options?: SafeJsonFetchOptions
) {
  try {
    const isAbsoluteUrl = /^https?:\/\//i.test(endpoint);
    const url = isAbsoluteUrl ? endpoint : `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      body: options?.body,
      cache: "no-store",
    });

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(
        "Il server non ha restituito JSON valido. Backend offline o errore endpoint."
      );
    }

    return { response, data };
  } catch (error) {
    return {
      response: {
        ok: false,
        status: 500,
      } as Response,
      data: {
        error: "Errore di rete",
      },
    };
  }
}