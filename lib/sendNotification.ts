
import {prisma} from "@/lib/prisma";

export async function sendNotification({
    userId,
    type,
    title,
    description,
    read = false,
}: {
    userId: string;
    type: string;
    title: string;
    description?: string;

    read?: boolean;
}) {
    try {
        const user = await prisma.appUsers.findUnique({
            where: {id: userId},
        });
        if (!user) {
            throw new Error("User not found");
        }   
        const notification = await prisma.notifications.create({
            data: {
                userId,
                type,
                title,
                description: description ?? "This is a new notification",
                read,   
            },
        });
        return notification;
    } catch (error) {
        console.error("Error sending notification:", error);
        throw new Error("Failed to send notification");
    }
}