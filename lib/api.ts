export async function safeJsonFetch(url: string, options?: RequestInit) {
  async function fetchAndParse() {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
    });

    const text = await response.text();
    const cleaned = text.trim();

    let data;
    try {
      data = cleaned ? JSON.parse(cleaned) : {};
    } catch {
      console.error("RISPOSTA RAW:", text);
      throw new Error("parse_error");
    }

    if (!response.ok) {
      throw new Error(data?.error || "Errore API");
    }

    return { response, data };
  }

  try {
    return await fetchAndParse();
  } catch {
    await new Promise((r) => setTimeout(r, 1500));

    try {
      return await fetchAndParse();
    } catch {
      throw new Error("Risposta non valida dal server");
    }
  }
}