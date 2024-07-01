<script setup lang="ts">
import type {
  Designation,
  DesignationCreatePayload,
} from '@/types/designation.type';
import { DesignationCreatePayloadSchema } from '@/types/designation.type';
import type { SchemaForm } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useMutation } from 'vue-query';

const props = defineProps<{
  designation?: Designation;
}>();

const emit = defineEmits<{
  (e: 'success', data: Designation): void;
  (e: 'update', data: Designation): void;
}>();

const { mutateAsync: createUpdateDesignation, isLoading: createIsLoading } =
  useMutation(
    (payload: DesignationCreatePayload) => {
      if (props.designation) {
        return useDesignationUpdate(props.designation.id, payload);
      }
      return useDesignationCreate(payload);
    },
    {
      onSuccess: (data) => {
        if (props.designation) {
          emit('update', data);
        } else {
          emit('success', data);
        }
      },
    }
  );
const onSubmit = async (values: Record<string, any>) => {
  await createUpdateDesignation({
    name: values.name,
    description: values.description,
  } as unknown as DesignationCreatePayload);
};

const formData: SchemaForm = {
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Designation Name',
      required: true,
      autocomplete: 'off',
    },
    {
      as: Textarea,
      name: 'description',
      label: 'Job Description',
      rows: 4,
    },
  ],
  validationSchema: DesignationCreatePayloadSchema,
  initialValues: props.designation ? props.designation : undefined,
  btnText: props.designation ? 'Update' : 'Submit',
};
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    @submit="onSubmit"
    :primary-btn-loading="createIsLoading"
  ></CommonSchemaForm>
</template>
