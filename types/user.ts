export type UserRole =
  | 'buyer'
  | 'agent'
  | 'broker'
  | 'constructora'
  | 'master_admin';

export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

export type PropertyPurpose = 'Residential' | 'Investment' | 'Airbnb';

export interface BuyerCriteria {
  location?: string; // city/sector
  budgetMin?: number;
  budgetMax?: number;
  bedrooms?: number;
  purpose?: PropertyPurpose;
  minMt2?: number;
  amenities?: string[];
  projectOnly?: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;

  brokerageId?: string; // agent belongs to brokerage
  verificationStatus: VerificationStatus;

  createdAt: Date;
  updatedAt: Date;
}

// Role-specific profiles
export interface BrokerProfile extends User {
  role: 'broker';
  company: string;
  phone?: string;
  agents?: string[]; // agent IDs
  verified?: boolean;
}

export interface AgentProfile extends User {
  role: 'agent';
  phone?: string;
  brokerageId: string; // required for agents
  verified?: boolean;
  listings?: string[];
}

export interface ConstructoraProfile extends User {
  role: 'constructora';
  company: string;
  contactPerson?: string;
  phone?: string;
  verified?: boolean;
  projects?: string[]; // project IDs
}

export interface BuyerProfile extends User {
  role: 'buyer';
  phone?: string;
  criteria?: BuyerCriteria;
  savedProperties?: string[];
}
