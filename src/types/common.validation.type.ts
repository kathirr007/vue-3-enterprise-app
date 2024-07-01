// import { parsePhoneNumber } from 'awesome-phonenumber';

import parsePhoneNumber from 'libphonenumber-js';
import isMobilePhone, {
  type MobilePhoneLocale
} from 'validator/es/lib/isMobilePhone';
import isPostalCode from 'validator/lib/isPostalCode';
import type { StringSchema } from 'yup';
import { addMethod, ref, string } from 'yup';

addMethod<StringSchema>(
  string,
  'validatePhone',
  function validatePhone({ countryCode = 'US', validationType = 'mobile' }) {
    return this.test(
      'is-phone-valid',
      message =>
        `${message.path} must be a valid <strong>${countryCode}</strong> ${validationType} number`,
      (value, { createError, schema }) => {
        const isRequired = schema.spec.presence === 'required';
        if (
          !isRequired
          && (value === undefined || value === '' || value === null)
        ) {
          return true;
        }
        // return value !== undefined
        //   ? validationType === 'mobile'
        //     ? parsePhoneNumber(value, { regionCode: countryCode })
        //         .typeIsMobile === true
        //     : parsePhoneNumber(value, { regionCode: countryCode }).valid ===
        //       true
        return value !== undefined
          ? validationType === 'mobile'
            ? isMobilePhone(
              `${value}`,
              `en-${countryCode}` as MobilePhoneLocale
            )
            : parsePhoneNumber(value, countryCode)?.isValid() === true
          : createError({
            message(params: Record<string, unknown>) {
              return `${params.path} is invalid`;
            }
          });
      }
    );
  }
);
addMethod<StringSchema>(
  string,
  'validateZipcode',
  function validateZipcode(countryCode = 'US') {
    return this.test(
      'is-zipcode-valid',
      message =>
        `${message.path} must be a valid <strong>${countryCode}</strong> zipcode`,
      (value, { createError, schema }) => {
        const isRequired = schema.spec.presence === 'required';
        if (
          !isRequired
          && (value === undefined || value === '' || value === null)
        ) {
          return true;
        }
        // return value !== undefined
        //   ? validationType === 'mobile'
        //     ? parsePhoneNumber(value, { regionCode: countryCode })
        //         .typeIsMobile === true
        //     : parsePhoneNumber(value, { regionCode: countryCode }).valid ===
        //       true
        if (isRequired && !value)
          return createError({
            message(params: Record<string, unknown>) {
              return `${params.path} is required`;
            }
          });

        return value !== undefined
          ? isPostalCode(value, countryCode as any)
          : createError({
            message(params: Record<string, unknown>) {
              return `${params.path} is invalid`;
            }
          });
      }
    );
  }
);

export const PasswordSchema = string()
  .min(8)
  .matches(/[\W_]/, ({ label }) => `${label} at least one special characters`)
  .matches(/[0-9]/, ({ label }) => `${label} at least one number`)
  .matches(/[A-Z]/, ({ label }) => `${label} at least one uppercase`)
  .matches(/[a-z]/, ({ label }) => `${label} at least one lowercase`)
  .required()
  .label('Password');

export function confirmPasswordSchema(reference: string) {
  return string()
    .oneOf(
      [ref(reference), null],
      `Confirm Password doesn't match with Password`
    )
    .required()
    .label('Confirm Password');
}

export const emailSchema = string().email().required().label('Email');
