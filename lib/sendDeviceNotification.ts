import admin from "./firebaseAdmin";
import { prisma } from "./prisma";

type SendNotificationInput = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
};

export async function sendUserNotification({
  userId,
  title,
  body,
  data,
}: SendNotificationInput) {
  // 1. Get all device tokens for user
  const devices = await prisma.deviceToken.findMany({
    where: { userId },
  });

  const tokens = devices.map((d) => d.token);

  if (tokens.length === 0) {
    console.log("No devices found for user:", userId);
    return;
  }

  // 2. Send via Firebase multicast
  const message = {
    notification: {
      title,
      body,
    },
    data: data ?? {},
    tokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message);

  // 3. Cleanup invalid tokens
  const invalidTokens: string[] = [];

  response.responses.forEach((res, idx) => {
    if (!res.success) {
      invalidTokens.push(tokens[idx]);
    }
  });

  if (invalidTokens.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: {
        token: { in: invalidTokens },
      },
    });
  }

  return response;
}