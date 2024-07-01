import type { InferType } from 'yup';
import { array, object, string } from 'yup';
import type { Client } from './client.type';
import type { Attachment } from './attachment.type';
import { CountryEnum, type MetaObj } from './common.type';

export interface UserContactClient {
  id: string;
  client: {
    id: string;
    name: string;
    email?: string;
    mobile?: string;
  };
}

export interface UserContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  isVerified?: boolean;
  isDeleted?: boolean;
  isActive?: boolean;
  clients?: Client[];
  picture?: string | Attachment;
  meta?: MetaObj[];
  userClients: {
    id: string;
    client: Client;
  }[];
  _count?: {
    userClients: number;
  };
  [key: string]: unknown | any;
}

export const ContactCreatePayloadSchema = object({
  firstName: string().required().label('First Name'),
  lastName: string().required().label('Last Name'),
  email: string().required().email().label('Email'),
  country: string().optional().label('Country'),
  // mobile: string().required().nullable().validatePhone({}).label('Mobile')
  mobile: string().required().nullable()
    .when('country', (country, schema) => {
      return country ? schema.validatePhone({ countryCode: (CountryEnum as any)[country] }) : schema.validatePhone({});
    }).label('Mobile')
});
export const contactAddClientsSchema = object({
  clientIds: array().min(1).of(string()).required().label(`${$tConfig('CLIENT')}s`)
});
export const ContactRemovePayloadSchema = object({
  clientId: string().required().label('Clients')
});

export interface BaseContact {
  roleId?: string;
  isOwner: boolean;
  phone?: string;
  dob?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  state?: string;
  country?: string;
  picture?: string;
}

export type ContactCreatePayload = BaseContact &
  InferType<typeof ContactCreatePayloadSchema>;
export type ContactAddClientsPayload = InferType<
  typeof contactAddClientsSchema
>;
export type ContactRemovePayload = InferType<typeof ContactRemovePayloadSchema>;
