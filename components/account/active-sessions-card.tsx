"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Laptop, Smartphone, Globe, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface SessionData {
  id: string;
  sessionToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastActive: string;
}

interface ActiveSessionsCardProps {
  currentSessionId?: string | null;
}

function parseUserAgent(uaString: string | null) {
  if (!uaString) return { browser: "Unknown Browser", os: "Unknown OS", isMobile: false };
  
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  
  const ua = uaString.toLowerCase();
  
  // OS
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";
  
  // Browser
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";
  
  const isMobile = ua.includes("mobi") || ua.includes("android") || ua.includes("iphone") || ua.includes("ipad");

  return { browser, os, isMobile };
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function ActiveSessionsCard({ currentSessionId }: ActiveSessionsCardProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/auth/sessions");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error(err);
      toast.error("Could not load active sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionToken: string) => {
    const isCurrent = sessionToken === currentSessionId;
    
    if (isCurrent) {
      if (!confirm("Are you sure you want to sign out of this device?")) return;
    } else {
      if (!confirm("Are you sure you want to revoke this session?")) return;
    }

    setRevokingId(sessionToken);
    try {
      const res = await fetch(`/api/auth/sessions?sessionId=${sessionToken}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke session");
      
      toast.success(isCurrent ? "Signing you out..." : "Session successfully revoked");
      
      if (isCurrent) {
        signOut();
      } else {
        setSessions(sessions.filter((s) => s.sessionToken !== sessionToken));
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm("Are you sure you want to sign out of all other devices?")) return;
    
    setRevokingOthers(true);
    try {
      const res = await fetch("/api/auth/sessions?revokeOthers=true", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to revoke other sessions");

      toast.success("Signed out of all other devices");
      // Keep only current session in state
      setSessions(sessions.filter((s) => s.sessionToken === currentSessionId));
    } catch (err) {
      console.error(err);
      toast.error("Could not revoke other sessions");
    } finally {
      setRevokingOthers(false);
    }
  };

  if (loading) {
    return (
      <Card className="transition-all duration-300 bg-transparent backdrop-blur">
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Loading active sessions...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasOtherSessions = sessions.some((s) => s.sessionToken !== currentSessionId);

  return (
    <Card className="transition-all duration-300 bg-transparent backdrop-blur animate-in fade-in-50 duration-500">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage the devices and browsers currently logged into your account.
          </CardDescription>
        </div>
        {hasOtherSessions && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRevokeOthers}
            disabled={revokingOthers}
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            {revokingOthers ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="mr-2 h-4 w-4" />
            )}
            Sign out other devices
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No active sessions tracked.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {sessions.map((session, index) => {
              const { browser, os, isMobile } = parseUserAgent(session.userAgent);
              const isCurrent = session.sessionToken === currentSessionId;
              const isRevoking = revokingId === session.sessionToken;

              return (
                <div key={session.id} className={`flex items-center justify-between py-4 ${index === 0 ? "pt-0" : ""} ${index === sessions.length - 1 ? "pb-0" : ""}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/50">
                      {isMobile ? (
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                      ) : os === "Windows" || os === "macOS" || os === "Linux" ? (
                        <Laptop className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Globe className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {browser} on {os}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 font-normal bg-primary/20 text-primary border-primary/20">
                            This device
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span>{session.ipAddress || "Unknown IP"}</span>
                        <span>•</span>
                        <span>{isCurrent ? "Active now" : `Active ${formatRelativeTime(session.lastActive)}`}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRevoke(session.sessionToken)}
                    disabled={isRevoking}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                  >
                    {isRevoking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
