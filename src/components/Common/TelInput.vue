<script setup lang="ts">
import type { CountryItem } from '@/composables/all-countries';
import { useQuery } from 'vue-query';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import { telInputMobileSchema, telInputPhoneSchema, telInputZipcodeSchema } from '@/types/common.type';

const props = withDefaults(defineProps<{
  placeholder?: string;
  validationType?: 'mobile' | 'phone' | 'zipcode';
  isRequired?: boolean;
  inputValue?: any;
}>(), {
  placeholder: 'Enter phone number',
  validationType: 'mobile',
  isRequired: false
});

const emits = defineEmits<{
  (e: 'country', value: string): void;
  (e: 'input', value: any): void;
}>();

const validationSchemas = reactive({
  mobile: telInputMobileSchema,
  phone: telInputPhoneSchema,
  zipcode: telInputZipcodeSchema
});
const dropdownRef = ref(null);

const { handleSubmit, errors, values, meta, validate, setFieldValue } = useForm({
  validationSchema: validationSchemas[props.validationType]
});

defineExpose({
  values,
  meta
});

const { value: country } = useField<string>('country');
const { value: mobile } = useField<string>('mobile');
const { value: phone } = useField<string>('phone');
const { value: zipcode } = useField<string>('zipcode');
const { value: isRequired } = useField<boolean>('isRequired');

const { data: availableCountries, isLoading } = useQuery(
  'countries-list',
  () => {
    return useCountriesList();
  }
);

const allAvailableCountryNames = computed(() => {
  const countryNames = availableCountries.value?.map(item => item.country);
  return countryNames;
});

const countriesOptions = computed(() => {
  return allCountriesList.value.filter((country: CountryItem) => allAvailableCountryNames.value?.includes(country.name));
});

watchEffect(() => {
  if (props.inputValue) {
    setFieldValue(props.validationType, props.inputValue);
  }
});

onMounted(() => {
  setFieldValue('isRequired', props.isRequired);
});
</script>

<template>
  <form>
    <div class="relative">
      <InputGroup>
        <InputGroupAddon>
          <Dropdown
            ref="dropdownRef"
            v-model="country"
            v-tooltip="'Select a country'"
            filter
            :options="countriesOptions"
            option-label="name"
            option-value="iso2"
            placeholder="Country"
            class="w-full"
            @change="emits('country', country)"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="flex align-items-center">
                <img
                  :alt="slotProps.value.name"
                  :src="`https://flagsapi.com/${slotProps.value}/shiny/64.png`"
                  :class="`mr-2 flag flag-${slotProps.value.toLowerCase()}`"
                  style="width: 18px;"
                >
                <!-- <div>{{ slotProps.value.name }}</div> -->
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="{ option }">
              <div class="flex align-items-center">
                <img
                  :alt="option.label"
                  :src="`https://flagsapi.com/${option.iso2}/shiny/64.png`"
                  :class="`mr-2 flag flag-${option.iso2.toLowerCase()}`"
                  style="width: 18px;"
                >
                <div>{{ option.name }}</div>
              </div>
            </template>
          </Dropdown>
        </InputGroupAddon>
        <InputText v-if="validationType === 'mobile'" v-model="mobile" :placeholder="placeholder" :disabled="!country" @blur="validate()" @input="emits('input', mobile)" />
        <InputText v-if="validationType === 'phone'" v-model="phone" :placeholder="placeholder" :disabled="!country" @blur="validate()" @input="emits('input', phone)" />
        <InputText v-if="validationType === 'zipcode'" v-model="zipcode" :placeholder="placeholder" :disabled="!country" @blur="validate()" @input="emits('input', zipcode)" />
      </InputGroup>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          :error-key="validationType"
          :feedback="false"
        />
      </transition>
    </div>
  </form>
</template>

<style lang="scss" scoped>
:deep(.p-inputgroup) {
  padding: 0;

  .p-inputgroup-addon {
    width: 60px;
    padding: 0;

    .p-dropdown {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;

      .p-dropdown-trigger {
        width: unset;
        padding-right: 10px;
      }
    }
  }

  .p-inputtext {
    border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }
}
</style>
