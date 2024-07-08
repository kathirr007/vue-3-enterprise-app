import * as yupExtended from 'yup';
import type { AnyObject, Maybe } from 'yup/lib/types';

declare module 'yup' {
  interface StringSchema<
    TType extends Maybe<string> = string | undefined,
    TContext extends AnyObject = AnyObject,
    TOut extends TType = TType
  > extends yupExtended.BaseSchema<TType, TContext, TOut> {
    validatePhone({
      countryCode,
      validationType
    }: {
      countryCode?: string;
      validationType?: 'mobile' | 'phone';
    }): StringSchema<TType, TContext>;
    validateZipcode(countryCode?: string): StringSchema<TType, TContext>;
  }
}

export default yupExtended;
