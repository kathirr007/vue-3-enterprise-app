import { type InferType, array, object, string } from 'yup';
import type { User } from './teams.type';

export interface DirectoryServices {
  createdAt: string;
  id: string;
  name: string;
  slug?: string;
}
export interface DirectoryState {
  id: string;
  name: string;
}
export interface LeadDirectory {
  id: string;
  message: string;
  phone: string;
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}
export interface BrightDirectory {
  stateId?: string;
  id: string;
  about: string;
  city: string;
  foundedYear?: number | string;
  name: string;
  picture: string;
  services: DirectoryServices[] | string[];
  slug?: string;
  state: DirectoryState | string;
  title: string;
  subject?: string;
}

export const BrightDirectoryUpdateSchema = object({
  subject: string().required().label('Page Title'),
  name: string().required().label('Organization Name'),
  slug: string().optional().label('Slug'),
  about: string().required().label('About'),
  stateId: string().required().nullable().label('State '),
  services: array(string()).min(1).required().nullable().label('Service'),
  foundedYear: string().optional().nullable().label('Founded Year'),
  picture: string().optional().nullable().label('Directory Logo')
});

export type BrightDirectoryUpdatePayload = InferType<
  typeof BrightDirectoryUpdateSchema
>;
