<script setup lang="ts">
import type {
  ScheduleProjectStep,
  UnPlannedProject,
  UnScheduledProjectEntity
} from '@/types/project.type';
import {
  ExtendUnScheduledProjectPayloadSchema,
  ScheduleProjectSchema
} from '@/types/project.type';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { useQuery } from 'vue-query';
import type {
  SchemaForm,
  SchemaFormField,
  SchemaFormRef
} from '@/types/schemaform.type';
import type { Service } from '@/types/service.type';
import Calendar from 'primevue/calendar';
import dayjs from 'dayjs';

const props = defineProps<{
  serviceToSchedule: UnPlannedProject;
  typeofSchedule: 'Schedule' | 'Extend' | '';
  clientsSelected: UnScheduledProjectEntity[];
  formValues?: Record<string, any> | undefined;
  dueDate?: Date | string | undefined;
}>();

const emit = defineEmits<{
  (
    e: 'submit',
    formValues: Record<string, any>,
    stepName?: ScheduleProjectStep
  ): void;
  (e: 'modalClose'): void;
  (e: 'secondary-btn-click', stepName: ScheduleProjectStep): void;
}>();

const route = useRoute();

const { assignObj1ToObj2 } = useUtilityFns();

const formValuesData = ref();

const formKey = ref(0);
const updateProjectRef = ref<SchemaFormRef | null>(null);

const clientSelectedText = computed(() => {
  if (props.clientsSelected) {
    if (
      Array.isArray(props.clientsSelected)
      && props.clientsSelected.length === 1
    ) {
      return `${props.clientsSelected[0].name}`;
    }
    if (
      Array.isArray(props.clientsSelected)
      && props.clientsSelected.length > 1
    ) {
      return `${props.clientsSelected.length} clients selected`;
    }
  }
  return '';
});

interface billingOption {
  name?: string;
  value?: string;
  id?: string;
}
const billingTypeValue = ref<billingOption[]>([
  { name: 'None', value: 'NONE', id: '01' },
  { name: 'Fixed', value: 'FIXED', id: '02' },
  { name: 'Hourly', value: 'HOURLY', id: '03' }
]);

const { data: serviceDetails } = useQuery(
  'service-details',
  () => {
    if (props.formValues)
      return;
    return useServiceDetails(props.serviceToSchedule.serviceId as string);
  },
  {
    onSuccess: (data: Service) => {
      if (data) {
        data = assignObj1ToObj2(data, (data = {} as Service));
        formValuesData.value = {
          ...data,
          billingRate: data.billingRate ? Number(data.billingRate) : null
        };
      }
    }
  }
);

const scheduleFields = computed<SchemaFormField[]>(() => [
  {
    name: 'divider',
    formGridClass: 'md:col-12  ',
    label: '',
    hide: route.name === 'admin-clients-id'
  },
  {
    as: InputText,
    name: 'name',
    label: 'Project Title',
    required: true,
    autocomplete: 'off',
    formGridClass: 'md:col-12  '
  },
  {
    type: 'dropdown',
    as: Dropdown,
    name: 'billingType',
    label: `Billing Type`,
    required: true,
    autocomplete: 'off',
    optionLabel: 'name',
    optionValue: 'value',
    placeholder: 'Select billing ',
    formGridClass: 'md:col-6 '
  },
  {
    as: InputNumber,
    name: 'billingRate',
    label: 'Billing Amount',
    mode: 'currency',
    currency: 'USD',
    locale: 'en-US',
    autocomplete: 'off',
    formGridClass: 'md:col-6',
    placeholder: '$0.00',
    type: 'input-number',
    inputGroup: true,
    inputGroupPrefix: '$',
    hide: true
  },
  {
    as: Calendar,
    required: true,
    type: 'calender',
    name: 'startDate',
    label: 'Start Date',
    placeholder: 'Select Start Date',
    formGridClass: 'md:col-6',
    dateFormat: 'dd M yy',
    minDate: dayjs().toDate(),
    maxDate: props.dueDate
  },
  {
    as: Textarea,
    name: 'description',
    label: 'Description',
    formGridClass: 'md:col-12',
    rows: 6
  }
]);
const extendFields = computed<SchemaFormField[]>(() => [
  {
    name: 'divider',
    formGridClass: 'md:col-12  ',
    label: ''
  },
  {
    as: Calendar,
    required: true,
    type: 'calender',
    name: 'reminderDate',
    label: 'Reminder Date',
    placeholder: 'Select Reminder Date',
    formGridClass: 'md:col-6',
    dateFormat: 'dd M yy',
    minDate: dayjs().toDate()
  },
  {
    as: Calendar,
    required: true,
    type: 'calender',
    name: 'dueDate',
    label: 'Due Date',
    placeholder: 'Select Due Date',
    formGridClass: 'md:col-6',
    dateFormat: 'dd M yy',
    minDate: dayjs().toDate()
  }
]);

const formData = computed<SchemaForm>(() => {
  return {
    fields:
      props.typeofSchedule === 'Schedule'
        ? scheduleFields.value
        : extendFields.value,
    validationSchema:
      props.typeofSchedule === 'Schedule'
        ? ScheduleProjectSchema
        : ExtendUnScheduledProjectPayloadSchema,
    initialValues: props.formValues || formValuesData,
    btnText: props.typeofSchedule === 'Schedule' ? 'View Stages' : 'Submit',
    secondaryBtnText: 'Back',
    hideSecondaryBtn: route.name === 'admin-clients-id'
  };
});

const { findFormIndex, updateFieldProp, updateOptions }
  = useSchemaForm(formData);

const billingIndex: number = findFormIndex('billingType');
const rateIndex: number = findFormIndex('billingRate');
const dueDateIndex: number = findFormIndex('dueDate');

watchEffect(() => {
  updateOptions(billingTypeValue, billingIndex);

  if (props.typeofSchedule === 'Schedule') {
    if (
      (formValuesData.value
      && formValuesData.value.billingType !== 'NONE')
      || (props.formValues && props.formValues.billingType !== 'NONE')
    ) {
      updateFieldProp('hide', rateIndex, false);
    }
  }

  // formKey.value += 1;
});
function handleDropdownChange(formVals: Record<string, unknown>) {
  const billingType = formVals.billingType;
  if (billingType !== 'NONE') {
    updateFieldProp('hide', rateIndex, false);
    if (billingType === 'HOURLY') {
      updateFieldProp('inputGroupSuffix', rateIndex, '/ Unit');
    }
    else {
      updateFieldProp('inputGroupSuffix', rateIndex, '');
    }
  }
  else {
    updateFieldProp('hide', rateIndex, true);
  }
}

function handelDateChange(val: Record<string, unknown>) {
  if (props.typeofSchedule === 'Extend') {
    // updateFieldProp('minDate', reminderDateIndex, dayjs().toDate());
    updateFieldProp(
      'minDate',
      dueDateIndex,
      dayjs(`${val.reminderDate}`).toDate()
    );
  }
}

function handleCancel() {
  emit('secondary-btn-click', 'select clients');
}

async function onSubmit(values: Record<string, any>) {
  formValuesData.value = values;
  if (props.typeofSchedule === 'Schedule') {
    // if (values.description) {
    //   values = {
    //     ...values,
    //     description: { content: values.description } as unknown as string,
    //   };
    // }
    emit(
      'submit',
      { serviceDetails: serviceDetails.value, formValuesData: values },
      'pipeline'
    );
  }
  else {
    emit('submit', values);
  }
}
</script>

<template>
  <div>
    <div v-if="route.name !== 'admin-clients-id'" class="field mb-0">
      <label class="block font-medium text-900">
        Selected client(s) you would like to
        {{ props.typeofSchedule.toLowerCase() }} the Project for</label>
      <template v-if="clientsSelected.length > 1">
        <strong>{{ clientSelectedText }}</strong>
        <span
          class="text-primary underline inline-block ml-2 cursor-pointer"
          @click="handleCancel"
        >Update list</span>
      </template>
      <template v-else>
        <strong>{{ clientSelectedText }}</strong> is selected
      </template>
    </div>
    <CommonSchemaForm
      ref="updateProjectRef"
      :data="formData"
      :form-key="formKey"
      @dropdown-change="handleDropdownChange"
      @calendar-input="handelDateChange"
      @secondary-btn-click="handleCancel"
      @submit="onSubmit"
    />
  </div>
</template>

<style lang="scss" scoped></style>
