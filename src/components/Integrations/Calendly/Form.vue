<script setup lang="ts">
import type { CalendlyPayload } from '@/types/integrations.type';
import { calendlySchema } from '@/types/integrations.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import { useMutation, useQuery } from 'vue-query';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const formRef = ref<SchemaFormRef | null>(null);
const { storeCalendlyUrl, getCalendlyUrl } = useIntegrations();

const { data: calendlyData, isFetching } = useQuery(
  ['calendly-url'],
  async () => {
    const data = await getCalendlyUrl();
    return data;
  },
  {
    onSuccess: (data: { url: string }) => {
      formRef.value?.setValues(data);
    },
  }
);

const { mutateAsync: setCalendlyUrl, isLoading: createIsLoading } = useMutation(
  (payload: CalendlyPayload) => {
    return storeCalendlyUrl(payload);
  },
  {
    onSuccess: () => {
      emit('success');
    },
  }
);
const onSubmit = async (values: Record<string, any>) => {
  await setCalendlyUrl(values as CalendlyPayload);
};

const formData = computed<SchemaForm>(() => ({
  fields: [
    {
      as: InputText,
      name: 'url',
      label: 'Calendly URL',
      required: true,
      autocomplete: 'off',
      type: 'url',
      helpText: 'Please provide your Calendly URL',
    },
  ],
  validationSchema: calendlySchema,
  initialValues: calendlyData.value ? calendlyData.value : undefined,
  btnText: calendlyData.value?.url ? 'Update' : 'Submit',
}));
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    @submit="onSubmit"
    :primary-btn-loading="createIsLoading"
  ></CommonSchemaForm>
</template>
