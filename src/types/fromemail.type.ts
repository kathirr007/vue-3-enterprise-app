import { boolean, date, object, string, array, number } from 'yup';
import type { InferType } from 'yup';

export interface FromEmail {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isVerified?: boolean;
}

export const FromEmailCreateInputSchema = object({
  name: string().required().min(3).label('Name'),
  email: string().email().required().label('Email'),
});

export type FromEmailCreateInput = InferType<typeof FromEmailCreateInputSchema>;
