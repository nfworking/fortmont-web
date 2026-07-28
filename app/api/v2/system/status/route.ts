import { getSystemConfig } from "@/lib/config";

export async function GET() {
    const config = await getSystemConfig();
    if (config.initialized == false) {
        return new Response(
            JSON.stringify({
                status: "error",
                message: "System has not been initialized.",
            }),
            { status: 500 }
        );
    }
    return new Response(
        JSON.stringify({
            status: "ok",
            message: "System is initialized.",
        }),
        { status: 200 }
    );
}