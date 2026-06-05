import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let sessionUser = (await auth())?.user as { id?: string; role?: string } | undefined;
    
      if (!sessionUser ) {
        const token = await getToken({ 
          req: request, 
          secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET 
        });
        
        if (token) {
          sessionUser = {
            id: token.sub, // NextAuth maps the user ID to the 'sub' field in JWTs
           
          };
        }
      }
    
      if (!sessionUser || !sessionUser.id) {
        return createError("Unauthorized", 401);
      }

    const userId = sessionUser.id;

    const body = await request.json();

    const {
      token: fcmToken,
      platform,
      deviceVersion,
      deviceName,
      deviceModelName,
      deviceBrand,
    } = body as {
      token?: string;
      platform?: string;
      deviceVersion?: string;
      deviceName?: string;
      deviceModelName?: string;
      deviceBrand?: string;
    };

    if (!fcmToken || !platform) {
      return NextResponse.json(
        { error: "Missing token or platform" },
        { status: 400 }
      );
    }

    const device = await prisma.deviceToken.upsert({
      where: {
        token: fcmToken,
      },
      update: {
        userId,
        platform: platform.toLowerCase(),

        deviceVersion,
        deviceName,
        deviceModelName,
        deviceBrand,

        updatedAt: new Date(),
      },
      create: {
        token: fcmToken,
        userId,
        platform: platform.toLowerCase(),

        deviceVersion,
        deviceName,
        deviceModelName,
        deviceBrand,
      },
    });

    return NextResponse.json({
      success: true,
      deviceId: device.id,
    });
  } catch (error) {
    console.error("DEVICE_REGISTER_ERROR:", error);

    return NextResponse.json(
      { error: "Failed to register device" },
      { status: 500 }
    );
  }
}

function createError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
