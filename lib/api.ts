export async function safeJsonFetch(url: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const text = await response.text();

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Il server non ha restituito JSON valido. Probabile backend non attivo o endpoint errato`
    );
  }

  return { response, data };
}