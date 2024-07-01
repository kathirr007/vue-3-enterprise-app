import en from '@vueform/vueform/locales/en';
import vueform from '@vueform/vueform/themes/vueform';
import { defineConfig } from '@vueform/vueform';

// You might place these anywhere else in your project
import '@vueform/vueform/themes/vueform/css/index.min.css';
import { validate_phone } from '@/types/vueform.custom.validations.type';

export default defineConfig({
  theme: vueform,
  locales: { en },
  locale: 'en',
  rules: {
    validate_phone,
  },
});
