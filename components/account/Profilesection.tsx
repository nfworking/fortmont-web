import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { DetailRow, SettingsSection } from "@/components/account/Settingssection";
import { Upload } from "lucide-react";
import type { AccountUser } from "./types";

interface ProfileSectionProps {
  user: AccountUser | null;
  initials: string;
  sessionName?: string | null;
  sessionEmail?: string | null;
  formatDate: (d: Date) => string;
}

export function ProfileSection({
  user,
  initials,
  sessionName,
  sessionEmail,
  formatDate,
}: ProfileSectionProps) {
  const primaryMailbox =
    user?.mailboxes?.find((m) => m.isPrimary) ?? user?.mailboxes?.[0];

  return (
    <div className="flex flex-col gap-8">
      {/* ── Edit profile ── */}
      <SettingsSection
        tag="Profile"
        title="Public profile"
        description="This is how others see you across Fortmont — in tickets, comments, and audit logs."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-6">
            {/* Avatar row */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <Avatar className="h-16 w-16 rounded-2xl">
                  <AvatarImage
                    src={user?.avatarUrl ?? undefined}
                    alt={user?.displayName ?? "Account"}
                  />
                  <AvatarFallback className="rounded-2xl text-lg">
                    {initials || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Upload className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Profile photo</p>
                <p className="text-xs text-muted-foreground">JPG or PNG · max 2 MB</p>
                <Button variant="outline" size="sm" className="mt-1 h-7 text-xs">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Upload photo
                </Button>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Editable form */}
            {user ? (
              <AccountSettingsForm
                user={{
                  id: user.id,
                  displayName: user.displayName,
                  email: user.email,
                  phone: user.phone,
                  avatarUrl: user.avatarUrl,
                }}
                hasMailbox={(user.mailboxes?.length ?? 0) > 0}
              />
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>No database account matched this session.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </SettingsSection>

      {/* ── Identity details ── */}
      <SettingsSection
        tag="Identity"
        title="Account details"
        description="Read-only identity and lifecycle metadata."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 divide-y divide-border/40">
            {user ? (
              <>
                <DetailRow label="User ID" value={user.id} mono />
                <DetailRow label="Username" value={user.username} />
              </>
            ) : (
              <DetailRow label="Account link" value="No database match" />
            )}
            <DetailRow
              label="Display name"
              value={user?.displayName ?? sessionName ?? "Not set"}
            />
            <DetailRow
              label="Email"
              value={user?.email ?? sessionEmail ?? "Not set"}
            />
            <DetailRow label="Phone" value={user?.phone ?? "Not set"} />
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="shrink-0 text-sm text-muted-foreground">Status</span>
              <Badge variant={user?.isActive ? "default" : "secondary"}>
                {user?.isActive ? "Active" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="shrink-0 text-sm text-muted-foreground">Account type</span>
              <Badge variant="outline">
                {user?.isEntraUser ? "Microsoft Entra" : "Local account"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4 py-1.5">
              <span className="shrink-0 text-sm text-muted-foreground">Role</span>
              <Badge variant="secondary">{user?.role ?? "No role set"}</Badge>
            </div>
            {user && (
              <>
                <DetailRow label="Created" value={formatDate(user.createdAt)} />
                <DetailRow
                  label="Last login"
                  value={user.lastLoggedIn ? formatDate(user.lastLoggedIn) : "Never"}
                />
                <DetailRow label="Last updated" value={formatDate(user.updatedAt)} />
              </>
            )}
            <DetailRow
              label="Primary mailbox"
              value={primaryMailbox?.email ?? "No mailbox provisioned"}
            />
            <DetailRow
              label="Teams"
              value={user?.teams?.length ? `${user.teams.length} joined` : "None"}
            />
          </CardContent>
        </Card>
      </SettingsSection>
    </div>
  );
}