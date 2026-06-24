"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SettingsSection } from "@/components/account/Settingssection";
import { ShieldAlert } from "lucide-react";

export function SecuritySection() {
  return (
    <div className="flex flex-col gap-8">
      {/* ── Change password ── */}
      <SettingsSection
        tag="Security"
        title="Change password"
        description="After updating your password you will be signed out of all other active sessions."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-xs text-muted-foreground">
                Current password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••••••"
                className="bg-background/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs text-muted-foreground">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••••••"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••••••"
                  className="bg-background/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 12 characters.</p>
            <div className="flex justify-end pt-2">
              <Button size="sm">Update password</Button>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* ── Danger zone ── */}
      <SettingsSection
        tag="Danger zone"
        title="Deactivate account"
        description="Deactivating your account suspends access immediately. An administrator can reverse this."
      >
        <Card className="bg-background/35 backdrop-blur-md border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-destructive/10 p-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  This will immediately revoke your access to Fortmont. All active
                  sessions will be terminated. Your data is preserved and the account
                  can be reactivated by an administrator.
                </p>
                <Button variant="destructive" size="sm">
                  Deactivate my account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>
    </div>
  );
}