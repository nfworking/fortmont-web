export async function GET() {
  const token = process.env.PROXMOX_API_TOKEN;

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://ao2.fortmont.me/api2/json/cluster/resources`,
      {
        headers: {
          Authorization: token,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const details = await res.text();
      throw new Error(`Request failed: ${res.status} ${details}`);
    }

    const json = await res.json();

    return Response.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return Response.json({ error: message }, { status: 500 });
  }
}