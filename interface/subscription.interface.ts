export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'suspended' | 'trial';
export type BillingCycle = 'monthly' | 'yearly';

export interface SubscriptionDetails {
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string;
  endDate: string | null;
  maxStudents: number | null;
  maxTeachers: number | null;
  maxClassrooms: number | null;
  pricePaid?: number;
}

export interface UsageDetails {
  students: number;
  teachers: number;
  classrooms: number;
}

export interface ToolSub {
  tool: { name: string; code: string };
  status: string;
  endDate?: string | null;
}

export interface SubscriptionSummary {
  subscription: SubscriptionDetails;
  usage: UsageDetails;
  isActive: boolean;
  daysUntilExpiry: number | null;
  tools: ToolSub[];
}
