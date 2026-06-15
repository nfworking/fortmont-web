'use client';
import * as React from 'react';
import { Plus, RefreshCw, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/theme-toggle';
import { StatsCards } from './stats-cards';
import { TicketList } from './ticket-list';
import { TicketFilters, FilterState } from './ticket-filters';
import { Ticket } from './ticket';

interface TicketDashboardProps {
  tickets?: Ticket[];
}

function calculateStats(tickets: Ticket[]) {
  return {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    critical: tickets.filter((t) => t.priority === 'CRITICAL').length,
  };
}

export function TicketDashboard({ tickets = [] }: TicketDashboardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [filteredTickets, setFilteredTickets] = React.useState<Ticket[]>(tickets);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');

  const stats = React.useMemo(() => calculateStats(tickets), [tickets]);

  const handleFilterChange = (filters: FilterState) => {
    let result = [...tickets];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.department.toLowerCase().includes(searchLower) ||
          t.createdBy.displayName.toLowerCase().includes(searchLower)
      );
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
      result = result.filter((t) => t.status === filters.status);
    }

    setFilteredTickets(result);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleTicketClick = (ticket: Ticket) => {
    console.log('Ticket clicked:', ticket);
  };

  React.useEffect(() => {
    setFilteredTickets(tickets);
  }, [tickets]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Tickets</h1>
            <p className="text-muted-foreground mt-1">
              Manage and track your support requests
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <StatsCards stats={stats} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="data-[state=active]:bg-background">
                All Tickets
              </TabsTrigger>
              <TabsTrigger value="open" className="data-[state=active]:bg-background">
                Open
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="data-[state=active]:bg-background">
                In Progress
              </TabsTrigger>
              <TabsTrigger value="resolved" className="data-[state=active]:bg-background">
                Resolved
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            <TicketFilters onFilterChange={handleFilterChange} />
            <TicketList
              tickets={filteredTickets}
              isLoading={isLoading}
              onTicketClick={handleTicketClick}
            />
          </TabsContent>

          <TabsContent value="open" className="space-y-6">
            <TicketFilters onFilterChange={handleFilterChange} />
            <TicketList
              tickets={filteredTickets.filter((t) => t.status === 'open')}
              isLoading={isLoading}
              onTicketClick={handleTicketClick}
            />
          </TabsContent>

          <TabsContent value="in_progress" className="space-y-6">
            <TicketFilters onFilterChange={handleFilterChange} />
            <TicketList
              tickets={filteredTickets.filter((t) => t.status === 'in_progress')}
              isLoading={isLoading}
              onTicketClick={handleTicketClick}
            />
          </TabsContent>

          <TabsContent value="resolved" className="space-y-6">
            <TicketFilters onFilterChange={handleFilterChange} />
            <TicketList
              tickets={filteredTickets.filter((t) => t.status === 'resolved' || t.status === 'closed')}
              isLoading={isLoading}
              onTicketClick={handleTicketClick}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
