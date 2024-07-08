<script setup lang="ts">
import type { ForgotPasswordPayload } from '@/types/auth.type';
import { ForgotPasswordSchema } from '@/types/auth.type';
import { useMutation } from 'vue-query';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: ForgotPasswordSchema
});

const { value: email } = useField<string>('email');

const { isLoading, mutateAsync: forgotPassword } = useMutation(
  (payload: ForgotPasswordPayload) => {
    return useAuthForgotPassword(payload);
  },
  {
    onSuccess: () => {
      emit('success');
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await forgotPassword(values as ForgotPasswordPayload);
});
</script>

<template>
  <form class="text-left" @submit="onSubmit">
    <p class="font-medium mb-0">
      Having trouble logging in?
    </p>
    <ul class="mt-1">
      <li>
        Please enter your registered email id to receive the password reset
        link.
      </li>
    </ul>
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
      label="Share Password Reset Link"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto"
    />
    <div class="font-medium mt-4">
      Do you remember password?
      <router-link class="text-base mt-2" :to="{ name: 'auth-signin' }">
        Sign in.
      </router-link>
    </div>
  </form>
</template>
