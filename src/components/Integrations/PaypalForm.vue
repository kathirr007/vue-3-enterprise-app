<script setup lang="ts">
import type { PaypalPayload } from '@/types/integrations.type';
import { paypalSchema } from '@/types/integrations.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import { useMutation, useQuery } from 'vue-query';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const formRef = ref<SchemaFormRef | null>(null);
const { storePaypalCreds, getOrgIntegration } = useIntegrations();

const { data: paypalData } = useQuery(
  ['paypal-creds'],
  () => getOrgIntegration('PAYPAL'),
  {
    onSuccess: (data: { id: string; credentials: any }) => {
      formRef.value?.setValues({ ...data.credentials });
    }
  }
);

const { mutateAsync: setPaypalCreds, isLoading: integratingPaypal }
  = useMutation(
    (payload: PaypalPayload) => {
      return storePaypalCreds(payload);
    },
    {
      onSuccess: () => {
        emit('success');
      }
    }
  );
async function onSubmit(values: Record<string, any>) {
  await setPaypalCreds(values as PaypalPayload);
}

const formData = computed<SchemaForm>(() => ({
  fields: [
    {
      'as': InputText,
      'name': 'clientId',
      'label': 'Client Id',
      'required': true,
      'autocomplete': 'off',
      'aria-autocomplete': 'none',
      'helpText': 'Please provide your Paypal Client Id',
      'disabled': !!paypalData.value
    },
    {
      'as': Password,
      'type': 'input-password',
      'name': 'clientSecret',
      'label': 'Client Secret',
      'autocomplete': 'off',
      'aria-autocomplete': 'none',
      'required': true,
      'toggleMask': true,
      'feedback': false,
      'helpText': 'Please provide your Paypal Client Secret',
      'disabled': !!paypalData.value?.credentials
    }
  ],
  validationSchema: paypalSchema,
  initialValues: paypalData.value ? paypalData.value.credentials : undefined,
  btnText: 'Submit',
  hidePrimaryBtn: !!paypalData.value?.credentials
}));
</script>

<template>
  <Message
    v-if="!!paypalData?.credentials"
    :closable="false"
    severity="info"
    class="m-0 p-custom-message"
  >
    To change the credentials please contact support at
    <a class="font-semibold" href="mailto:help@brightreturn.com">help@brightreturn.com</a>.
  </Message>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="integratingPaypal"
    auto-complete="off"
    :disable-submit="!!paypalData?.credentials"
    @submit="onSubmit"
  />
</template>
