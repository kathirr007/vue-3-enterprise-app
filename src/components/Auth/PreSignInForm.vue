<script setup lang="ts">
import { useMutation } from 'vue-query';
import type { PreLoginPayload, PreLoginResponse } from '@/types/auth.type';
import { PreLoginPayloadSchema } from '@/types/auth.type';

const emit = defineEmits<{
  (e: 'success', value: PreLoginResponse): void;
}>();

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: PreLoginPayloadSchema
});

const { value: email } = useField<string>('email');

const { isLoading, mutateAsync: preLogin } = useMutation(
  (payload: PreLoginPayload) => {
    return useAuthPreLogin(payload);
  },
  {
    onSuccess: (data) => {
      emit('success', data);
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await preLogin(values as PreLoginPayload);
});
</script>

<template>
  <form class="text-left" @submit="onSubmit">
    <div class="field">
      <label for="email" class="block font-medium text-900">
        Email
        <span class="text-red-600">*</span>
      </label>
      <InputText
        id="email"
        v-model="email"
        type="email"
        class="w-full"
        :class="{ 'p-invalid': errors.email }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          error-key="email"
        />
      </transition>
    </div>
    <Button
      label="Continue"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto"
    />
  </form>
</template>
