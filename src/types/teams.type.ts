import { type CommonUserType, CountryEnum, type MetaObj } from '@/types/common.type';
import type { Attachment } from './attachment.type';
import type { Designation } from './designation.type';
import type { UserRole } from './user-role.type';
import type { InferType } from 'yup';
import { array, boolean, object, string } from 'yup';

import { emailSchema } from './common.validation.type';
import type { Client, CommonUser, Contract } from './client.type';
import type { Role } from './role.type';
import type { MFAProvider } from './myaccount.type';
import type { OrgCategoryId } from './app.type';

export const InviteTeamPayloadSchema = object().shape({
  users: array().of(
    object().shape({
      email: emailSchema,
      orgUserRoleId: string().label('Role').required(),
      managerId: string().label('Report').required(),
      designationId: string().label('Designation').required(),
      firstName: string().min(3).label('Team Member').required()
    })
  )
});

export const InviteContractualTeamPayloadSchema = object().shape({
  users: array().of(
    object().shape({
      email: emailSchema,
      managerId: string().label('Report').required(),
      designationId: string().label('Designation'),
      firstName: string().min(3).label('Team Member').required()
    })
  )
});

export const DisableTeamMemberSchema = object({
  replacingUserId: string().required().nullable().label('Replacing Member')
});
export type DisableTeamMemberPayload = InferType<
  typeof DisableTeamMemberSchema
>;
export interface User {
  id: string;
  email: string;
  isVerified: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  orgRole?: UserRole;
  isMfaEnabled?: boolean;
  isGoogleUser?: boolean;
  mfaProvider?: MFAProvider;
  invitedBy?: string | Partial<CommonUser>;
  isSetupCompleted?: boolean;
  isPushNotificationsEnabled: boolean;
  manager?: Manager;
  picture?: string | Attachment;
  designation?: Designation;
  meta?: MetaObj[];
  firstName?: string;
  lastName?: string;
  isOwner?: boolean;
  mobile?: string;
  phone?: string;
  city?: string;
  country?: string;
  zipcode?: string;
  dob?: string;
  state?: string;
  address?: string;
  type?: CommonUserType;
  org?: {
    isMfaEnabled: boolean;
    category: {
      id: OrgCategoryId;
      config: {
        [key: string]: string;
      };
    };
    meta?: MetaObj[];
  };
  _count: {
    assignedEntities: number;
    managingClients: number;
    managingProjects: number;
    reportees: number;
    watchingEntities: number;
  };
  permissions?: any;
  userClients: {
    client: Pick<Client, 'id' | 'name' | 'relationshipManager'> &
    Pick<Contract, 'org'>;
  }[];
  client?: {
    id: string;
    name: string;
    accessSetting: {
      enablePortal: string;
      enablePortalBrightDesk: string;
      enablePortalDocuments: string;
      enablePortalProjectTracking: string;
      enablePortalTaskTracking: string;
    };
    org?: {
      id: string;
      isMfaEnabled: boolean;
      category: {
        id: OrgCategoryId;
        config: {
          [key: string]: string;
        };
      };
    };
  };
  [key: string]: unknown | any;
}

export interface ClientAccessSetting {
  enablePortal: string;
  enablePortalBrightDesk: string;
  enablePortalDocuments: string;
  enablePortalProjectTracking: string;
  enablePortalTaskTracking: string;
}

export type Manager = Pick<
  User,
  'id' | 'firstName' | 'lastName' | 'email' | 'isActive'
>;

export type FullNameObj = Pick<User, 'firstName' | 'lastName' | 'email'>;

export interface CreateUserDto {
  email: string;
  designationId: string;
  orgUserRoleId: string;
  managerId: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  phone?: string;
  mobile?: string;
  dob?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  state?: string;
  country?: string;
  picture?: string;
}
export interface CreateUserPayload {
  email: string;
  orgUserRoleId?: string;
  managerId: string;
  designationId?: string;
  firstName: string;
  picture?: string | Attachment;
}

export type UpdateUserDto = Partial<CreateUserDto>;

export const CreateTeamMemberPayloadSchema = object({});
export const UpdateTeamMemberPayloadSchema = object({
  firstName: string().required().nullable().label('First Name'),
  email: string().required().email().nullable().label('Email'),
  designationId: string().label('Designation').when('isPortal', {
    is: true,
    then: string().optional(),
    otherwise: string().required()
  }),
  orgUserRoleId: string().label('Org User Role').nullable().when('isPortal', {
    is: true,
    then: string().optional(),
    otherwise: string().required()
  }),
  managerId: string()
    .label('Report To')
    .nullable()
    .when(
      ['isPortal', 'isOwner'],

      (...args: any) => {
        const isPortal = args[0];
        const isOwner = args[1];
        const schema = args[2];
        if (isPortal || isOwner) {
          return schema.optional();
        }
        return schema.required();
      }
    ),
  lastName: string().required().nullable().label('Last Name'),
  // phone: string()
  //   .nullable()
  //   .validatePhone({ validationType: 'phone' })
  //   .optional()
  //   .label('Phone Number'),
  phone: string().optional().nullable()
    .when('country', (country, schema) => {
      return country ? schema.validatePhone({ countryCode: (CountryEnum as any)[country], validationType: 'phone' }) : schema.validatePhone({ validationType: 'phone' });
    }).label('Mobile Number'),
  // mobile: string()
  //   .nullable()
  //   .validatePhone({ validationType: 'mobile' })
  //   .nullable()
  //   .optional()
  //   .label('Mobile Number'),
  mobile: string().optional().nullable()
    .when('country', (country, schema) => {
      return country ? schema.validatePhone({ countryCode: (CountryEnum as any)[country] }) : schema.validatePhone({});
    }).label('Mobile Number'),
  picture: string().optional().nullable().label('Picture'),
  isPortal: boolean().optional().nullable(),
  isOwner: boolean().optional().nullable(),
  isPushNotificationsEnabled: boolean().optional().nullable()
});

export const CreateContractTeamMemberPayloadSchema = object({});
export const UpdateContractTeamMemberPayloadSchema = object({
  firstName: string().required().nullable().label('First Name'),
  email: string().required().email().nullable().label('Email'),
  designationId: string().label('Designation').optional(),
  managerId: string()
    .label('Report To')
    .nullable()
    .when(
      ['isPortal', 'isOwner'],

      (...args: any) => {
        const isPortal = args[0];
        const isOwner = args[1];
        const schema = args[2];
        if (isPortal || isOwner) {
          return schema.optional();
        }
        return schema.required();
      }
    ),
  lastName: string().required().nullable().label('Last Name'),
  phone: string()
    .nullable()
    .validatePhone({ validationType: 'phone' })
    .optional()
    .label('Phone Number'),
  // mobile: string()
  //   .nullable()
  //   .validatePhone({ validationType: 'mobile' })
  //   .nullable()
  //   .optional()
  //   .label('Mobile Number'),
  mobile: string().optional().nullable()
    .when('country', (country, schema) => {
      return country ? schema.validatePhone({ countryCode: (CountryEnum as any)[country] }) : schema.validatePhone({});
    }).label('Mobile Number'),
  picture: string().optional().nullable().label('Picture'),
  isPortal: boolean().optional().nullable(),
  isOwner: boolean().optional().nullable()
});

export const UserOptionalUpdatePayloadSchema = object().shape(
  {
    dob: string().optional().label('Date of Birth'),
    address: string().optional().label('Address'),
    city: string().optional().label('City'),
    state: string().nullable().optional().label('State'),
    country: string().nullable().optional().label('Country'),
    // zipcode: string().optional().nullable().validateZipcode().label('Zipcode'),
    zipcode: string().nullable()
      .when('country', (country, schema) => {
        return country
          ? schema.validateZipcode((CountryEnum as any)[country])
          : schema.validateZipcode();
      }).label('Zipcode'),
    language: string().optional().label('Language'),
    salary: string().optional().nullable().label('Salary'),
    notes: string().optional().label('Notes'),
    signature: string().optional().nullable().label('Signature')
  },
  [['zipcode', 'zipcode']]
);

export type UserOptionalUpdatePayload = InferType<
  typeof UserOptionalUpdatePayloadSchema
> &
CreateUserPayload;
export type UpdateTeamMemberPayload = InferType<
  typeof UpdateTeamMemberPayloadSchema
>;

export type UpdateContractTeamMemberPayload = InferType<
  typeof UpdateContractTeamMemberPayloadSchema
>;

export interface DashboardTeam {
  totalCompletedTasks: number;
  overDueTasks: number;
  totalTasks: number;
  incompleteTasks: number;
  totalTimeSpent: number;
  getClientDistribution: {
    id: string;
    name: string;
    _count: {
      clients: number;
    };
  }[];
  upcomingTasks: { clients: number; projects: number };
}

export interface UserPortal {
  id: string;
  user: User;
  role: Pick<Role, 'id' | 'name'>;
}
