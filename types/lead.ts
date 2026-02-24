export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'closed'
  | 'lost';

export interface Lead {
  id: string;

  listingId: string;
  buyerId: string;
  assignedToId: string; // agent

  status: LeadStatus;

  createdAt: Date;
  updatedAt: Date;
}
