import type { InferType } from 'yup';
import type { UserPermissions } from './permissions.type';
import { boolean, object, string } from 'yup';
import {
  PasswordSchema,
  confirmPasswordSchema,
  emailSchema
} from './common.validation.type';

export const PreLoginPayloadSchema = object({
  email: emailSchema
});

export type PreLoginPayload = InferType<typeof PreLoginPayloadSchema>;

export const ForgotPasswordSchema = PreLoginPayloadSchema;
export type ForgotPasswordPayload = PreLoginPayload;

export const ResetPasswordSchema = object({
  password: PasswordSchema,
  confirmPassword: confirmPasswordSchema('password')
});

export const ChangePasswordSchema = object({
  email: emailSchema,
  oldPassword: string().required().label('Old Password'),
  newPassword: PasswordSchema,
  confirmPassword: confirmPasswordSchema('newPassword')
});

export type ResetPasswordPayload = Omit<
  InferType<typeof ResetPasswordSchema>,
  'confirmPassword'
> & { key: string };

export type ChangePasswordPayload = Omit<
  InferType<typeof ChangePasswordSchema>,
  'confirmPassword'
> & { oldPassword: string };

export interface ResetPasswordResponse {
  token: string;
  id: string;
}

export interface PreLoginResponse {
  action: 'signin' | 'signup';
  loginType: 'password' | 'thirdparty';
  email: string;
  isVerified: boolean;
  id?: string;
}

export const SignUpPayloadSchema = object({
  email: emailSchema,
  password: PasswordSchema,
  confirmPassword: confirmPasswordSchema('password'),
  acceptTerms: boolean()
    .required()
    .oneOf([true], 'Please accept the terms and conditions'),
  firstName: string().label('First Name'),
  lastName: string().label('Last Name'),
  companyName: string().label('Company Name')
});

export type SignUpPayload = InferType<typeof SignUpPayloadSchema> & {
  timezone: string;
};

export interface SignUpResponse {
  id: string;
}

export const SignInPayloadSchema = object({
  email: emailSchema,
  password: string().required().label('Password')
});

export type SignInPayload = InferType<typeof SignInPayloadSchema>;
export interface SignInResponse {
  permissions?: UserPermissions;
}

export interface GoogleSignInResponse {
  link: string;
}

export interface AuthUser {
  id: string;
  type: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ClientUserClient {
  id: string;
  name: string;
  isActive: boolean;
  org: {
    id: string;
    name: string;
  };
}

export interface ClientUserSignInPayload {
  orgId: string;
  clientId: string;
}
