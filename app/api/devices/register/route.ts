import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Request body
    const body = await request.json();

    const {
      token: fcmToken,
      platform,
    } = body as {
      token?: string;
      platform?: string;
    };

    if (!fcmToken || !platform) {
      return NextResponse.json(
        { error: "Missing token or platform" },
        { status: 400 }
      );
    }

    // 3. Save/update device
    const device = await prisma.deviceToken.upsert({
      where: {
        token: fcmToken,
      },
      update: {
        userId,
        platform: platform.toLowerCase(),
        updatedAt: new Date(),
      },
      create: {
        token: fcmToken,
        userId,
        platform: platform.toLowerCase(),
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