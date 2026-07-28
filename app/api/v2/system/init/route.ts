import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
    const data = await request.json();

    const existing = await prisma.systemConfig.findUnique({
        where: { id: 1 },
    });

    if (existing?.initialized) {
        return Response.json(
            {
                status: "error",
                message: "System has already been initialized.",
            },
            { status: 400 }
        );
    }

    await prisma.systemConfig.upsert({
        where: { id: 1 },
        update: {
            initialized: true,

            appVersion: data.appVersion,

            proxmoxBaseUrl: data.proxmoxBaseUrl,
            proxmoxApiToken: data.proxmoxApiToken,

            dnsApiToken: data.dnsApiToken,
            dnsRecordsEndpoint: data.dnsRecordsEndpoint,
            dnsRecordsAddEndpoint: data.dnsRecordsAddEndpoint,

            proxyServerHost: data.proxyServerHost,
            proxyApiToken: data.proxyApiToken,

            smtpHost: data.smtpHost,
            smtpUser: data.smtpUser,
            smtpPassword: data.smtpPassword,

            imapHost: data.imapHost,

            s3Endpoint: data.s3Endpoint,
            s3AccessKey: data.s3AccessKey,
            s3SecretKey: data.s3SecretKey,
            s3Region: data.s3Region,
            s3Bucket: data.s3Bucket,

            unifiBaseUrl: data.unifiBaseUrl,
            unifiApiKey: data.unifiApiKey,
            unifiSiteId: data.unifiSiteId,
            unifiSelfSigned: data.unifiSelfSigned,
        },
        create: {
            id: 1,
            initialized: true,

            appVersion: data.appVersion,

            proxmoxBaseUrl: data.proxmoxBaseUrl,
            proxmoxApiToken: data.proxmoxApiToken,

            dnsApiToken: data.dnsApiToken,
            dnsRecordsEndpoint: data.dnsRecordsEndpoint,
            dnsRecordsAddEndpoint: data.dnsRecordsAddEndpoint,

            proxyServerHost: data.proxyServerHost,
            proxyApiToken: data.proxyApiToken,

            smtpHost: data.smtpHost,
            smtpUser: data.smtpUser,
            smtpPassword: data.smtpPassword,

            imapHost: data.imapHost,

            s3Endpoint: data.s3Endpoint,
            s3AccessKey: data.s3AccessKey,
            s3SecretKey: data.s3SecretKey,
            s3Region: data.s3Region,
            s3Bucket: data.s3Bucket,

            unifiBaseUrl: data.unifiBaseUrl,
            unifiApiKey: data.unifiApiKey,
            unifiSiteId: data.unifiSiteId,
            unifiSelfSigned: data.unifiSelfSigned,
        },
    });

    return Response.json({
        status: "success",
        message: "System initialized successfully.",
    });
}