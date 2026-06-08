import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DetailRow from "@/components/common/DetailRow";

interface SettingsTabProps {
  user: any;
}

export default function SettingsTab({ user }: SettingsTabProps) {
  if (!user) {
    return <div className="text-sm text-muted-foreground">User not found.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Reuse existing AccountSettingsForm component */}
        <AccountSettingsForm
          user={{
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            phone: user.phone,
            avatarUrl: user.avatarUrl,
          }}
          hasMailbox={!!(user.mailboxes?.length)}
        />
      </CardContent>
    </Card>
  );
}

// Note: AccountSettingsForm is imported from the existing file
import AccountSettingsForm from "@/components/account-settings-form";
