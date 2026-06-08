import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DetailRow from "@/components/common/DetailRow";

interface ProfileTabProps {
  user: any;
  formatDate: (date: Date) => string;
}

export default function ProfileTab({ user, formatDate }: ProfileTabProps) {
  if (!user) {
    return <div className="text-sm text-muted-foreground">User data not available.</div>;
  }

  const initials = (
    user.displayName?.[0] ?? "U"
  ).toUpperCase();

  return (
    <Card>
      <CardHeader className="flex flex-col items-center space-y-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={user.avatarUrl ?? undefined} alt={user.displayName ?? "User"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl font-semibold">{user.displayName ?? user.username}</CardTitle>
        <CardDescription className="text-muted-foreground">{user.email}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <DetailRow label="Phone" value={user.phone ?? "Not set"} />
        <DetailRow label="Role" value={user.role ?? "Not set"} />
        <DetailRow label="Status" value={user.isActive ? "Active" : "Pending"} />
        <DetailRow label="Created" value={formatDate(user.createdAt)} />
        <DetailRow label="Updated" value={formatDate(user.updatedAt)} />
      </CardContent>
    </Card>
  );
}
