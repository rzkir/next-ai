export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const apiUrl = process.env.API_URL ?? "https://api.rizkiramadhan.biz.id";
    const body = await request.text();
    const res = await fetch(`${apiUrl}/api/v1/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    return new Response(await res.text(), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Gagal memproses prompt" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
