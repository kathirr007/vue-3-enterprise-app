import { object, string } from 'yup';
import type { InferType } from 'yup';

import type { EntityObj } from '@/types/common.type';

export type IntegrationId =
  | 'QUICKBOOKS'
  | 'CALENDLY'
  | 'XERO'
  | 'PAYPAL'
  | 'HRMS'
  | 'ESIGN'
  | 'SMART_FOLDER'
  | 'DOCUMENTS'
  | 'WORK'
  | 'TEAM'
  | 'CLIENT_PORTAL'
  | 'BROADCASTS'
  | 'CLIENT'
  | 'DATA_EXTRACTION'
  | 'BRIGHTDESK'
  | 'CLIENT_BILLING'
  | 'STRIPE'
  | 'LAWYER'
  | 'ACCOUNTING'
  | 'BUSINESS'
  | 'REAL_ESTATE_AGENCIES'
  | 'EDUCATIONAL_CENTERS'
  | 'WELLNESS_&_FITNESS_CENTER'
  | 'EVENT_MANAGEMENT_COMPANIES'
  | 'PROPERTY_MANAGEMENT'
  | 'INSURANCE_AGENCY'
  | 'HOME_SERVICES'
  | 'FULL_SERVICE_ACCOUNTING_FIRMS'
  | 'TAX_ACCOUNTING_FIRMS'
  | 'BOOKKEEPING_FIRMS'
  | 'AUDIT_AND_ASSURANCE_FIRMS'
  | 'FORENSIC_ACCOUNTING_FIRMS'
  | 'CONSULTING_FIRMS'
  | 'VIRTUAL_ONLINE_ACCOUNTING_FIRMS'
  | 'SMALL_BUSINESS_ACCOUNTING_FIRMS'
  | 'CORPORATE_LAW_FIRMS'
  | 'LITIGATION_LAW_FIRMS'
  | 'INTELLECTUAL_PROPERTY_LAW_FIRMS'
  | 'FAMILY_LAW_FIRMS'
  | 'CRIMINAL_DEFENSE_LAW_FIRMS'
  | 'IMMIGRATION_LAW_FIRMS'
  | 'REQUEST_AND_CONTRACT'
  | 'KNOWLEDGE_BOT'
  | 'OTHER_ACCOUNTING'
  | 'OTHER_BUSINESS'
  | 'OTHER_LAWYER'
  | 'OTHER';

export type OrgCategoryId = 'LAWYER'
  | 'ACCOUNTING'
  | 'BUSINESS';

export type IntegrationIcon = {
  [key in IntegrationId]: {
    type: 'icon' | 'iconify' | 'primevue' | 'image' | 'avatar' | 'svg';
    iconClass?: string;
    value: string;
  };
};

export interface Integration {
  id: IntegrationId;
  name: string;
  isActive: boolean;
  isExternal: boolean;
  isAiModule: boolean;
  picture: string;
  scope: string[];
  isCompleted?: boolean;
  description?: string;
  data?: {
    [key: string]: any;
  };
  isCardSelected?: boolean;
  isCardNotSelectable?: boolean;
}
export const calendlySchema = object({
  url: string()
    .url()
    .matches(
      /^https:\/\/calendly\.com\/[^\s]*$/,
      'Please enter a valid URL in the format https://calendly.com/user_id'
    )
    .required()
    .label('Calendly URL')
});

export type CalendlyPayload = InferType<typeof calendlySchema>;
export type CalendlyResponse = CalendlyPayload;

export interface IntegrationsData {
  allIntegrations: Integration[];
  recommendedIntegrations: Integration[];
}

export const paypalSchema = object({
  clientId: string().required().label('Client Id'),
  clientSecret: string().required().label('Client Secret')
});

export const stripeSchema = object({
  apiKey: string().required().label('Stripe Key')
});

export type PaypalPayload = InferType<typeof paypalSchema>;

export type StripePayload = InferType<typeof stripeSchema>;

export interface IntegrationStep {
  id: string;
  name: string;
  route?: string;
}
export interface OrgIntegrationStep {
  id: string;
  status: 0 | 1 | 2;
  step: IntegrationStep;
}

export interface QuickStartIntegration {
  id: string;
  name?: string;
  description?: string;
  steps: IntegrationStep[];
}

export interface OrgIntegration {
  id: string;
  isActive: boolean;
  isCompleted: boolean;
  integration: Omit<Integration, 'isCardSelected'>;
  OrgIntegrationStep: OrgIntegrationStep;
}

export interface OrgCategory {
  // id: string;
  // name: string;
  // description: string;
  // subCategories?: OrgCategory[];
  // quickStartIntegrations?: QuickStartIntegration[];
  id: string;
  name: string;
  config: {
    [key: string]: string;
  };
  subCategories: Pick<EntityObj, 'id' | 'description'>[];
  integrations: Pick<EntityObj, 'id' | 'description'>[];
  quickStartIntegrations: {
    id: string;
    name: string;
    description: string;
    steps: {
      id: string;
      name: string;
      route: string;
    }[];
  }[];
  businessEntities: Pick<EntityObj, 'id' | 'description'>[];
  designations: Pick<EntityObj, 'id' | 'description'>[];
  tags: Pick<EntityObj, 'id' | 'description'>[];
}

export interface CreateOrgIntegrationPayload {
  integrationIds: string[];
  isActive?: boolean;
  resourceId?: string;
  credentials?: string;
  orgDesignationId?: string;
}
