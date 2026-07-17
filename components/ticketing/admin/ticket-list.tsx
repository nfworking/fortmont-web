import * as React from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { TicketCard } from './ticket-card';
import { Ticket } from './ticket';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PriorityBadge } from './priority-badge';
import { StatusBadge } from './status-badge';
import { TypeBadge } from './type-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TicketListProps {
  tickets: Ticket[];
  isLoading?: boolean;
  viewMode?: 'list' | 'grid';
  onTicketClick?: (ticket: Ticket) => void;
  onQuickUpdate?: (ticket: Ticket, updates: Partial<Ticket>) => void;
}

type SortKey = 'priority' | 'status' | 'subject' | 'department' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const priorityWeight = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const statusWeight: Record<string, number> = {
  open: 5,
  pending: 4,
  in_progress: 3,
  resolved: 2,
  closed: 1,
};

function normalizeStatus(status: Ticket['status']) {
  return (status ?? 'open').toLowerCase();
}

function personName(person: Ticket['createdBy'] | Ticket['assignedTo'], fallback: string) {
  return person?.displayName ?? person?.email ?? fallback;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function TicketSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3 mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SortButton({
  sortKey,
  activeKey,
  direction,
  children,
  onSort,
}: {
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  children: React.ReactNode;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === sortKey;
  const Icon = !isActive ? ArrowUpDown : direction === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-7 px-2 text-xs font-medium text-muted-foreground"
      onClick={() => onSort(sortKey)}
    >
      {children}
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}

function compareTickets(a: Ticket, b: Ticket, key: SortKey) {
  if (key === 'priority') {
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  }

  if (key === 'status') {
    return (statusWeight[normalizeStatus(a.status)] ?? 0) - (statusWeight[normalizeStatus(b.status)] ?? 0);
  }

  if (key === 'createdAt' || key === 'updatedAt') {
    return new Date(a[key]).getTime() - new Date(b[key]).getTime();
  }

  return String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
}

function TicketActions({
  ticket,
  onQuickUpdate,
}: {
  ticket: Ticket;
  onQuickUpdate?: (ticket: Ticket, updates: Partial<Ticket>) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ticket actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'in_progress' })}>
          <PlayCircle className="h-4 w-4" />
          Mark in progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'pending' })}>
          <Clock className="h-4 w-4" />
          Mark pending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'resolved' })}>
          <CheckCircle2 className="h-4 w-4" />
          Resolve
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onQuickUpdate?.(ticket, { status: 'closed' })}>
          <XCircle className="h-4 w-4" />
          Close
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TicketList({
  tickets,
  isLoading,
  viewMode = 'list',
  onTicketClick,
  onQuickUpdate,
}: TicketListProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  const sortedTickets = React.useMemo(() => {
    return [...tickets].sort((a, b) => {
      const result = compareTickets(a, b, sortKey);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [sortDirection, sortKey, tickets]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'createdAt' || key === 'updatedAt' || key === 'priority' ? 'desc' : 'asc');
  };

  if (isLoading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <TicketSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No tickets found</p>
        <p className="text-sm">There are no tickets matching your filters.</p>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid gap-3 xl:grid-cols-2">
        {sortedTickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onClick={onTicketClick}
            onQuickUpdate={onQuickUpdate}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-card/80 backdrop-blur-lg border border-border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/20 transition-colors rounded-md">
            <TableHead className="w-[108px]">
              <SortButton sortKey="priority" activeKey={sortKey} direction={sortDirection} onSort={handleSort}>
                Priority
              </SortButton>
            </TableHead>
            <TableHead className="w-[128px]">
              <SortButton sortKey="status" activeKey={sortKey} direction={sortDirection} onSort={handleSort}>
                Status
              </SortButton>
            </TableHead>
            <TableHead>
              <SortButton sortKey="subject" activeKey={sortKey} direction={sortDirection} onSort={handleSort}>
                Ticket
              </SortButton>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <SortButton sortKey="department" activeKey={sortKey} direction={sortDirection} onSort={handleSort}>
                Department
              </SortButton>
            </TableHead>
            <TableHead className="hidden xl:table-cell">Creator</TableHead>
            <TableHead className="hidden md:table-cell">Assignee</TableHead>
            <TableHead className="hidden lg:table-cell">
              <SortButton sortKey="createdAt" activeKey={sortKey} direction={sortDirection} onSort={handleSort}>
                Created
              </SortButton>
            </TableHead>
            <TableHead className="hidden xl:table-cell">
              <SortButton sortKey="updatedAt" activeKey={sortKey} direction={sortDirection} onSort={handleSort}>
                Updated
              </SortButton>
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTickets.map((ticket) => {
            const assigneeName = personName(ticket.assignedTo, 'Unassigned');
            const creatorName = personName(ticket.createdBy, 'Unknown');
            const createdAgo = formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });

            return (
              <TableRow
                key={ticket.id}
                className="cursor-pointer"
                onClick={() => onTicketClick?.(ticket)}
              >
                <TableCell>
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={ticket.status} />
                </TableCell>
                <TableCell className="min-w-[280px] max-w-[420px] whitespace-normal py-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{ticket.subject}</span>
                      <TypeBadge type={ticket.type} />
                    </div>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {ticket.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{ticket.department}</TableCell>
                <TableCell className="hidden xl:table-cell">{creatorName}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <Avatar className={cn('h-7 w-7', !ticket.assignedTo && 'opacity-60')}>
                      {ticket.assignedTo?.avatarUrl && (
                        <AvatarImage src={ticket.assignedTo.avatarUrl} alt={assigneeName} />
                      )}
                      <AvatarFallback>{initials(assigneeName)}</AvatarFallback>
                    </Avatar>
                    <span className={cn('max-w-32 truncate text-sm', !ticket.assignedTo && 'text-muted-foreground')}>
                      {assigneeName}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  <span title={format(new Date(ticket.createdAt), 'PPpp')}>{createdAgo}</span>
                </TableCell>
                <TableCell className="hidden xl:table-cell text-muted-foreground">
                  <span title={format(new Date(ticket.updatedAt), 'PPpp')}>
                    {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                  </span>
                </TableCell>
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <TicketActions ticket={ticket} onQuickUpdate={onQuickUpdate} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
