<script setup lang="ts">
import type { SchemaForm } from '@/types/schemaform.type';
import { Field as VField } from 'vee-validate';
import { useQuery } from 'vue-query';

import type {
  CommonClientState,
  HandleStepFunc
} from '@/types/client.type';
import { ClientServiceSchema } from '@/types/client.type';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import type { Step } from '@/types/common.type';

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

const handleStep = inject<HandleStepFunc>('handleStep', () => {});

const {
  review: reviewProp,
  state: stateProp,
  federal: federalProp,
  isWithoutState: isWithoutStateProp
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
      hide: true
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
      showSlot: true
    }
  ],
  btnText: 'Next',
  validationSchema: ClientServiceSchema,
  initialValues: undefined,
  secondaryBtnText: 'Back'
});

const instance = getCurrentInstance();
const { findFormIndex, updateOptions } = useSchemaForm(formData);

const {
  data: clientServices,
  isLoading: servicesIsLoading,
  isFetching: servicesFetching
} = useQuery(
  'client-services-list',
  () => {
    return reviewProp.value
      ? useClientServices({
        id: clientId.value as string,
        stateId: stateProp?.value?.id,
        isFederal: federalProp.value,
        isWithoutState: isWithoutStateProp.value
      })
      : [];
  },
  {
    onSuccess: (data) => {
      if (reviewProp.value && data && data.length === 0)
        emit('refresh', true);
    }
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
      label: 'Select Project Template(s)'
    },
    {
      name: 'table',
      label: `Assign / Update Project Template(s) ${
        stateProp?.value?.name === 'Automation'
          ? ''
          : `to ${stateProp?.value?.name}`
      }`
    }
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
    if (val)
      isServicesSelectionCompleted.value = true;
  }
);

onMounted(() => {
  if (stateProp?.value) {
    setTimeout(() => {
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

async function onSubmit(data: Record<string, any>) {
  const { valid } = await formRef.value?.validate();
  if (valid) {
    selectedServices.value = data.services as string[];
    isServicesSelectionCompleted.value = true;
  }
}
function handleBack(services: string[]) {
  isServicesSelectionCompleted.value = false;
  setTimeout(() => {
    formRef.value?.setFieldValue('services', [...services], { force: true });
  }, 200);
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
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
      id="abc"
      readonly
      :items="stepItems"
      class="mb-4"
      :current="currentStep"
    />

    <CommonSchemaForm
      v-if="!isServicesSelectionCompleted"
      ref="formRef"
      :key="formKey"
      :data="formData"
      class="card border-2 border-round default-border-color border-round-lg"
      @submit="onSubmit"
      @secondary-btn-click="handleStep('Automation', { nestedActiveIndex: 1 })"
    >
      <template #services="{ ...attrs }">
        <div class="field mb-0">
          <VField v-slot="{ handleChange, value, validate }" name="services">
            <MultiSelect
              :tabindex="0"
              class="w-full"
              :model-value="value"
              v-bind="attrs"
              @update:model-value="handleChange"
              @blur="validate()"
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
      v-if="isServicesSelectionCompleted"
      :state-id="stateProp?.id ? stateProp.id : ''"
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
      :federal="federalProp"
      :is-without-state="isWithoutState"
      :loading="servicesIsLoading"
      :fetching="servicesFetching"
      @back="handleBack"
      @refresh="emit('refresh')"
      @automation="emit('refresh', true)"
    />
    <span
      v-if="stepItems[0].name !== currentStep"
      class="inline-block underline font-medium mt-3 text-lg cursor-pointer text-blue-600 hover:text-blue-800"
      @click="handleStep('Automation', { nestedActiveIndex: 1 })"
    >Back to List</span>
  </div>

  <!-- <div v-if="!isDetailsRoute" class="flex py-2 justify-content-between">
      <Button class="max-w-max" @click="handleBackSkip('back')">Back</Button>
      <Button class="max-w-max" @click="handleBackSkip('skip')">Skip</Button>
    </div> -->
</template>

<style lang="scss" scoped></style>
