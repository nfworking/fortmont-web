export async function GET() {
  const token = process.env.DNS_API_TOKEN;
  const endpoint = process.env.DNS_SERVER_RECORDS_ENDPOINT;

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 500 });
  }

  if (!endpoint) {
    return Response.json({ error: "Missing DNS endpoint" }, { status: 500 });
  }

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const details = await res.text();
      return Response.json(
        {
          error: "DNS request failed",
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

export async function POST(req: Request) {
  const token = process.env.DNS_API_TOKEN;
  const endpoint = process.env.DNS_SERVER_RECORDS_POST_ENDPOINT;

  if (!token || !endpoint) {
    return Response.json({ error: "Missing config" }, { status: 500 });
  }

  try {
    const params = new URLSearchParams();
    const payload = (await req.json()) as Record<string, unknown>;

    if (payload && typeof payload === "object") {
      const zone = typeof payload.zone === "string" ? payload.zone.trim() : "";
      const domain = typeof payload.domain === "string" ? payload.domain.trim() : "";
      const type = typeof payload.type === "string" ? payload.type.trim() : "";
      const ttl = payload.ttl;
      const ipAddress = typeof payload.ipAddress === "string" ? payload.ipAddress.trim() : "";

      if (!zone || !domain || !type || ttl === undefined || ttl === null || !ipAddress) {
        return Response.json(
          {
            error: "Missing required DNS fields",
            details: "zone, domain, type, ttl, and ipAddress are required",
          },
          { status: 400 }
        );
      }

      for (const [key, value] of Object.entries(payload)) {
        if (value === undefined || value === null) {
          continue;
        }

        if (typeof value === "object") {
          params.set(key, JSON.stringify(value));
          continue;
        }

        params.set(key, String(value).trim());
      }
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return Response.json(
        {
          error: "DNS request failed",
          status: res.status,
          details: text,
        },
        { status: res.status }
      );
    }

    return Response.json(JSON.parse(text));
  } catch (err) {
    return Response.json(
      {
        error: err instanceof Error ? err.message : "Failed",
      },
      { status: 500 }
    );
  }
}
