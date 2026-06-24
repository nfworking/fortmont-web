import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsSection } from "@/components/account/Settingssection";
import { Smartphone, Tablet, Unlink } from "lucide-react";
import type { AccountDeviceToken } from "./types";

interface DevicesSectionProps {
  deviceTokens: AccountDeviceToken[];
}

function formatBrand(brand: string | null | undefined) {
  return (brand ?? "Unknown brand")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function DeviceIcon({ platform }: { platform: string | null }) {
  const p = platform?.toLowerCase() ?? "";
  if (p.includes("ios") || p.includes("android")) {
    return <Smartphone className="h-5 w-5 text-muted-foreground" />;
  }
  return <Tablet className="h-5 w-5 text-muted-foreground" />;
}

export function DevicesSection({ deviceTokens }: DevicesSectionProps) {
  return (
    <SettingsSection
      tag="Integrations"
      title="Registered devices"
      description="Mobile devices enrolled in MDM and linked to your account for push notifications."
    >
      <Card className="bg-background/35 backdrop-blur-md border-border/60">
        <CardContent className="pt-6 space-y-3">
          {deviceTokens.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Smartphone className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No devices linked.</p>
              <p className="text-xs text-muted-foreground/70">
                Install the Fortmont mobile app and sign in to link a device.
              </p>
            </div>
          ) : (
            deviceTokens.map((device) => (
              <div
                key={device.id}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/20 px-4 py-3"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <DeviceIcon platform={device.platform} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {device.deviceName ?? "Unnamed device"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBrand(device.deviceBrand)}
                    {device.deviceModelName ? ` · ${device.deviceModelName}` : ""}
                    {device.platform ? ` · ${device.platform}` : ""}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Unlink className="h-3.5 w-3.5" />
                  Unlink
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </SettingsSection>
  );
}