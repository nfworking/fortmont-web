"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SettingsSection } from "@/components/account/Settingssection";
import { Copy, Plus, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

type PlatformApiKey = {
  id: string;
  name: string;
  prefix: string;
  scopes: unknown;
  usageCount: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const AVAILABLE_SCOPES = [
  { value: "platform:read", label: "Read all platform data" },
  { value: "platform:users", label: "User directory" },
  { value: "platform:apps", label: "Applications" },
  { value: "platform:storage", label: "Storage usage" },
  { value: "platform:sessions", label: "Active sessions" },
] as const;

function parseScopes(scopes: unknown) {
  return Array.isArray(scopes) ? scopes.filter((scope): scope is string => typeof scope === "string") : [];
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function PlatformApiKeysSection() {
  const [keys, setKeys] = useState<PlatformApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Default platform API key");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["platform:read"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [creating, setCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const visibleKeys = useMemo(() => keys, [keys]);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/platform/account/keys");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load API keys");
      }

      setKeys(data.keys ?? []);
    } catch (error) {
      console.error(error);
      toast.error("Could not load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((value) => value !== scope)
        : [...current, scope],
    );
  };

  const handleCreateKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setCreating(true);
    setGeneratedKey(null);

    try {
      const response = await fetch("/api/platform/account/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          scopes: selectedScopes,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create API key");
      }

      setGeneratedKey(data.apiKey);
      toast.success("Platform API key created");
      await loadKeys();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Revoke this API key? Existing integrations using it will stop working.")) {
      return;
    }

    try {
      const response = await fetch(`/api/platform/account/keys/${keyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to revoke API key");
      }

      toast.success("API key revoked");
      await loadKeys();
    } catch (error) {
      console.error(error);
      toast.error("Could not revoke API key");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection
        tag="Platform API"
        title="Create and manage API keys"
        description="Generate scoped keys for your own services. Keys are shown once and stored hashed in the database."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-6">
            <form className="space-y-5" onSubmit={handleCreateKey}>
              <div className="space-y-1.5">
                <Label htmlFor="api-key-name" className="text-xs text-muted-foreground">
                  Key name
                </Label>
                <Input
                  id="api-key-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="bg-background/50"
                  placeholder="Production integration"
                />
              </div>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Scopes</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <button
                      key={scope.value}
                      type="button"
                      onClick={() => toggleScope(scope.value)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        selectedScopes.includes(scope.value)
                          ? "border-primary/40 bg-primary/10 text-foreground"
                          : "border-border/60 bg-background/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="font-medium">{scope.label}</div>
                      <div className="text-xs opacity-70">{scope.value}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="api-key-expiry" className="text-xs text-muted-foreground">
                  Expiry date and time
                </Label>
                <Input
                  id="api-key-expiry"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={creating} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : "Generate key"}
                </Button>
              </div>
            </form>

            {generatedKey && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <KeyRound className="h-4 w-4" />
                  Copy this key now. It will not be shown again.
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <code className="break-all rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                    {generatedKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      await navigator.clipboard.writeText(generatedKey);
                      toast.success("API key copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        tag="Active Keys"
        title="Configured API keys"
        description="Use these keys in the x-api-key header or as a Bearer token when calling platform routes."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading keys...</p>
            ) : visibleKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No API keys have been created yet.</p>
            ) : (
              <div className="space-y-4">
                {visibleKeys.map((key) => {
                  const isRevoked = Boolean(key.revokedAt);

                  return (
                  <div key={key.id} className="rounded-xl border border-border/60 bg-background/40 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-foreground">{key.name}</h3>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                            {key.prefix}
                          </Badge>
                          <Badge
                            variant={isRevoked ? "destructive" : "secondary"}
                            className="text-[10px] uppercase tracking-wide"
                          >
                            {isRevoked ? "Revoked" : "Active"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {formatDate(key.createdAt)} · Last used {formatDate(key.lastUsedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">Usage count: {key.usageCount}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {parseScopes(key.scopes).map((scope) => (
                            <Badge key={scope} variant="secondary" className="text-[10px]">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleRevoke(key.id)}
                        disabled={isRevoked}
                      >
                        <Trash2 className="h-4 w-4" />
                        {isRevoked ? "Revoked" : "Revoke"}
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </SettingsSection>
    </div>
  );
}