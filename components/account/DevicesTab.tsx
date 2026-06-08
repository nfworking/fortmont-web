import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DevicesTabProps {
  device: any;
}

export default function DevicesTab({ device }: DevicesTabProps) {
  if (!device) {
    return <div className="text-sm text-muted-foreground">No device information available.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform</span>
          <Badge>{device.platform}</Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span>{device.deviceName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Model</span>
          <span>{device.deviceModelName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Brand</span>
          <span>{device.deviceBrand}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Version</span>
          <span>{device.deviceVersion}</span>
        </div>
      </CardContent>
    </Card>
  );
}
