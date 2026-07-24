import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/account/Settingssection";
import { ActiveSessionsCard } from "@/components/account/active-sessions-card";
import { LogOut } from "lucide-react";

interface SessionsSectionProps {
  currentSessionId?: string | null;
}

export function SessionsSection({ currentSessionId }: SessionsSectionProps) {
  return (
    <SettingsSection
      tag="Security"
      title="Active sessions"
      description="Devices and browsers currently signed in to your Fortmont account. Revoking a session signs that device out immediately."
    >
      {/* Delegate to the existing ActiveSessionsCard — it already handles the
          session list, current session highlight, and revoke actions. We just
          wrap it in the section layout so the styling stays consistent. */}
      <ActiveSessionsCard currentSessionId={currentSessionId} />

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          Revoke all other sessions
        </Button>
      </div>
    </SettingsSection>
  );
}