'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { PriorityBadge } from './priority-badge';
import { StatusBadge } from './status-badge';
import { TypeBadge } from './type-badge';
import { Comment, Ticket, TicketPriority, TicketStatus, User } from './ticket';

const statuses: TicketStatus[] = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function normalizeStatus(status: Ticket['status']) {
  return (status ?? 'open').toLowerCase();
}

function statusLabel(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function displayName(user: User | null | undefined, fallback: string) {
  return user?.displayName ?? user?.email ?? fallback;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[112px_1fr] items-start gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="min-w-0 text-foreground">{value}</div>
    </div>
  );
}

function UserSummary({ user, fallback }: { user: User | null; fallback: string }) {
  const name = displayName(user, fallback);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className={cn('h-8 w-8', !user && 'opacity-60')}>
        {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={name} />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{name}</p>
        {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
      </div>
    </div>
  );
}

function formatCommentTime(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return format(date, 'PP');
}

function CommentItem({ comment, users }: { comment: Comment; users: User[] }) {
  const resolvedAuthor = comment.author ?? users.find((user) => user.id === comment.authorId) ?? null;
  const name = displayName(resolvedAuthor, 'Unknown user');

  return (
    <div className="flex gap-2.5">
      <Avatar className={cn('h-8 w-8 shrink-0', !resolvedAuthor && 'opacity-60')}>
        {resolvedAuthor?.avatarUrl && <AvatarImage src={resolvedAuthor.avatarUrl} alt={name} />}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatCommentTime(comment.createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-2.5 text-sm leading-6">
          {comment.text}
        </p>
      </div>
    </div>
  );
}

function CommentsSection({
  ticket,
  users,
  isSubmitting,
  onAddComment,
}: {
  ticket: Ticket;
  users: User[];
  isSubmitting: boolean;
  onAddComment: (ticket: Ticket, text: string) => Promise<void>;
}) {
  const [draft, setDraft] = React.useState('');
  const comments = ticket.comments ?? [];
  const sortedComments = React.useMemo(
    () => [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [comments],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    await onAddComment(ticket, text);
    setDraft('');
  };

  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-1.5 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Comments
        {sortedComments.length > 0 && (
          <span className="text-xs font-normal text-muted-foreground">({sortedComments.length})</span>
        )}
      </h3>

      {sortedComments.length > 0 ? (
        <div className="space-y-4">
          {sortedComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} users={users} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment..."
          className="min-h-10 flex-1 resize-none"
          disabled={isSubmitting}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
        />
        <Button type="submit" size="icon" disabled={isSubmitting || !draft.trim()}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}

export function TicketDetailSheet({
  ticket,
  users,
  isSubmittingComment,
  onOpenChange,
  onUpdate,
  onAddComment,
}: {
  ticket: Ticket | null;
  users: User[];
  isSubmittingComment: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (ticket: Ticket, updates: Partial<Ticket>) => void;
  onAddComment: (ticket: Ticket, text: string) => Promise<void>;
}) {
  if (!ticket) {
    return null;
  }

  return (
    <Sheet open={Boolean(ticket)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2 pr-8">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <TypeBadge type={ticket.type} />
          </div>
          <SheetTitle className="text-xl">{ticket.subject}</SheetTitle>
          <SheetDescription>{ticket.department}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          <section className="space-y-3">
            <h3 className="text-sm font-medium">Triage</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Status</span>
                <Select
                  value={normalizeStatus(ticket.status)}
                  onValueChange={(value) => onUpdate(ticket, { status: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {statusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Priority</span>
                <Select
                  value={ticket.priority}
                  onValueChange={(value) => onUpdate(ticket, { priority: value as TicketPriority })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Assignee</span>
                <Select
                  value={ticket.assignedToId ?? 'unassigned'}
                  onValueChange={(value) =>
                    onUpdate(ticket, { assignedToId: value === 'unassigned' ? null : value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {displayName(user, 'Unknown user')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Description</h3>
            <p className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-3 text-sm leading-6">
              {ticket.description}
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium">People</h3>
            <DetailRow label="Created by" value={<UserSummary user={ticket.createdBy} fallback="Unknown creator" />} />
            <DetailRow label="Assigned to" value={<UserSummary user={ticket.assignedTo} fallback="Unassigned" />} />
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Timeline</h3>
            <DetailRow label="Created" value={format(new Date(ticket.createdAt), 'PPpp')} />
            <DetailRow label="Updated" value={format(new Date(ticket.updatedAt), 'PPpp')} />
            <DetailRow label="Ticket ID" value={<span className="font-mono text-xs">{ticket.id}</span>} />
          </section>

          <Separator />

          <CommentsSection
            ticket={ticket}
            users={users}
            isSubmitting={isSubmittingComment}
            onAddComment={onAddComment}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}