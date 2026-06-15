import { TicketCard } from './ticket-card';
import { Ticket } from './ticket';
import { Skeleton } from '@/components/ui/skeleton';

interface TicketListProps {
  tickets: Ticket[];
  isLoading?: boolean;
  onTicketClick?: (ticket: Ticket) => void;
}

function TicketSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
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
        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TicketList({ tickets, isLoading, onTicketClick }: TicketListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <TicketSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No tickets found</p>
        <p className="text-sm">There are no tickets matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          onClick={onTicketClick}
        />
      ))}
    </div>
  );
}
