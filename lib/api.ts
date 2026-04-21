const API_URL = "http://localhost:3001";
export async function safeJsonFetch(
  url: string,
  options?: RequestInit
) {
  try {
    const response = await fetch(`${API_URL}${url}`, {
      method: options?.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      body: options?.body,
      cache: "no-store",
    });

    const text = await response.text();

    let data: any = null;

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
      response: { ok: false } as Response,
      data: { error: "Errore di rete" },
    };
  }
}