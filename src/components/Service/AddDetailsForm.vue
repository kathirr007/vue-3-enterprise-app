<script setup lang="ts">
import type { BillingType, GenerateTasksPayload } from '@/types/project.type';
import type { CreateServicePayload, Service } from '@/types/service.type';
import { CreateServiceSchema } from '@/types/service.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  service?: Service;
  create?: boolean;
  apiKey?: number;
  loading?: boolean;
  showAssist?: boolean;
  noDataFound?: boolean;
}>();

const emit = defineEmits<{
  (e: 'emitStep', step: string): void;
  (e: 'back', step: 'form'): void;
  (e: 'skip', step: 'form'): void;
  (
    e: 'form',
    value: CreateServicePayload,
    id?: string,
    brightAssist?: { payload: GenerateTasksPayload | undefined }
  ): void;
}>();

const { featureSubscribed, canAccessAllMenu } = usePermissions();
const { loading: isLoading } = toRefs(props);
const brightAssistValue = ref(
  props.showAssist && featureSubscribed('ai_features', 'generate_task')
);
const route = useRoute();
const projectTemplateName = ref<string>();
const billingOptions = ref([
  { label: 'None', value: 'NONE', name: 'billingType', checked: true },
  { label: 'Fixed', value: 'FIXED', name: 'billingType', checked: false },
  { label: 'Per Unit (1 unit = 60 min)', value: 'HOURLY', name: 'billingType', checked: false }
]);
const { isRobotDialog, notValidData, failedMsg, showDialog } = useAiInfo();

const { handleSubmit, errors, values, meta, setValues, validate } = useForm({
  validationSchema: CreateServiceSchema,
  initialValues: {
    name: '',
    billingType: 'NONE',
    billingRate: undefined,
    isBrightAssist: brightAssistValue.value,
    description: ''
  }
});

watch(
  () => props.apiKey,
  (newVal, oldVal) => {
    if (oldVal !== newVal) {
      name.value = `${props?.service?.name}`;
      billingType.value = `${props?.service?.billingType}`;
      billingRate.value = props?.service?.billingRate
        ? +props?.service?.billingRate
        : undefined;
    }
  }
);

const { value: name } = useField<string>('name');
const { value: billingType } = useField<string>('billingType');
const { value: billingRate } = useField<number | undefined>('billingRate');
const { value: description } = useField<string>('description');
// const serviceId = useRouteQuery<string>('serviceId');
const serviceId = ref(route.params.id as string);

const { data: serviceDetails } = useQuery(
  'service-details',
  () => {
    if (props.service)
      return props.service;
    if (!serviceId.value || route.name !== 'admin-services-id')
      return;
    return useServiceDetails(serviceId.value as string);
  },
  {
    onSuccess: (data: Service) => {
      name.value = data.name;
      billingType.value = data.billingType;
      billingRate.value = data.billingRate ? +data.billingRate : undefined;
    }
  }
);

const onSubmit = handleSubmit((formValues) => {
  const payload = {
    ...formValues,
    billingRate: formValues.billingRate
      ? (formValues.billingRate as number)?.toString()
      : ''
  };
  projectTemplateName.value = formValues.name;

  emit(
    'form',
    payload as unknown as CreateServicePayload,
    serviceId.value ? `${serviceId.value}` : undefined,
    {
      payload:
        props.showAssist && brightAssistValue.value
          ? { title: name.value, description: description.value }
          : undefined
    }
  );
});

function handleBillingTypeChange(data: Event | BillingType) {
  if (data !== 'NONE') {
    useTimeoutFn(() => {
      const billingRateInput = document.getElementById(
        'billingRate'
      ) as HTMLInputElement;
      billingRateInput?.focus();
    }, 300);
  }
}

function handleBrightAssist(value: boolean) {
  setValues({ ...values, isBrightAssist: value });
  validate({ mode: 'silent' });
}

onActivated(() => {
  // called on initial mount
  // and every time it is re-inserted from the cache
});
onDeactivated(() => {
  // called when removed from the DOM into the cache
  // and also when unmounted
  isRobotDialog.value = false;
  notValidData.value = false;
});

watchEffect(() => {
  if (props.create) {
    isRobotDialog.value = isLoading.value;
  }
  notValidData.value = props.noDataFound;
  if (!brightAssistValue.value) {
    showDialog.value = false;
  }
});
</script>

<template>
  <form class="text-left" @submit="onSubmit">
    <div class="field w-full md:w-6 md:pr-4">
      <label for="email" class="block font-medium text-900">
        Project Template Name
        <span class="text-red-600">*</span>
      </label>
      <InputText
        id="name"
        v-model="name"
        type="name"
        class="w-full"
        :class="{ 'p-invalid': errors.name }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          :feedback="false"
          error-key="name"
        />
      </transition>
    </div>

    <div v-if="props.showAssist" class="field">
      <div class="flex align-items-center">
        <InputSwitch
          v-model="brightAssistValue"
          :disabled="featureSubscribed('ai_features', 'generate_task') === false"
          @input="handleBrightAssist"
        />
        <!-- <Icon
          icon="fluent-emoji:robot"
          class="ml-1"
          style="font-size: 2.2rem"
        /> -->
        <img
          src="/images/robot-icon.png"
          alt="bright assistant robot"
          class="w-3rem ml-1"
        >
      </div>
      <Message
        v-if="featureSubscribed('ai_features', 'generate_task') === false"
        :closable="false"
        severity="info"
        class="mt-1 p-custom-message"
      >
        <span
          v-html="
            canAccessAllMenu
              ? ' To access <b>Bright Assistant</b>, please upgrade your subscription plan.'
              : 'To access <b>Bright Assistant</b>, Please contact your admin to upgrade your subscription plan.'
          "
        />
      </Message>
      <Message
        v-else
        :closable="false"
        class="mt-1 p-custom-message"
        severity="info"
      >
        {{
          brightAssistValue
            ? 'BrightAssistant, Powered by AI, generates tasks for this project based on the description provided in the box below.'
            : 'Enable BrightAssistant to automatically add tasks to this project template.'
        }}
      </Message>
      <div v-if="brightAssistValue" class="mt-2">
        <label class="block font-medium text-900 mb-1">
          Description
          <span v-if="brightAssistValue" class="text-red-600">*</span>
          <i
            v-tooltip="
              'Provide detailed description with compliance/service name, location, and frequency for efficient task generation.'
            "
            class="pi pi-info-circle ml-1 cursor-pointer"
            tabindex="0"
          />
        </label>
        <Textarea
          id="description"
          v-model="description"
          type="name"
          class="w-full"
          rows="5"
          :class="{ 'p-invalid': errors.description }"
        />
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            success-class="font-medium"
            :errors="errors"
            :values="values"
            :feedback="false"
            error-key="description"
          />
        </transition>
      </div>
    </div>
    <p class="text-base mt-4">
      Select how would you like to bill your clients for this project template.
      You may choose hourly or fixed, or not charge for this project template.
    </p>
    <div class="field" :class="{ 'mb-1': errors.billingType }">
      <label class="block font-medium text-900">
        Billing Type
        <span class="text-red-600">*</span>
      </label>
      <div class="grid">
        <div
          v-for="(option, idx) in billingOptions"
          :key="`${option.name}_${idx + 1}`"
          class="col-12 md:col-4 py-2 mt-2 align-items-center flex"
        >
          <RadioButton
            v-model="billingType"
            :input-id="`${option.name}_${idx + 1}`"
            name="billingType"
            :value="option.value"
            :checked="option.checked"
            @update:model-value="handleBillingTypeChange"
          />
          <label
            :for="`${option.name}_${idx + 1}`"
            class="ml-2 flex-1 cursor-pointer"
          >{{ option.label }}</label>
        </div>
      </div>
      <transition name="field-slide-down" mode="out-in">
        <p v-if="billingType === 'HOURLY'" class="-mt-2 mb-0 font-medium">
          It will update automatically when actual project will be created as per client.
        </p>
      </transition>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          error-key="billingType"
          :feedback="false"
        />
      </transition>
    </div>
    <div v-if="billingType !== 'NONE'" class="field">
      <label class="block font-medium text-900">
        Billing Amount
        <span class="text-red-600">*</span>
      </label>
      <div class="grid">
        <div class="col-12 md:col-5">
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">$</span>
            <InputNumber
              v-model="billingRate"
              input-id="billingRate"
              placeholder="$0.00"
              mode="currency"
              currency="USD"
              locale="en-US"
              name="billingRate"
            />
            <span v-if="billingType === 'HOURLY'" class="p-inputgroup-addon">/ Unit</span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-content-between mt-4">
      <!-- <Button
        label="Back"
        :icon="'pi pi-chevron-left'"
        class="p-button-text font-bold"
        @click="gotoServiceLis"
      ></Button> -->
      <Button
        v-if="props.create"
        label="Back"
        icon="pi pi-chevron-left"
        class="mr-auto p-button-text"
        @click="emit('back', 'form')"
      />
      <div class="ml-auto space-x-2.5">
        <Button
          v-if="route.name?.toString().includes('revisit')"
          label="Skip"
          @click="emit('skip', 'form')"
        />
        <Button
          :label="props.create ? 'Next' : 'Submit'"
          :disabled="!meta.valid"
          type="submit"
          :loading="isLoading && !notValidData"
        />
      </div>
    </div>
  </form>
  <Dialog
    v-model:visible="showDialog"
    modal
    append-to="body"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonAiInfo
      title="Hi I am BrightAssistant, your AI Team Member"
      :show-loading="isLoading && !notValidData"
    >
      <template #content>
        <p class="font-medium text-base mt-2">
          <template v-if="notValidData">
            {{ failedMsg }}
          </template>
          <span v-else>
            Awesome! Your instructions have been incredibly helpful. Now, sit
            back and relax while I handle creation of task templates for the
            project template
            <strong>{{ projectTemplateName }}</strong> for you.
          </span>
        </p>
      </template>
    </CommonAiInfo>
  </Dialog>
</template>
