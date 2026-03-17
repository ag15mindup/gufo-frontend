export async function safeJsonFetch(url: string, options?: RequestInit) {
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      cache: "no-store",
    });
  } catch (err) {
    throw new Error("Errore di connessione al server");
  }

  let text = "";
  try {
    text = await response.text();
  } catch {
    throw new Error("Errore lettura risposta server");
  }

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Risposta non valida dal server");
  }

  if (!response.ok) {
    throw new Error(data?.error || "Errore API");
  }

  return { response, data };
}