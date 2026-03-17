export async function safeJsonFetch(
  url: string,
  options?: RequestInit,
  retries = 2
) {
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();

    if (!contentType.includes("application/json")) {
      throw new Error("API non valida");
    }

    const data = text ? JSON.parse(text) : {};

    return { response, data };
  } catch (error) {
    if (retries > 0) {
      // aspetta 2.5 secondi (Render si "sveglia")
      await new Promise((resolve) => setTimeout(resolve, 2500));

      return safeJsonFetch(url, options, retries - 1);
    }

    throw error;
  }
}