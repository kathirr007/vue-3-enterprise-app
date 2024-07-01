<script setup lang="ts">
import type { SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import type { SchemaForm } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import {
  CreatePaymentSchema,
  type CreatePaymentPayload,
} from '@/types/client-billing-invoices.type';
import { useMutation } from 'vue-query';

const props = defineProps<{
  invoiceId: string;
  amount?: number;
}>();
const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const { amount: amountProp } = toRefs(props);

const { getUsers } = useCommonListQueries();
const { markAsPaid } = useClientBillingInvoices();
const { initToast } = useToasts();
const { data: usersList, isLoading: loadingUsers } = getUsers();

const formRef = ref<SchemaFormRef>();
const paymentMethodOptions = ref([
  { name: 'Cash', value: 'CASH' },
  { name: 'Online', value: 'ONLINE' },
  { name: 'Cheque', value: 'CHEQUE' },
  { name: 'Other', value: 'OTHER' },
]);

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        as: InputNumber,
        type: 'input-number',
        name: 'amount',
        label: 'Amount',
        placeholder: 'Amount',
        mode: 'currency',
        currency: 'USD',
        locale: 'en-US',
        required: true,
        hide: true,
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'paymentMode',
        label: 'Payment Mode',
        optionLabel: 'name',
        optionValue: 'value',
        placeholder: 'Select Payment Mode',
        required: true,
        options: paymentMethodOptions.value,
      },
      {
        as: InputText,
        name: 'referenceNumber',
        label: 'Reference Number',
        placeholder: 'Enter Reference Number',
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'paymentReceivedBy',
        label: 'Received By',
        placeholder: 'Select Received By',
        optionLabel: 'name',
        optionValue: 'id',
        options: usersList.value || [],
        loading: loadingUsers.value,
        required: true,
      },
      {
        as: Textarea,
        name: 'remarks',
        label: 'Remarks',
        placeholder: 'Enter Remarks',
      },
    ],
    btnText: 'Submit',
    secondaryBtnText: 'Cancel',
    validationSchema: CreatePaymentSchema,
    initialValues: amountProp?.value
      ? {
          amount: amountProp?.value,
        }
      : {},
  } as SchemaForm;
});

const { isLoading: payingInvoice, mutateAsync: payInvoice } = useMutation(
  ({ id, payload }: { id: string; payload: CreatePaymentPayload }) => {
    return markAsPaid({ id, payload });
  },
  {
    onSuccess(data) {
      initToast({
        actionType: 'Update',
        summary: 'Pay Invoice',
        detail: 'Invoice payment has been successfully completed.',
      });
    },
  }
);
const onSubmit = async (formValues: Record<string, any>) => {
  await payInvoice({
    id: props.invoiceId,
    payload: formValues as CreatePaymentPayload,
  });
  emit('success');
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    ref="formRef"
    @submit="onSubmit"
    @secondary-btn-click="emit('cancel')"
    :primaryBtnLoading="payingInvoice"
  >
  </CommonSchemaForm>
</template>

<style lang="scss" scoped></style>
