import type { RouteLocationRaw } from 'vue-router';

export interface MenuItem {
  label: string;
  icon?: string;
  to?: RouteLocationRaw;
  items?: MenuItem[];
  separator?: boolean;
  disabled?: boolean;
  style?: string;
  class?: string;
  target?: string;
  badge?: number | string;
  url?: string;
  name?: string;
  hide?: boolean;
  visible?: () => void | boolean;
  command?: (value: { originalEvent: Event; item: MenuItem }) => void;
}

export type OrgCategoryId = 'BUSINESS' | 'ACCOUNTING' | 'LAWYER';

export type ConfigKeys = 'CLIENT' | 'CONTACT' | 'TASK' | 'PROJECT_MANAGEMENT' | 'DOCUMENT_MANAGEMENT' | 'DATA_EXTRACTION' | 'SMART_FOLDER' | 'INVOICING' | 'ORGANIZER' | 'CONTRACT' | 'HRMS' | 'TIMER' | 'MOBILE_APP' | 'BULK_EMAIL' | 'BUSINESS_ENTITY' | 'CLIENT_PORTAL' | 'CLIENT_BILLING_PROFILE' | 'PROJECT';
