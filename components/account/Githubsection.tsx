import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SettingsSection, DetailRow } from "@/components/account/Settingssection";
import { Computer, RefreshCw, Unlink, Link as LinkIcon } from "lucide-react";
import type { AccountGitHubLink } from "./types";

interface GitHubSectionProps {
  githubLink: AccountGitHubLink[] | null | undefined;
  formatDate: (d: Date) => string;
}

export function GitHubSection({ githubLink, formatDate }: GitHubSectionProps) {
  const linked = githubLink?.[0];

  return (
    <SettingsSection
      tag="Integrations"
      title="GitHub"
      description="Link your GitHub account to enable commit activity tracking, repository stats, and code search within Fortmont."
    >
      <Card className="bg-background/35 backdrop-blur-md border-border/60">
        <CardContent className="pt-6">
          {linked ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/20 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <Computer className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">@{linked.username}</p>
                  <p className="text-xs text-muted-foreground">{linked.profileUrl}</p>
                </div>
                <Badge variant="default" className="shrink-0 text-xs">
                  Connected
                </Badge>
              </div>

              <div className="divide-y divide-border/40">
                <DetailRow
                  label="Scope granted"
                  value={linked.scope ?? "Not recorded"}
                  mono
                />
                <DetailRow label="Linked at" value={formatDate(linked.linkedAt)} />
              </div>

              <Separator className="opacity-50" />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-authorize
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Unlink account
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                <Computer className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No GitHub account linked</p>
                <p className="text-xs text-muted-foreground">
                  Connect your GitHub account to see commit activity and repository
                  stats in your Fortmont dashboard.
                </p>
              </div>
              <Button size="sm" className="mt-1 gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" />
                Connect GitHub
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </SettingsSection>
  );
}