import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Helper function to ping URLs with a short timeout
async function checkServiceStatus(url: string | null): Promise<"online" | "offline"> {
  if (!url) return "offline";
  
  // Normalize URLs (ensure absolute pathing for external or internal fetch)
  let targetUrl = url;
  if (url.startsWith("/")) {
    // If it's a relative local dashboard route, you can either assume it's up 
    // or point it back to your localhost port if you want a true server check:
    // e.g., targetUrl = `http://localhost:3000${url}`;
    return "online"; 
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5-second timeout limit

    const response = await fetch(targetUrl, {
      method: "HEAD", // HEAD is much faster than GET since it drops the body payload
      signal: controller.signal,
      headers: { "User-Agent": "Dashboard-Status-Checker" },
    });

    clearTimeout(timeoutId);
    
    // Any typical success or redirection code means the app layer is alive
    return response.status >= 200 && response.status < 400 ? "online" : "offline";
  } catch (error) {
    return "offline";
  }
}

// GET all apps with dynamic live status checks
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const label = searchParams.get("label") ?? undefined;
  const description = searchParams.get("description") ?? undefined;
  const url = searchParams.get("url") ?? undefined;

  // 1. Fetch apps from database
  const apps = await prisma.apps.findMany({
    where: {
      label,
      description,
      url,
    },
  });

  // 2. Ping all service URLs concurrently
  const appsWithStatus = await Promise.all(
    apps.map(async (app) => {
      const status = await checkServiceStatus(app.url);
      return {
        ...app,
        status, // Appends "online" or "offline" dynamically to the object
      };
    })
  );

  return Response.json(appsWithStatus);
}