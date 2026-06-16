'use client';
import * as React from 'react';
import { format } from 'date-fns';
import { LayoutGrid, List, Loader2, MessageSquare, Plus, RefreshCw, Send, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { StatsCards } from './stats-cards';
import { TicketList } from './ticket-list';
import { TicketFilters, FilterState } from './ticket-filters';
import { Comment, Ticket, TicketPriority, TicketStatus, User } from './ticket';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PriorityBadge } from './priority-badge';
import { StatusBadge } from './status-badge';
import { TypeBadge } from './type-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TicketDashboardProps {
  tickets?: Ticket[];
  users?: User[];
}

const statuses: TicketStatus[] = ['open', 'in_progress', 'pending', 'resolved', 'closed'];
const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const ticketTypes = ['Incident', 'Universal', 'Service Request', 'Change Request', 'Problem'];
const departmentOptions = [
  'IAM',
  'Infrastructure',
  'Services',
  'Remote Access & Networking',
  'General',
];

type CreateTicketFormState = {
  type: string;
  department: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdById: string;
  assignedToId: string;
};

const initialCreateTicketForm: CreateTicketFormState = {
  type: 'Incident',
  department: 'General',
  subject: '',
  description: '',
  priority: 'MEDIUM',
  status: 'open',
  createdById: 'unassigned',
  assignedToId: 'unassigned',
};

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

function calculateStats(tickets: Ticket[]) {
  return {
    total: tickets.length,
    open: tickets.filter((t) => normalizeStatus(t.status) === 'open').length,
    unassigned: tickets.filter((t) => !t.assignedToId).length,
    inProgress: tickets.filter((t) => normalizeStatus(t.status) === 'in_progress').length,
    resolved: tickets.filter((t) => ['resolved', 'closed'].includes(normalizeStatus(t.status))).length,
    urgent: tickets.filter((t) => t.priority === 'URGENT').length,
  };
}

function getAvailableUsers(tickets: Ticket[]) {
  const users = new Map<string, User>();

  for (const ticket of tickets) {
    if (ticket.createdBy) users.set(ticket.createdBy.id, ticket.createdBy);
    if (ticket.assignedTo) users.set(ticket.assignedTo.id, ticket.assignedTo);
  }

  return Array.from(users.values()).sort((a, b) =>
    displayName(a, '').localeCompare(displayName(b, ''))
  );
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
    [comments]
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

function TicketDetailSheet({
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
          <SheetDescription>
            {ticket.department}
          </SheetDescription>
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

function CreateTicketDialog({
  open,
  users,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  users: User[];
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (form: CreateTicketFormState) => Promise<void>;
}) {
  const [form, setForm] = React.useState<CreateTicketFormState>(initialCreateTicketForm);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setForm(initialCreateTicketForm);
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const updateForm = <Key extends keyof CreateTicketFormState>(
    key: Key,
    value: CreateTicketFormState[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.description.trim()) {
      setError('Subject and description are required.');
      return;
    }

    try {
      setError(null);
      await onSubmit({
        ...form,
        subject: form.subject.trim(),
        description: form.description.trim(),
      });
      setForm(initialCreateTicketForm);
      setError(null);
    } catch (error) {
      console.error(error);
      setError('Ticket could not be created. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto border-white/10 bg-black text-white sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="pr-8">
            <DialogTitle>Create ticket</DialogTitle>
            <DialogDescription>
              Add a ticket directly to the admin queue for triage and assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket-type">Type</Label>
              <Select value={form.type} onValueChange={(value) => updateForm('type', value)}>
                <SelectTrigger id="ticket-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-department">Department</Label>
              <Select
                value={form.department}
                onValueChange={(value) => updateForm('department', value)}
              >
                <SelectTrigger id="ticket-department" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => updateForm('priority', value as TicketPriority)}
              >
                <SelectTrigger id="ticket-priority" className="w-full">
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

            <div className="space-y-2">
              <Label htmlFor="ticket-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateForm('status', value as TicketStatus)}
              >
                <SelectTrigger id="ticket-status" className="w-full">
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

            <div className="space-y-2">
              <Label htmlFor="ticket-created-by">Created by</Label>
              <Select
                value={form.createdById}
                onValueChange={(value) => updateForm('createdById', value)}
              >
                <SelectTrigger id="ticket-created-by" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unknown creator</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {displayName(user, 'Unknown user')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-assigned-to">Assigned to</Label>
              <Select
                value={form.assignedToId}
                onValueChange={(value) => updateForm('assignedToId', value)}
              >
                <SelectTrigger id="ticket-assigned-to" className="w-full">
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

          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>
            <Input
              id="ticket-subject"
              value={form.subject}
              onChange={(event) => updateForm('subject', event.target.value)}
              placeholder="Brief summary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={form.description}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="What happened, who is impacted, and any useful context."
              className="min-h-32"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TicketDashboard({ tickets = [], users: initialUsers = [] }: TicketDashboardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = React.useState(false);
  const [ticketRows, setTicketRows] = React.useState<Ticket[]>(tickets);
  const [filters, setFilters] = React.useState<FilterState>({
    search: '',
    priority: 'All Priorities',
    department: 'All Departments',
    type: 'All Types',
    status: 'All Statuses',
  });
  const [activeTab, setActiveTab] = React.useState('all');
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);

  const stats = React.useMemo(() => calculateStats(ticketRows), [ticketRows]);
  const users = React.useMemo(() => {
    const mergedUsers = new Map<string, User>();

    for (const user of initialUsers) {
      mergedUsers.set(user.id, user);
    }

    for (const user of getAvailableUsers(ticketRows)) {
      mergedUsers.set(user.id, user);
    }

    return Array.from(mergedUsers.values()).sort((a, b) =>
      displayName(a, '').localeCompare(displayName(b, ''))
    );
  }, [initialUsers, ticketRows]);
  
  const selectedTicket = React.useMemo(
    () => ticketRows.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [selectedTicketId, ticketRows]
  );

  // 🔥 REAL-TIME NOTIFICATIONS EFFECT HOOK
  // 🔥 REAL-TIME NOTIFICATIONS EFFECT HOOK
  React.useEffect(() => {
    if (!selectedTicketId) return;

    // Open connection to the dynamic streaming server endpoint
    const eventSource = new EventSource(`/api/ticketing/stream/tickets/${selectedTicketId}/stream`);

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        // Ignore the initial server pipeline verification packet
        if (parsedData?.status === 'connected') {
          console.log('Real-time notification pipeline connected successfully.');
          return;
        }

        const newComment: Comment = parsedData;

        setTicketRows((currentRows) =>
          currentRows.map((row) => {
            if (row.id !== selectedTicketId) return row;

            // Safeguard against duplicate comments if the current user authored it
            const commentExists = row.comments?.some((c) => c.id === newComment.id);
            if (commentExists) return row;

            return {
              ...row,
              comments: [...(row.comments ?? []), newComment],
            };
          })
        );
      } catch (err) {
        console.error('Failed to parse incoming streaming comment payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      // Browsers naturally drop and reconnect streams during inactive tabs.
      // This log becomes a warning instead of a fatal terminal sequence.
      console.warn('Real-time connection dropped. Retrying sync pipeline background loop...', err);
    };

    // Clean up connection instantly when shifting tickets or closing details panel
    return () => {
      eventSource.close();
    };
  }, [selectedTicketId]);

  const filteredTickets = React.useMemo(() => {
    let result = [...ticketRows];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((t) => {
        const creatorName = displayName(t.createdBy, '').toLowerCase();
        const assigneeName = displayName(t.assignedTo, '').toLowerCase();

        return (
          t.subject.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.department.toLowerCase().includes(searchLower) ||
          t.type.toLowerCase().includes(searchLower) ||
          creatorName.includes(searchLower) ||
          assigneeName.includes(searchLower)
        );
      });
    }

    if (filters.priority !== 'All Priorities') {
      result = result.filter((t) => t.priority === filters.priority);
    }

    if (filters.department !== 'All Departments') {
      result = result.filter((t) => t.department === filters.department);
    }

    if (filters.type !== 'All Types') {
      result = result.filter((t) => t.type === filters.type);
    }

    if (filters.status !== 'All Statuses') {
      result = result.filter((t) => normalizeStatus(t.status) === filters.status);
    }

    if (activeTab !== 'all') {
      result = result.filter((t) => {
        const status = normalizeStatus(t.status);
        if (activeTab === 'resolved') return status === 'resolved' || status === 'closed';
        if (activeTab === 'unassigned') return !t.assignedToId;
        return status === activeTab;
      });
    }

    return result;
  }, [activeTab, filters, ticketRows]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ticketing/get/ticket?refresh=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error(`Refresh failed with ${res.status}`);
      const refreshedTickets = await res.json();
      setTicketRows(refreshedTickets);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketUpdate = async (ticket: Ticket, updates: Partial<Ticket>) => {
    const previousRows = ticketRows;
    const nextRows = ticketRows.map((row) => {
      if (row.id !== ticket.id) return row;

      const assignedTo =
        updates.assignedToId === undefined
          ? row.assignedTo
          : users.find((user) => user.id === updates.assignedToId) ?? null;

      return {
        ...row,
        ...updates,
        assignedTo,
        updatedAt: new Date().toISOString(),
      };
    });

    setTicketRows(nextRows.filter((row) => normalizeStatus(row.status) !== 'closed'));

    try {
      const res = await fetch(`/api/ticketing/patch/ticket/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error(`Update failed with ${res.status}`);

      const updatedTicket = await res.json();
      setTicketRows((currentRows) =>
        normalizeStatus(updatedTicket.status) === 'closed'
          ? currentRows.filter((row) => row.id !== updatedTicket.id)
          : currentRows.map((row) => (row.id === updatedTicket.id ? updatedTicket : row))
      );
    } catch (error) {
      console.error(error);
      setTicketRows(previousRows);
    }
  };

  const handleAddComment = async (ticket: Ticket, text: string) => {
    setIsSubmittingComment(true);

    try {
      const res = await fetch(`/api/ticketing/post/ticket/${ticket.id}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`Comment failed with ${res.status}`);

      const newComment: Comment = await res.json();
      
      setTicketRows((currentRows) =>
        currentRows.map((row) => {
          if (row.id !== ticket.id) return row;

          // 🔥 FIX: Prevent adding the comment if the Redis stream beat the fetch request to the state
          const commentExists = row.comments?.some((c) => c.id === newComment.id);
          if (commentExists) return row;

          return { 
            ...row, 
            comments: [...(row.comments ?? []), newComment] 
          };
        })
      );
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleTicketCreate = async (form: CreateTicketFormState) => {
    setIsCreatingTicket(true);

    try {
      const res = await fetch('/api/ticketing/post/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          department: form.department,
          subject: form.subject,
          description: form.description,
          priority: form.priority,
          status: form.status,
          createdById: form.createdById === 'unassigned' ? null : form.createdById,
          assignedToId: form.assignedToId === 'unassigned' ? null : form.assignedToId,
        }),
      });

      if (!res.ok) throw new Error(`Create failed with ${res.status}`);

      setIsCreateDialogOpen(false);
      await handleRefresh();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setIsCreatingTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ticket Queue</h1>
            <p className="text-muted-foreground mt-1">
              Triage, assign, and resolve support requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              Refresh
            </Button>
            <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <StatsCards stats={stats} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="max-w-full overflow-x-auto bg-muted/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="unassigned">
                <UserRound className="h-4 w-4" />
                Unassigned
              </TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                title="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                title="Card view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TicketFilters tickets={ticketRows} onFilterChange={setFilters} />

          <TabsContent value={activeTab} forceMount>
            <TicketList
              tickets={filteredTickets}
              isLoading={isLoading}
              viewMode={viewMode}
              onTicketClick={(ticket) => setSelectedTicketId(ticket.id)}
              onQuickUpdate={handleTicketUpdate}
            />
          </TabsContent>
        </Tabs>
      </div>

      <TicketDetailSheet
        ticket={selectedTicket}
        users={users}
        isSubmittingComment={isSubmittingComment}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null);
        }}
        onUpdate={handleTicketUpdate}
        onAddComment={handleAddComment}
      />
      <CreateTicketDialog
        open={isCreateDialogOpen}
        users={users}
        isSubmitting={isCreatingTicket}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleTicketCreate}
      />
    </div>
  );
}