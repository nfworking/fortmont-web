export async function GET() {
  const token = process.env.PROXMOX_API_TOKEN;

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 500 });
  }

  try {
    const nodes = ["prodinfra", "prodapp"];

    const results = await Promise.all(
      nodes.map(async (node) => {
        const res = await fetch(
          `https://ao2.fortmont.me/api2/json/nodes/${node}/lxc`,
          {
            headers: {
              Authorization: token,
            },
            cache: "no-store",
          }
        );

        if (!res.ok) {
          const details = await res.text();
          throw new Error(`Node ${node} failed: ${res.status} ${details}`);
        }

        const json = await res.json();
        return json.data ?? [];
      })
    );

    // Merge all node arrays into one
    const merged = results.flat();

    return Response.json({
      data: merged,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return Response.json({ error: message }, { status: 500 });
  }
}