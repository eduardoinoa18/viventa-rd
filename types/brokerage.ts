export interface Brokerage {
  id: string;
  name: string;
  slug: string;
  ownerId: string; // broker

  isVerified: boolean;

  createdAt: Date;
}
