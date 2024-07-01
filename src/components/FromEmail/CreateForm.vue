<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import {
  FromEmailCreateInputSchema,
  type FromEmail,
  type FromEmailCreateInput,
} from '@/types/fromemail.type';
import type { SchemaForm } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  fromEmail?: FromEmail;
}>();

const emit = defineEmits<{
  (e: 'success', data: FromEmail): void;
  (e: 'update', data: FromEmail): void;
}>();

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { createOne: createFromEmail, update: updateFromEmail } = useFromEmail();

const showToast = (type: APIActions, data: FromEmail) => {
  initToast({
    actionType: type,
    title: 'From Email',
    actionObj: data,
  });
};

const { mutateAsync: createUpdateFromEmail, isLoading } = useMutation(
  (payload: FromEmailCreateInput) => {
    if (props.fromEmail) {
      return updateFromEmail(props.fromEmail.id, payload);
    }
    return createFromEmail(payload);
  },
  {
    onSuccess: (data) => {
      if (props.fromEmail) {
        showToast('Update', data);
      } else {
        showToast('Create', data);
      }
      emit('success', data);
      queryClient.invalidateQueries('fromemail-list');
    },
  }
);

const onSubmit = async (values: Record<string, any>) => {
  await createUpdateFromEmail({
    name: values.name,
    email: values.email,
  });
};

const formData: SchemaForm = {
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      autocomplete: 'off',
    },
    {
      as: InputText,
      name: 'email',
      label: 'Email',
      required: true,
      autocomplete: 'off',
      disabled: !!props.fromEmail,
    },
  ],
  validationSchema: FromEmailCreateInputSchema,
  initialValues: props.fromEmail ? props.fromEmail : undefined,
  btnText: props.fromEmail ? 'Update' : 'Submit',
};
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    @submit="onSubmit"
    :primary-btn-loading="isLoading"
  ></CommonSchemaForm>
</template>
