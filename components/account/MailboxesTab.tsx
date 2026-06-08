import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MailboxesTabProps {
  mailboxes: any[];
}

export default function MailboxesTab({ mailboxes }: MailboxesTabProps) {
  if (!mailboxes || mailboxes.length === 0) {
    return <div className="text-sm text-muted-foreground">No mailboxes available.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mailboxes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {mailboxes.map((mb) => (
          <div key={mb.id} className="flex justify-between items-center">
            <span className="text-muted-foreground">{mb.email}</span>
            {mb.isPrimary && <Badge variant="secondary">Primary</Badge>}
            {mb.provider && <Badge variant="outline">{mb.provider}</Badge>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
