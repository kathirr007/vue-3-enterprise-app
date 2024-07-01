import type { InferType } from 'yup';
import { boolean, object, string } from 'yup';
import type { Attachment } from './attachment.type';
import type { OrgCategoryId } from './app.type';
import { CountryEnum } from './common.type';
import type { OrgCategory } from './integrations.type';

export type MFAProvider = 'EMAIL' | 'TOTP';
export interface Meta {
  metaKey: string & Meta[];
  metaValue: string & Meta[];
}
export interface Org {
  id?: string;
  name: string;
  subdomain?: string;
  categoryId?: string;
  domain?: string;
  regId?: string;
  taxId?: string;
  logo?: Attachment;
  regCertificate?: Attachment;
  contact_person_name?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
  website?: string;
  linkedIn?: string;
  twitter?: string;
  instagram?: string;
  facebook?: string;
  signature?: string;
  isOwner?: boolean;
  isDeletionRequested?: boolean;
  meta?: Meta[] | null;
  onTrial?: boolean;
  subscriptionEndDate?: string;
  orgSubscriptionResources?: OrgSubscriptionResources[];
  assignedSubCategories?: OrgCategory[];
  isOnBoardingCompleted?: boolean;
  [key: string]: unknown;
}

/* const inst2 = object().shape({
  location: object().shape(
    {
      state: string().when('county', {
        is: '',
        then: string().required(),
        otherwise: string(),
      }),
      county: string().when('state', {
        is: '',
        then: string().required(),
        otherwise: string(),
      }),
    },
    ['county', 'state']
  ),
}); */

export interface OrgSubscriptionResources {
  id: string;
  orgId: string;
  subscriptionId: string;
  resource: 'TEAM_MEMBER';
  limit: number;
  usage: number;
  createdAt: string;
  updatedAt: string;
}

export const OrgCreatePayloadSchema = object().shape(
  {
    name: string().required().min(3).label('Name'),
    regId: string().optional().nullable().label('Registration ID'),
    registration_certificate_preview: string()
      .optional()
      .nullable()
      .label('Registration ID'),
    contact_person_name: string()
      .optional()
      .nullable()
      .label('Contact Person Name'),
    email: string().optional().nullable().email().label('Email'),
    address: string().optional().nullable().label('Address'),
    city: string().optional().nullable().label('City'),
    state: string().optional().nullable().label('State'),
    country: string().optional().nullable().label('Country'),
    mobile: string().optional().nullable()
      .when('country', (country, schema) => {
        return country ? schema.validatePhone({ countryCode: (CountryEnum as any)[country] }) : schema.validatePhone({});
      }).label('Mobile'),
    // mobile: string().optional().nullable().validatePhone({}).label('Mobile'),
    // zipcode: string().optional().nullable().validateZipcode().label('Zipcode'),
    zipcode: string().nullable()
      .when('country', (country, schema) => {
        return country
          ? schema.validateZipcode((CountryEnum as any)[country])
          : schema.validateZipcode();
      }).label('Zipcode'),
    website: string().optional().nullable().url().label('Website'),
    linkedIn: string().optional().nullable().url().label('LinkedIn'),
    twitter: string().optional().nullable().url().label('Twitter'),
    instagram: string().optional().nullable().url().label('Instagram'),
    facebook: string().optional().nullable().url().label('Facebook'),
    signature: string().optional().nullable().label('Signature'),
    timezone: string().optional().nullable().label('Time Zone'),
    teamSize: string().min(0).optional().nullable().label('Team Size'),
    noOfClients: string()
      .min(0)
      .optional()
      .nullable()
      .label('Total no. of clients'),
    source: string().optional().nullable().label('Source'),
    needAssistance: string().optional().nullable().label('Nedd Assistance'),
    isMfaEnabled: boolean().optional().nullable(),
    autoLogoutInterval: string().optional().nullable().label('Auto Logout')
  },
  [['zipcode', 'zipcode']]
);

export type OrgCreatePayload = InferType<typeof OrgCreatePayloadSchema> & {
  categoryId: OrgCategoryId;
  subcategories: string[];
  designationId: string;
  isOnBoardingCompleted?: boolean;
  logo?: string;
  regCertificate?: string;
  timezone?: string;
  onboardingCTAClicked?: string;
};

export const onBoardingPayloadSchema = object().shape({
  name: string().required().min(3).label('Firm Name'),
  // designationId: string().required().label('Designation'),
  // mobile: string()
  //   .required()
  //   .validatePhone({ validationType: 'mobile' })
  //   .nullable()
  //   .label('Mobile Number'),
  mobile: string().required().nullable()
    .when('country', (country, schema) => {
      return country ? schema.validatePhone({ countryCode: (CountryEnum as any)[country] }) : schema.validatePhone({});
    }).label('Mobile Number'),
  address: string().nullable().optional().label('Address'),
  city: string().nullable().optional().label('City'),
  state: string().nullable().optional().label('State'),
  country: string().nullable().optional().label('Country'),
  zipcode: string().nullable()
    .when('country', (country, schema) => {
      return country
        ? schema.validateZipcode((CountryEnum as any)[country])
        : schema.validateZipcode();
    }).label('Zipcode')
  // teamSize: string().required().label('Team Size'),
  // noOfClients: string().required().label('No. of Business Clients'),
});
export const onBoardingCategorySchema = object().shape({
  designationId: string().nullable().required().label('Designation')
});

export const autoLogoutIntervalSchema = object().shape({
  interval: string().required().label('Interval')
});

export type AutoLogoutIntervalPayload = InferType<
  typeof autoLogoutIntervalSchema
>;

export interface IntervalOption {
  label: string;
  value: string;
  default?: boolean;
  securitySetting?: boolean;
}

export interface CreateMfaDto {
  email: string;
  TOTP?: string;
  provider: MFAProvider;
}
export interface MFASecret {
  dataUrl?: string;
  message?: string;
}
