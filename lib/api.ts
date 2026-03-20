export async function safeJsonFetch(url: string, options?: RequestInit) {
  async function fetchAndParse() {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    const text = await response.text();
    const cleaned = text.trim();

    let data: any = {};

    try {
      data = cleaned ? JSON.parse(cleaned) : {};
    } catch {
      console.error("URL FETCH:", url);
      console.error("STATUS:", response.status);
      console.error("RISPOSTA RAW:", text);

      if (!response.ok) {
        throw new Error(`Errore server (${response.status})`);
      }

      throw new Error("Risposta non valida dal server");
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          `Errore server (${response.status})`
      );
    }

    return { response, data };
  }

  try {
    return await fetchAndParse();
  } catch (firstError: any) {
    await new Promise((r) => setTimeout(r, 1500));

    try {
      return await fetchAndParse();
    } catch (secondError: any) {
      throw new Error(
        secondError?.message ||
          firstError?.message ||
          "Errore di connessione al server"
      );
    }
  }
}