export async function GET() {
const token = process.env.PROXY_API_TOKEN;
  const endpoint = process.env.PROXY_SERVER_HOST;

  if (!token) {
    return Response.json({ error: "Missing proxy token" }, { status: 500 });
  }

  if (!endpoint) {
    return Response.json({ error: "Missing proxy endpoint" }, { status: 500 });
  }

  try {
    const res = await fetch(endpoint, {
      headers: {
        "X-API-Key": token,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const details = await res.text();
      return Response.json(
        {
          error: "Proxy request failed",
          status: res.status,
          details,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return Response.json({ error: message }, { status: 500 });
  }
}