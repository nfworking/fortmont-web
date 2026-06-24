"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SettingsSection } from "@/components/account/Settingssection";
import { Trash2 } from "lucide-react";

export function AccountSection() {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Preferences ── */}
      <SettingsSection
        tag="Account"
        title="Preferences"
        description="Application-level settings for your account."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="timezone" className="text-xs text-muted-foreground">
                  Timezone
                </Label>
                <Input
                  id="timezone"
                  value="Australia/Brisbane (UTC+10)"
                  readOnly
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language" className="text-xs text-muted-foreground">
                  Language
                </Label>
                <Input
                  id="language"
                  value="English (Australia)"
                  readOnly
                  className="bg-background/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Timezone and language are inherited from your system settings.
              Contact your administrator to change them.
            </p>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* ── Danger zone ── */}
      <SettingsSection
        tag="Danger zone"
        title="Delete account"
        description="Permanently removes all data associated with this account. This cannot be undone."
      >
        <Card className="bg-background/35 backdrop-blur-md border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-destructive/10 p-2">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Deleting your account will permanently remove all associated data
                  including mailboxes, device tokens, and audit history. This action
                  is irreversible and requires administrator approval.
                </p>
                <Button variant="destructive" size="sm">
                  Delete my account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>
    </div>
  );
}