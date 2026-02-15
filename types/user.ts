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
