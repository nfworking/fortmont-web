// lib/config.ts
import { prisma } from "@/lib/prisma";

export async function getSystemConfig() {
    const config = await prisma.systemConfig.findFirst({
      
        where: { id: 1 },
    });

    if (!config) {
        throw new Error("System has not been configured.");
    }

    return config;
}