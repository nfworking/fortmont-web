export interface User {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role?: string | null;
  avatarUrl?: string | null;
  phone: string | null;
  isEntraUser: boolean | null;
  passwordHash?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  onboarded: boolean | null;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';

export interface Comment {
  id: string;
  text: string;
  ticketId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: User | null;
}

export interface Ticket {
  id: string;
  type: string;
  department: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus | string | null;
  createdById: string | null;
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: User | null;
  assignedTo: User | null;
  comments?: Comment[];
}
