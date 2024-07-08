import type { InferType } from 'yup';
import { array, object, string } from 'yup';
import type { Client } from './client.type';

export interface ClientGroup {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  clients?: Client[];
  _count?: {
    clients: number;
  };
}

export const ClientGroupCreatePayloadSchema = object({
  name: string().required().min(3).label('Client Name'),
  description: string().optional().max(255).nullable().label('Description')
});
export const ClientGroupAddClientsSchema = object({
  clients: array().of(string()).optional().label('Clients')
});
export const ClientGroupRemovePayloadSchema = object({
  clientId: string().required().label('Clients')
});

export type ClientGroupCreatePayload = InferType<
  typeof ClientGroupCreatePayloadSchema
>;
export type ClientGroupAddClientsPayload = InferType<
  typeof ClientGroupAddClientsSchema
>;
export type ClientGroupRemovePayload = InferType<
  typeof ClientGroupRemovePayloadSchema
>;
