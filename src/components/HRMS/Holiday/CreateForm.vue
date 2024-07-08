<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import type { HRHoliday, HRHolidayCreateInput } from '@/types/hrms.type';
import { HRHolidayCreateInputSchema } from '@/types/hrms.type';

import type { SchemaForm } from '@/types/schemaform.type';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  holiday?: HRHoliday;
}>();

const emit = defineEmits<{
  (e: 'success', data: HRHoliday): void;
  (e: 'update', data: HRHoliday): void;
}>();

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { createOne: createHolday, update: updateHoliday } = useHrmsHolidays();

function showToast(type: APIActions, data: HRHoliday) {
  initToast({
    actionType: type,
    title: 'Holiday',
    actionObj: data
  });
}

const { mutateAsync: createUpdateHoliday, isLoading } = useMutation(
  (payload: HRHolidayCreateInput) => {
    if (props.holiday) {
      return updateHoliday(props.holiday.id, payload);
    }
    return createHolday(payload);
  },
  {
    onSuccess: (data) => {
      if (props.holiday) {
        showToast('Update', data);
        // emit('update', data);
      }
      else {
        showToast('Create', data);
      }
      emit('success', data);
      queryClient.invalidateQueries('holidays-list');
    }
  }
);
async function onSubmit(values: Record<string, any>) {
  await createUpdateHoliday({
    name: values.name,
    date: values.date,
    description: values.description
  });
}

const formData: SchemaForm = {
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      autocomplete: 'off'
    },
    {
      as: Textarea,
      name: 'description',
      label: 'Description',
      rows: 4
    },
    {
      as: Calendar,
      type: 'calender',
      name: 'date',
      label: 'Date',
      required: true
    }
  ],
  validationSchema: HRHolidayCreateInputSchema,
  initialValues: props.holiday ? props.holiday : undefined,
  btnText: props.holiday ? 'Update' : 'Submit'
};
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    :primary-btn-loading="isLoading"
    @submit="onSubmit"
  />
</template>
