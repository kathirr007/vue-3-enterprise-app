<script setup lang="ts">
import { stripeSchema, type StripePayload } from '@/types/integrations.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import { useMutation, useQuery } from 'vue-query';
const { storeStripeKey, getOrgIntegration } = useIntegrations();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { initToast } = useToasts();
const formRef = ref<SchemaFormRef | null>(null);

const { data: stripeData } = useQuery(
  ['stripe-creds'],
  () => getOrgIntegration('STRIPE'),
  {
    onSuccess: (data: { id: string; credentials: any }) => {
      formRef.value?.setValues({ ...data.credentials });
    },
  }
);

const { mutateAsync: setStripeKey, isLoading: integratingStripe } = useMutation(
  (payload: StripePayload) => {
    return storeStripeKey(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Stripe Integration',
        detail: `Stripe Integration ${
          stripeData.value ? 'updated' : 'created'
        } successfully`,
      });
      emit('success');
    },
  }
);
const onSubmit = async (values: Record<string, any>) => {
  await setStripeKey(values as StripePayload);
};

const formData = computed<SchemaForm>(() => ({
  fields: [
    {
      as: InputText,
      name: 'apiKey',
      label: 'Stripe Key',
      required: true,
      autocomplete: 'off',
      type: 'apiKey',
      helpText: 'Please provide your Stripe Key',
      disabled: !!stripeData.value?.credentials,
    },
  ],
  validationSchema: stripeSchema,
  initialValues: stripeData.value ? stripeData.value : undefined,
  btnText: 'Submit',
  hidePrimaryBtn: !!stripeData.value?.credentials,
}));
</script>

<template>
  <Message
    v-if="stripeData?.credentials"
    :closable="false"
    severity="info"
    class="m-0 p-custom-message"
  >
    To change the credentials please contact support at
    <a class="font-semibold" href="mailto:help@brightreturn.com"
      >help@brightreturn.com</a
    >.
  </Message>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="integratingStripe"
    @submit="onSubmit"
  ></CommonSchemaForm>
</template>
