import type { InferType } from 'yup';
import { object, string } from 'yup';

export interface BusinessEntity {
  id: string;
  name: string;
  description?: string;
  businessType: string;
}

export const BusinessEntityCreatePayloadSchema = object({
  name: string().required().min(3).label('Name'),
  description: string().optional().max(255).nullable().label('Description'),
  businessType: string().required().label('Category'),
});

export type BusinessEntityCreatePayload = InferType<
  typeof BusinessEntityCreatePayloadSchema
>;
