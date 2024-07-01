<script setup lang="ts">
import type { InboxCreatePayload } from '@/types/inbox.type';
import { InboxCreatePayloadSchema } from '@/types/inbox.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';

import { useMutation, useQueryClient } from 'vue-query';

const emit = defineEmits(['modalClose']);

const { getUsers } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { data: users } = getUsers(true, true, initialFilters);
const queryClient = useQueryClient();
const formRef = ref<SchemaFormRef>();
const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Name',
        required: true,
        placeholder: 'Enter name'
      },
      {
        as: Textarea,
        name: 'description',
        label: 'Description',
        placeholder: 'Enter Description',
        rows: 6
      },
      {
        type: 'multiSelect',
        name: 'agentId',
        label: 'Agents',
        placeholder: 'Select Agents',
        required: true,
        options: users.value,
        optionLabel: 'name',
        optionValue: 'id'
      },
      {
        as: InputText,
        name: 'fromEmail',
        label: 'From Email',
        required: true,
        placeholder: 'Enter Email'
      }
    ],
    btnText: 'Submit',
    validationSchema: InboxCreatePayloadSchema,
    initialValues: undefined,
    secondaryBtnText: 'Cancel'
  };
});

function onSubmit(values: Record<string, any>) {
  createInbox(values as unknown as InboxCreatePayload);
}

function handleCancel() {
  emit('modalClose');
}

const { mutateAsync: createInbox, isLoading: creatingInbox } = useMutation(
  (values: InboxCreatePayload) => {
    return useInboxCreate(values);
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries('inboxes');
      emit('modalClose');
      // emit('success');
    }
  }
);
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="creatingInbox"
    @submit="onSubmit"
    @secondary-btn-click="handleCancel"
  />
</template>

<style lang="scss" scoped></style>
