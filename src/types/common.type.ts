import type { AxiosRequestConfig } from 'axios';
import { boolean, object, string } from 'yup';

export interface Tab {
  name: string;
}
export type APIActions =
  | 'Sign in'
  | 'Sign up'
  | 'Logout'
  | 'Create'
  | 'Update'
  | 'Remind'
  | 'Add'
  | 'Delete'
  | 'Remove'
  | 'Reject'
  | 'Cancel'
  | 'Approve'
  | 'Error'
  | 'Enable'
  | 'Disable'
  | 'Activate'
  | 'Deactivate'
  | 'Archive'
  | 'Restore'
  | 'Share'
  | 'Closed'
  | 'Reopened';
export interface PaginatedResponse<T> {
  results: T[];
  newResults?: T[];
  total: number;
}

export interface EmptyObj { [key: string]: unknown }

export interface FilterSearch {
  global?: string | any;
}

export interface UploadFilesPayload {
  xhr?: XMLHttpRequest;
  files: File | File[];
}

export interface FullNameObject {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface FileObject {
  files: File | File[];
  name?: string;
}
export interface MetaObj {
  metaKey: string;
  metaValue: string;
}

export interface EntityObj {
  id: string;
  name: string;
  description: string;
}
export type CustomAxiosRequestConfig = AxiosRequestConfig & {
  catchErrors: boolean;
};

export interface TimelineSteps {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  content?: string;
  hideCta?: boolean;
  ctaText?: string;
  route?: string;
  status?: 0 | 1 | 2;
  isRequired?: boolean;
  hidden: boolean;
}

export interface Step {
  [x: string]: any;
  name: string;
  label: string;
}

export interface ContentJSON {
  content: string;
  delta?: any;
}

export type CommonUserType =
  | 'ORG_USER'
  | 'CLIENT_USER'
  | 'API_USER'
  | 'OUTSOURCED_ORG_USER';

export interface CommonLocation {
  lat: string;
  long: string;
}

export interface CountDownCircle {
  circles: any[];
  mainCircleId: string | number;
  containerClasses?: string[];
  circleClasses?: string[];
  interval?: number;
  stopConditions?: any;
  triggerUpdate?: boolean;
  size?: number;
  strokeWidth?: number;
  strokeColor?: string; // css variable name
  underneathStrokeColor?: string; // css variable name
  fillColor?: string; // css variable name
  valueFontSize?: number;
  labelFontSize?: number;
  labelPosition?: 'top' | 'bottom';
  showValue?: boolean;
  value?: number;
  label?: string;
}

export type OmitDynamicKey<T> = Omit<T, keyof { [key: string]: unknown }>;
// export type OmitDynamicKey = 'Test' | 'Dynamic';

export type ExtractedType<T, U extends keyof T> = U extends keyof T
  ? T[U]
  : never;

export type EditorPlaceholderScope =
  | 'CLIENT_BROADCAST'
  | 'CLIENT_BROADCAST_TEMPLATE'
  | 'TEAM_BROADCAST'
  | 'TEAM_BROADCAST_TEMPLATE';

export interface EditorPlaceholderOption {
  id: string;
  code: string;
  label: string;
  resource: string;
  scope: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OnboardingSteps = 'form' | 'integration' | 'category' | 'sub-category';

export const CountryEnum = {
  'United States': 'US',
  'Canada': 'CA'
};

export const telInputMobileSchema = object({
  isRequired: boolean().nullable().optional().label('isRequired'),
  country: string().nullable().optional().label('Country'),
  mobile: string().nullable()
    .when('country', (country, schema) => {
      return country
        ? schema.validatePhone({ countryCode: country, validationType: 'mobile' })
          .when('isRequired', (isRequired: any, schema: any) => {
            return isRequired ? schema.required() : schema.optional();
          }).label('Mobile')
        : schema.label('Mobile');
    })
});
export const telInputPhoneSchema = object({
  isRequired: boolean().label('isRequired'),
  country: string().nullable().optional().label('Country'),
  phone: string().nullable()
    .when('country', (country, schema) => {
      return country
        ? schema.validatePhone({ countryCode: country, validationType: 'phone' })
          .when('isRequired', (isRequired: any, schema: any) => {
            return isRequired ? schema.required() : schema.optional();
          }).label('Phone')
        : schema.label('Phone');
    })
});
export const telInputZipcodeSchema = object({
  isRequired: boolean().nullable().optional().label('isRequired'),
  country: string().nullable().optional().label('Country'),
  zipcode: string().nullable()
    .when('country', (country, schema) => {
      return country
        ? schema.validateZipcode(country)
          .when('isRequired', (isRequired: any, schema: any) => {
            return isRequired ? schema.required() : schema.optional();
          }).label('Zipcode')
        : schema.label('Zipcode');
    })
});
