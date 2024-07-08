<script setup lang="ts">
import type { InvoiceEstimatePayload } from '@/types/integration.type';
import { InvoiceEstimatePayloadSchema } from '@/types/integration.type';
import InputNumber from 'primevue/inputnumber';

import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import InputText from 'primevue/inputtext';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Title from '../Form/Title.vue';

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'modalClose'): void;
}>();

const formValues = ref();
const formKey = ref(0);
const formRef = ref<SchemaFormRef | null>(null);

const queryClient = useQueryClient();
const { initToast } = useToasts();
const route = useRoute();
const projectId = ref(route.params.id as string);
const { openLinkInNewTab } = useUtilityFns();
const { convertMinsToHrsMins } = useVueFilters();

const { data: estimateList } = useQuery(
  ['estimate-list', projectId.value],
  () => {
    return useEstimateList(projectId.value as string);
  }
);

const { mutateAsync: createEstimateData, isLoading } = useMutation(
  async (payload: InvoiceEstimatePayload) => {
    return await useInvoiceEstimateCreate(payload);
  },
  {
    onSuccess: (data) => {
      if (data) {
        initToast({
          actionType: 'Add',
          summary: 'Estimate',
          detail: `Invoice generated successfully.`
        });
        emit('modalClose');
        queryClient.invalidateQueries('project-details');
        openLinkInNewTab(data);
      }
    }
  }
);

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

function convertToTime(num: number) {
  return convertMinsToHrsMins(num * 60);
}
function setInitialValues() {
  if (estimateList.value) {
    return {
      ...estimateList.value,
      totalTimeSpent: convertToTime(
        estimateList.value.totalTimeSpent as number
      )
    };
  }
}
const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: Textarea,
        name: 'description',
        label: 'Description',
        rows: 6,
        placeholder: 'Enter a brief Project Description.',
        disabled: true
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'billingType',
        label: `Billing Details`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'value',
        placeholder: 'Select Billing Type',
        formGridClass: 'md:col-6 ',
        filter: false,
        disabled: true
      },
      {
        as: InputNumber,
        name: 'billingRate',
        label: 'Billing Amount',
        mode: 'currency',
        currency: 'USD',
        locale: 'en-US',
        inputGroup: true,
        inputGroupPrefix: '$',
        autocomplete: 'off',
        formGridClass: 'md:col-6',
        placeholder: '$0.00',
        type: 'input-number',
        hide: true,
        inputId: 'billingRate',
        disabled: true
      },

      {
        as: InputText,
        name: 'totalTimeSpent',
        label: 'Total Time Spent',
        formGridClass: 'md:col-6',
        placeholder: 'HH:MM',
        disabled: true
      },

      {
        as: InputNumber,
        type: 'input-number',
        name: 'finalAmount',
        label: 'Final Amount',
        required: true,
        autocomplete: 'off',
        formGridClass: 'md:col-6  ',
        placeholder: 'Enter Amount'
      },
      {
        as: Title,
        name: 'note',
        showSlot: true,
        label: 'Note'
      }
    ],
    validationSchema: InvoiceEstimatePayloadSchema,
    initialValues: setInitialValues(),
    btnText: 'Submit',
    secondaryBtnText: 'Cancel'
  };
});

const { findFormIndex, updateFieldProp, updateOptions }
  = useSchemaForm(formData);
const billingIndex: number = findFormIndex('billingType');
const rateIndex: number = findFormIndex('billingRate');
watchEffect(() => {
  if (estimateList.value) {
    formValues.value = estimateList.value;
    formData.value.initialValues = setInitialValues();
    formKey.value = formKey.value + 1;
  }
  updateOptions(billingTypeValue, billingIndex);

  if (
    formValues.value
    && formValues.value.billingType
    && formValues.value.billingType !== 'NONE'
  ) {
    updateFieldProp('hide', rateIndex, false);
  }
  if (
    formValues.value
    && (formValues.value.billingType === null
    || formValues.value.billingType === 'NONE')
  ) {
    updateFieldProp('hide', rateIndex, true);
  }
});

function handleCancel() {
  emit('modalClose');
}

async function onSubmit(values: Record<string, any>) {
  const payload = {
    amount: values.finalAmount.toString(),
    projectId: projectId.value
  };
  await createEstimateData(payload as unknown as InvoiceEstimatePayload);
}
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :key="formKey"
    :data="formData"
    :primary-btn-loading="isLoading"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
  >
    <template #note>
      <div class="text-base my-3">
        Notes : According to final amount estimate will be generated but this
        amount will not be updated in App Return, as we are calculating based
        on type and time spent.
      </div>
    </template>
  </CommonSchemaForm>
</template>
