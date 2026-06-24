import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsSection } from "@/components/account/Settingssection";
import { Mail, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AccountMailbox } from "./types";

interface MailboxesSectionProps {
  mailboxes: AccountMailbox[];
}

export function MailboxesSection({ mailboxes }: MailboxesSectionProps) {
  return (
    <SettingsSection
      tag="Integrations"
      title="Mailboxes"
      description="Exchange 2019 mailboxes provisioned to your account. The primary mailbox receives system notifications."
    >
      <Card className="bg-background/35 backdrop-blur-md border-border/60">
        <CardContent className="pt-6 space-y-3">
          {mailboxes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Mail className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No mailboxes provisioned.</p>
              <p className="text-xs text-muted-foreground/70">
                Contact your administrator to request a mailbox.
              </p>
            </div>
          ) : (
            mailboxes.map((mailbox) => (
              <div
                key={mailbox.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                  mailbox.isPrimary
                    ? "border-border/60 bg-background/50"
                    : "border-border/40 bg-background/20",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{mailbox.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {mailbox.provider} · {mailbox.isPrimary ? "Primary" : "Shared"}
                  </p>
                </div>
                {mailbox.isPrimary && (
                  <Badge variant="default" className="shrink-0 text-xs">
                    Primary
                  </Badge>
                )}
              </div>
            ))
          )}
          <div className="pt-1">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Request mailbox
            </Button>
          </div>
        </CardContent>
      </Card>
    </SettingsSection>
  );
}