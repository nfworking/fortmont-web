export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: string | null;
  avatarUrl: string;
  phone: string;
  isEntraUser: boolean;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  onboarded: boolean;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  type: string;
  department: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdById: string;
  assignedToId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignedTo: User;
}
