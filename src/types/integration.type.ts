import { number, object, string } from 'yup';
import type { InferType } from 'yup';
import type { BillingType } from './project.type';

export interface InvoiceEstimate {
  id: string;
  description: string;
  billingType?: BillingType;
  billingRate?: number | null | undefined;
  finalAmount: number;
  totalTimeSpent: number;
}

export const InvoiceEstimatePayloadSchema = object({
  description: string().optional().nullable().label('description'),
  billingType: string().required().nullable().label('Billing Type'),
  billingRate: number()
    .nullable()
    .when('billingType', (billingType, schema) => {
      if (billingType && billingType !== 'NONE') {
        return schema.min(1).required().label('Billing Amount');
      }
    })
    .label('Billing Amount'),
  finalAmount: number().required().nullable().label('Amount'),
  totalTimeSpent: string().optional().nullable().label('Time Spent')
});

export type InvoiceEstimatePayload = InferType<
  typeof InvoiceEstimatePayloadSchema
>;

export interface XeroClient {
  ContactID: string;
  CompanyNumber: string;
  AccountNumber: string;
  ContactStatus: string;
  Name: string;
  FirstName: string;
  LastName: string;
  EmailAddress: string;
  Addresses: {
    AddressType: string;
  }[];
  Phones: {
    PhoneType: string;
    PhoneNumber?: string;
    PhoneCountryCode?: string;
  }[];
  UpdatedDateUTC: string;
  ContactGroups: any[];
  IsSupplier: boolean;
  IsCustomer: boolean;
  Balances: {
    AccountsReceivable: {
      Outstanding: number;
      Overdue: number;
    };
    AccountsPayable: {
      Outstanding: number;
      Overdue: number;
    };
  };
  ContactPersons: any[];
  HasAttachments: boolean;
  HasValidationErrors: boolean;
}
