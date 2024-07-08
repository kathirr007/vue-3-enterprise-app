import type { InferType } from 'yup';
import { object, string } from 'yup';
import {
  PasswordSchema,
  confirmPasswordSchema,
  emailSchema
} from './common.validation.type';
import type { CommonUserType, EntityObj, MetaObj } from '@/types/common.type';

export interface VerifyUserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isOwner?: boolean;
  orgCity?: string;
  orgState?: string;
  orgEmail?: string;
  clientCity?: string;
  clientState?: string;
  clientEmail?: string;
  org: {
    name: string;
    logo: logos;
    meta: MetaObj[];
  };
  userClients: {
    client: {
      name: string;
      businessEntity: Pick<EntityObj, 'id' | 'name'>;
      meta: MetaObj[];
      org: {
        name: string;
        logo: logos;
        meta: MetaObj[];
      };
    };
  }[];
  type: CommonUserType;
  stateName?: string;
}
interface logos {
  name: string;
  path: string;
}
export interface VerifyUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  key: string;
  orgName?: string;
}
export interface SingleOrg {
  id: string;
  meta: MetaObj[];
  name: string;
}

export const VerifyPayloadSchema = object({
  email: emailSchema,
  password: PasswordSchema,
  confirmPassword: confirmPasswordSchema('password'),
  firstName: string().required().nullable().label('First Name'),
  lastName: string().required().nullable().label('Last Name')
});

export const VerifyPayloadSchemaIsOwner = object({
  email: emailSchema,
  firstName: string().nullable().required().nullable().label('First Name'),
  lastName: string().required().nullable().label('Last Name'),
  orgName: string().required().label('Organization Name')
});
export type VerifyPayload = InferType<typeof VerifyPayloadSchema>;
