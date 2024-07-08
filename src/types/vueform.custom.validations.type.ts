import isMobilePhone, {
  type MobilePhoneLocale
} from 'validator/es/lib/isMobilePhone';
import { Validator } from '@vueform/vueform';

export const validate_phone = class extends Validator {
  get isAsync() {
    return true;
  }

  get message() {
    // console.log(this);
    return `The <strong>${this.attributeName}</strong> value must be valid <strong>US</strong> mobile number.`;
  }

  async check(value: any) {
    // return (await axios.get('/validator/uppercase')).data.valid;
    return isMobilePhone(`${value}`, `en-${'US'}` as MobilePhoneLocale);
  }
};
