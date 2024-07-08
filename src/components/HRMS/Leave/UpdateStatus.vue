<script setup lang="ts">
import { useField, useForm } from 'vee-validate';
import type { HRLeaveActionsInput, LeaveStatus } from '@/types/hrms.type';
import { HRLeaveActionsInputSchema } from '@/types/hrms.type';
import { useMutation } from 'vue-query';

const props = defineProps<{
  currentLeaveId: string;
  status: LeaveStatus;
}>();

const emits = defineEmits(['success']);

const { handleSubmit, errors, meta, validate, values } = useForm({
  initialValues: {
    isReject: props.status === 'REJECTED',
    approverComment: undefined
  },
  validationSchema: HRLeaveActionsInputSchema
});
const { updateStatus } = useHrmsLeaves();

const { value: approverComment } = useField<string>('approverComment');

const { isLoading, mutateAsync: updateLeaveStatus } = useMutation(
  (payload: HRLeaveActionsInput) => {
    return updateStatus(props.currentLeaveId, payload);
  },
  {
    onSuccess: () => {
      emits('success');
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  const paylaod = {
    ...values,
    status: props.status
  };
  updateLeaveStatus(paylaod as unknown as HRLeaveActionsInput);
});
const labelText = computed(() => {
  if (props.status) {
    if (props.status === 'CANCELLED')
      return ' Reason For Cancellation';
    if (props.status === 'APPROVED')
      return 'Comment';
    if (props.status === 'REJECTED')
      return 'Reason For Rejection';
  }
});
</script>

<template>
  <form class="grid p-fluid formgrid" @submit="onSubmit">
    <div class="field col-12 md:col-12">
      <label for="approverComment" class="block font-medium text-900">
        {{ labelText }}
        <span v-if="status === 'REJECTED'" class="text-red-500">*</span>
      </label>
      <Textarea
        id="approverComment"
        v-model="approverComment"
        type="name"
        class="w-full"
        rows="5"
        :class="{ 'p-invalid': errors.approverComment }"
        @blur="validate()"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :feedback="false"
          :values="values"
          error-key="approverComment"
        />
      </transition>
    </div>

    <div class="flex justify-content-end ml-auto col-12">
      <Button
        class="p-button-primary w-8rem block"
        type="submit"
        label="Confirm"
        :disabled="!meta.valid || isLoading"
        :loading="isLoading"
      />
    </div>
  </form>
</template>
