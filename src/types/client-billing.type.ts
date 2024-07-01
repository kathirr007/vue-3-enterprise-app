import type { InferType } from 'yup';
import { array, boolean, number, object, string } from 'yup';
import type { Client } from './client.type';
import { CountryEnum } from './common.type';

const { pluralize } = useVueFilters();
export interface ClientBillingProfile {
  id: string;
  name: string;
  isPaymentGatewayIntegrated: boolean;
  createdAt: string;
  killBillInvoices: {
    _count: {
      payments: number;
    };
  }[];
  _count: {
    clientBillingProfiles: number;
    killBillInvoices: number;
  };
  billed: string;
  taxAmount: number;
  received: string;
  tenantId?: string;
  meta?: {
    email: string;
    taxNo: string;
    invoiceNumber: string;
    dueInDays: number;
  };
  taxNo?: string;
  dueInDays?: number;
  invoiceNumber?: string;
  logo?: string;
  orgIntegrationId?: string;
  city?: string;
  state?: string;
  country?: string;
  zipcode?: string;
  clients?: Client[];
  billingProfileId?: string;
  billingProfile: {
    unitInMinutes: number;
  };
  orgIntegration: {
    id: string;
    integrationId: string;
  };
  [key: string]: unknown | any;
}

export const CreateProfileNameSchema = object({
  name: string().required().min(3).label('Name')
});
export type CreateProfilePayload = InferType<typeof CreateProfileNameSchema>;

export const CreateProfileDetailsSchema = object().shape(
  {
    address: string().required().nullable().label('Address'),
    city: string().required().label('City'),
    state: string().required().nullable().label('State'),
    country: string().required().nullable().label('Country'),
    zipcode: string().required().nullable()
      .when('country', (country, schema) => {
        return country
          ? schema.validateZipcode((CountryEnum as any)[country])
          : schema.validateZipcode();
      }).label('Zipcode'),
    email: string().optional().nullable().email().label('Email'),
    taxNo: string().nullable().optional().label('Tax No'),
    logoPictureId: string().nullable().optional().label('Logo'),
    dueInDays: number().optional().nullable().label('Due Days'),
    isPaymentGatewayIntegrated: boolean()
      .optional()
      .label('Integrated Payment Gateway'),
    orgIntegrationId: string()
      .required()
      .nullable()
      .when(
        'isPaymentGatewayIntegrated',
        (isPaymentGatewayIntegrated, schema) =>
          isPaymentGatewayIntegrated ? schema.required() : schema.optional()
      )
      .label('Payment Gateway'),
    unitInMinutes: number()
      .optional()
      .nullable()
      .label('Billing Unit')
  },
  [['zipcode', 'zipcode']]
);
export type CreateProfileDetailsPayload = InferType<
  typeof CreateProfileDetailsSchema
>;

export const CreateProfileClientSchema = object({
  clients: array().of(string()).required().label(`${pluralize($tConfig('CLIENT'))}`)
});
export type CreateProfileClientPayload = InferType<
  typeof CreateProfileClientSchema
>;

export const SelectClientForInvoiceSchema = object({
  client: object().required().nullable().label($tConfig('CLIENT')),
  projects: array().of(object().optional().nullable()).label('Projects'),
  tasks: array().of(object().optional().nullable()).label('Tasks'),
  billingProfile: object().required().nullable().label(`${$tConfig('CLIENT_BILLING_PROFILE')}`)
});

export const BillingProfileSelectionSchema = object({
  billingProfileId: string().required().nullable().label(`${$tConfig('CLIENT_BILLING_PROFILE')}`)
});
