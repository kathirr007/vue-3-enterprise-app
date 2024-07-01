<script setup lang="ts">
import type {
  BusinessEntity,
  BusinessEntityCreatePayload,
} from '@/types/business-entity.type';
import { BusinessEntityCreatePayloadSchema } from '@/types/business-entity.type';
import type { SchemaForm } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useMutation } from 'vue-query';

const props = defineProps<{
  businessEntity?: BusinessEntity;
}>();

const emit = defineEmits<{
  (e: 'success', data: BusinessEntity): void;
}>();

const { mutateAsync: createUpdateBusinessEntity, isLoading: createIsLoading } =
  useMutation(
    (payload: BusinessEntityCreatePayload) => {
      if (props.businessEntity) {
        return useBusinessEntityUpdate(
          props.businessEntity.id,
          payload as Partial<BusinessEntity>
        );
      }
      return useBusinessEntityCreate(payload);
    },
    {
      onSuccess: (data) => {
        emit('success', data);
      },
    }
  );
const onSubmit = async (values: Record<string, any>) => {
  await createUpdateBusinessEntity({
    name: values.name,
    description: values.description,
    businessType: values.businessType,
  } as unknown as BusinessEntityCreatePayload);
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
      as: Dropdown,
      type: 'dropdown',
      name: 'businessType',
      label: 'Category',
      required: true,
      autocomplete: 'off',
      options: [
        { name: 'Personal', value: 'INDIVIDUAL' },
        { name: 'Business', value: 'NON_INDIVIDUAL' },
      ],
      optionLabel: 'name',
      optionValue: 'value',
      disabled: !!props.businessEntity,
      filter: false,
    },
    {
      as: Textarea,
      name: 'description',
      label: 'Description',
      rows: 4,
    },
  ],
  validationSchema: BusinessEntityCreatePayloadSchema,
  initialValues: props.businessEntity ? props.businessEntity : undefined,
  btnText: 'Submit',
};
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    @submit="onSubmit"
    :primary-btn-loading="createIsLoading"
  ></CommonSchemaForm>
</template>
