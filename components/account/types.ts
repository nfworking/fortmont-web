import type { Prisma } from "@/app/generated/prisma/client";

/**
 * The exact shape returned by the account page Prisma query.
 * All section components import `AccountUser` from here instead of
 * declaring their own interfaces — this eliminates mismatches between
 * manually-written types and what Prisma actually returns.
 */
export type AccountUser = Prisma.AppUsersGetPayload<{
  select: {
    id: true;
    username: true;
    displayName: true;
    email: true;
    role: true;
    avatarUrl: true;
    phone: true;
    isEntraUser: true;
    isActive: true;
    createdAt: true;
    updatedAt: true;
    lastLoggedIn: true;
    mailboxes: {
      select: { id: true; email: true; isPrimary: true; provider: true };
    };
    deviceTokens: {
      select: {
        id: true;
        platform: true;
        deviceName: true;
        deviceModelName: true;
        deviceBrand: true;
      };
    };
    teams: {
      select: { name: true; description: true };
    };
    githubLink: {
      select: {
        username: true;
        profileUrl: true;
        avatarUrl: true;
        scope: true;
        linkedAt: true;
      };
    };
    storage: {
      select: { quotaBytes: true; usedBytes: true };
    };
  };
}>;

// Convenience slice types so section components only declare what they use
export type AccountMailbox = AccountUser["mailboxes"][number];
export type AccountDeviceToken = AccountUser["deviceTokens"][number];
export type AccountGitHubLink = AccountUser["githubLink"][number];
export type AccountTeam = AccountUser["teams"][number];
export type AccountStorage = NonNullable<AccountUser["storage"]>;