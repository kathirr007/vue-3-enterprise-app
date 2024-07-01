export interface Subscription {
  subscriptionStatus: boolean;
  publishable_key?: string;
  pricing_table_id?: string;
  owner_email?: string;
  url?: string;
}

export interface CustomerDetails {
  onTrial: boolean;
  subscriptionEndDate: string;
  limit?: number;
  contractual_user_limit?: number;
  currentPlanId?: planId;
  subscriptionStatus?: boolean;
  resourceLimits?: any;
  planPermission?: any;
  enableAddOn?: boolean;
  interval?: string;
}

export type planId =
  | 'FREEMIUM'
  | 'STARTER'
  | 'VALUE'
  | 'GROWTH'
  | 'ENTERPRISE'
  | 'CONTRACTUAL_TEAM';

export interface PricingConfiguration {
  YEARLY: {
    amount: number;
    priceId: string;
  };
  TWO_YEARLY?: {
    amount: number;
    priceId: string;
  };
  THREE_YEARLY?: {
    amount: number;
    priceId: string;
  };
  MONTHLY?: {
    amount: number;
    priceId: string;
  };
}

export interface Plan {
  id: planId;
  name: string;
  description?: string;
  stripePlanId?: string | null;
  permissions?: any;
  isAddOn?: boolean;
  enableQuantityUpdate?: boolean;
  pricingConfiguration?: PricingConfiguration;
  summary?: any;
  tag?: string[];
  order: number;
}

export interface Pricing {
  title?: string;
  year?: number;
  amount?: number;
  priceId?: string;
}

export interface SessionPayload {
  priceId?: string;
  quantity?: number;
}

export enum ResourceType {
  'team member' = 'TEAM_MEMBER',
  'client' = 'CLIENT',
  'project' = 'PROJECT',
  'document management' = 'DOCUMENT_MANAGEMENT',
  'data extraction' = 'DATA_EXTRACTION',
  'smart folder' = 'SMART_FOLDER',
  'invoicing' = 'INVOICING',
  'webform request' = 'WEBFORM_REQUEST',
  'webform contract' = 'WEBFORM_CONTRACT',
  'bulk email' = 'BULK_EMAIL'
};
