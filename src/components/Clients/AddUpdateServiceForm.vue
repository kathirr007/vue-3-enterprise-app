<script setup lang="ts">
import type { SchemaForm, SchemaFormField } from '@/types/schemaform.type';
import { Field as VField } from 'vee-validate';
import Title from '../Form/Title.vue';
import { useQuery } from 'vue-query';

import type {
  ClientServices,
  CommonClientState,
  HandleStepFunc,
} from '@/types/client.type';
import { ClientServiceSchema } from '@/types/client.type';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import type { Step } from '@/types/common.type';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const handleStep = inject<HandleStepFunc>('handleStep', () => {});

const props = defineProps<{
  review?: boolean;
  state?: Partial<CommonClientState>;
  federal?: boolean;
  isWithoutState?: boolean;
}>();
const emit = defineEmits<{
  (event: 'refresh', refresh?: boolean): void;
  (event: 'title', title: 'table' | 'select' | 'default'): void;
}>();
const {
  review: reviewProp,
  state: stateProp,
  federal: federalProp,
  isWithoutState: isWithoutStateProp,
} = toRefs(props);
const { getServices } = useCommonListQueries();
const { data: servicesList } = getServices();
const route = useRoute();

const clientId = ref(route.params.id as string);
const selectedServices = ref<string[]>([]);
const isServicesSelectionCompleted = ref(false);
const formKey = ref(0);
const formRef = ref<HTMLFormElement>();
const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      placeholder: 'Enter Name',
      formGridClass: 'w-0 h-0',
      softHide: true,
      hide: true,
    },
    {
      as: MultiSelect,
      type: 'multiSelect',
      name: 'services',
      optionLabel: 'name',
      optionValue: 'id',
      label: 'Project Templates',
      placeholder: 'Select Project Templates',
      required: true,
      showSlot: true,
    },
  ],
  btnText: 'Next',
  validationSchema: ClientServiceSchema,
  initialValues: undefined,
  secondaryBtnText: 'Back',
});

const instance = getCurrentInstance();
const { findFormIndex, updateOptions } = useSchemaForm(formData);

const {
  data: clientServices,
  isLoading: servicesIsLoading,
  isFetching: servicesFetching,
} = useQuery(
  'client-services-list',
  () => {
    return reviewProp.value
      ? useClientServices({
          id: clientId.value as string,
          stateId: stateProp?.value?.id,
          isFederal: federalProp.value,
          isWithoutState: isWithoutStateProp.value,
        })
      : [];
  },
  {
    onSuccess: (data) => {
      if (reviewProp.value && data && data.length === 0) emit('refresh', true);
    },
  }
);

const currentStep = computed(() => {
  emit('title', isServicesSelectionCompleted.value ? 'table' : 'select');
  return isServicesSelectionCompleted.value ? 'table' : 'select';
});

const stepItems = computed(() => {
  const steps: Step[] = [
    {
      name: 'select',
      label: 'Select Project Template(s)',
    },
    {
      name: 'table',
      label: `Assign / Update Project Template(s) ${
        stateProp?.value?.name == 'Automation'
          ? ''
          : 'to ' + stateProp?.value?.name
      }`,
    },
  ];
  return steps;
});

watchEffect(() => {
  if (servicesList.value) {
    const servicesIndex = findFormIndex('services');
    updateOptions(servicesList, servicesIndex);
    formKey.value++;
  }
  if (reviewProp.value) {
    isServicesSelectionCompleted.value = true;
  }
});

watch(
  () => reviewProp.value,
  (val) => {
    if (val) isServicesSelectionCompleted.value = true;
  }
);

onMounted(() => {
  if (stateProp?.value) {
    setTimeout(function () {
      if (!reviewProp.value) {
        formData.value.fields[0].hide = false;
        instance?.proxy?.$forceUpdate();
        formKey.value += 1;
        (formRef.value?.schemaForm[0] as HTMLFormElement)?.focus();
        (formRef.value?.schemaForm[0] as HTMLFormElement)?.blur();
        formData.value.fields[0].hide = true;
      }
    }, 1000);
  }
});

const onSubmit = async (data: Record<string, any>) => {
  // eslint-disable-next-line no-unsafe-optional-chaining
  const { valid } = await formRef.value?.validate();
  if (valid) {
    selectedServices.value = data.services as string[];
    isServicesSelectionCompleted.value = true;
  }
};
const handleBack = (services: string[]) => {
  isServicesSelectionCompleted.value = false;
  setTimeout(function () {
    formRef.value?.setFieldValue('services', [...services], { force: true });
  }, 200);
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <div
    :class="{
      'md:w-8 xl:w-5 mx-auto': currentStep === 'select',
      'mt-4': reviewProp,
    }"
  >
    <CommonSteps
      v-if="!reviewProp"
      readonly
      id="abc"
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
    />

    <CommonSchemaForm
      v-if="!isServicesSelectionCompleted"
      ref="formRef"
      :key="formKey"
      :data="formData"
      @submit="onSubmit"
      @secondary-btn-click="handleStep('Automation', { nestedActiveIndex: 1 })"
      class="card border-2 border-round default-border-color border-round-lg"
    >
      <template v-slot:services="{ ...attrs }">
        <div :class="'field mb-0'">
          <VField name="services" v-slot="{ handleChange, value, validate }">
            <MultiSelect
              :tabindex="0"
              @update:model-value="handleChange"
              @blur="validate()"
              class="w-full"
              :model-value="value"
              v-bind="attrs"
            >
              <template #header>
                <RouterLink
                  :to="{ name: 'admin-services' }"
                  class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
                >
                  Add New Project Template
                  <Icon
                    icon="mdi:external-link"
                    class="ml-1 h-1.5rem w-1.5rem"
                  />
                </RouterLink>
              </template>
              <template #option="slotProps">
                <div>{{ slotProps.option.name }}</div>
              </template>
            </MultiSelect>
          </VField>
        </div>
      </template>
    </CommonSchemaForm>
    <ClientsServicesUpdate
      :stateId="stateProp?.id ? stateProp.id : ''"
      v-if="isServicesSelectionCompleted"
      :services="
        reviewProp
          ? clientServices
            ? clientServices
            : []
          : selectedServices.map((e) => {
              return { serviceId: e };
            })
      "
      :review="reviewProp"
      @back="handleBack"
      :federal="federalProp"
      :isWithoutState="isWithoutState"
      :loading="servicesIsLoading"
      :fetching="servicesFetching"
      @refresh="emit('refresh')"
      @automation="emit('refresh', true)"
    />
    <span
      v-if="stepItems[0].name !== currentStep"
      class="inline-block underline font-medium mt-3 text-lg cursor-pointer text-blue-600 hover:text-blue-800"
      @click="handleStep('Automation', { nestedActiveIndex: 1 })"
      >Back to List</span
    >
  </div>

  <!-- <div v-if="!isDetailsRoute" class="flex py-2 justify-content-between">
      <Button class="max-w-max" @click="handleBackSkip('back')">Back</Button>
      <Button class="max-w-max" @click="handleBackSkip('skip')">Skip</Button>
    </div> -->
</template>

<style lang="scss" scoped></style>
