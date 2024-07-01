import type { InferType } from 'yup';
import { object, string } from 'yup';

export interface Designation {
  id: string;
  name: string;
  description?: string;
  orgCategories?: {
    id: string;
    name: string;
  }[];
  _count?: { users: number };
}

export const DesignationCreatePayloadSchema = object({
  name: string().required().min(3).label('Designation Name'),
  description: string().optional().max(255).nullable().label('Description')
});

export type DesignationCreatePayload = InferType<
  typeof DesignationCreatePayloadSchema
>;

export const DesignationRemovePayloadSchema = object({
  designationId: string().required().label('Designation')
});

export type DesignationRemovePayload = InferType<
  typeof DesignationRemovePayloadSchema
>;
