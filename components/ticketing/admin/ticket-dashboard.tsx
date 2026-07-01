'use client';

import * as React from 'react';
import { LayoutGrid, List, Plus, RefreshCw, UserRound } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CreateTicketDialog, CreateTicketFormState } from "@/components/ticketing/admin/create-ticket";

import { StatsCards } from './stats-cards';
import { TicketList } from './ticket-list';
import { TicketFilters, FilterState } from './ticket-filters';
import { Ticket, User, Comment } from './ticket'; // 🔥 FIXED: Added explicit Comment import
import { TicketDetailSheet } from './ticket-detail-sheet';

interface TicketDashboardProps {
  tickets?: Ticket[];
  users?: User[];
}

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Listen for changes in the URL query parameters
  React.useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsCreateDialogOpen(true);
      
      const params = new URLSearchParams(searchParams.toString());
      params.delete('new');
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router, pathname]);

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

  React.useEffect(() => {
    if (!selectedTicketId) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;

      eventSource = new EventSource(`/api/ticketing/stream/tickets/${selectedTicketId}/stream`);

      eventSource.onopen = () => {
        attempt = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);

          if (parsedData?.status === 'connected') {
            return;
          }

          const newComment: Comment = parsedData;

          setTicketRows((currentRows) =>
            currentRows.map((row) => {
              if (row.id !== selectedTicketId) return row;

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

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (cancelled) return;

        attempt += 1;
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
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

  const handleRefresh = React.useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) setIsLoading(true);

    try {
      const res = await fetch(`/api/ticketing/get/ticket?refresh=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include',
        headers: { 
          'Cache-Control': 'no-cache' 
        },
      });
      
      if (!res.ok) throw new Error(`Refresh failed with ${res.status}`);
      const refreshedTickets = await res.json();
      setTicketRows(refreshedTickets);
    } catch (error) {
      console.error('Ticket refresh failed:', error);
      if (!silent) throw error;
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const POLL_INTERVAL_MS = 5000;

  React.useEffect(() => {
    const intervalId = setInterval(() => {
      if (isSubmittingComment) return;
      handleRefresh({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isSubmittingComment, handleRefresh]);

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
    <div className="min-h-screen bg-transparent transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ticket Queue</h1>
            <p className="text-muted-foreground mt-1">
              Triage, assign, and resolve support requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleRefresh()} disabled={isLoading}>
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