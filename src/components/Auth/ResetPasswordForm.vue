<script setup lang="ts">
import type { ResetPasswordPayload } from '@/types/auth.type';
import { ResetPasswordSchema } from '@/types/auth.type';
import { useMutation } from 'vue-query';

const props = defineProps<{
  token: string;
  // email: string;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { checkPasswordRule, strongRegEx } = usePasswordValidator();

const { initToast } = useToasts();

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: ResetPasswordSchema,
  initialValues: {
    email: '',
    password: '',
    confirmPassword: '',
    key: ''
  }
});

// const { value: email } = useField<string>('email');
const { value: password } = useField<string>('password');
const { value: confirmPassword } = useField<string>('confirmPassword');

const { isLoading, mutateAsync: resetPassword } = useMutation(
  (payload: ResetPasswordPayload) => {
    return useAuthResetPassword(payload);
  },
  {
    onSuccess: () => {
      emit('success');
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await resetPassword({
    password: values.password,
    key: props.token
  });
  initToast({
    title: 'Reset Password',
    actionType: 'Update',
    detail: `Password was reset successfully`
  });
});
</script>

<template>
  <form class="text-left" @submit="onSubmit">
    <div class="field">
      <label for="password" class="block font-medium text-900">
        Password
        <span class="text-red-600">*</span>
      </label>
      <Password
        id="password"
        v-model="password"
        name="password"
        toggle-mask
        class="w-full"
        :class="{ 'p-invalid': errors.password }"
        :strong-regex="strongRegEx"
      >
        <template #footer="sp: any">
          {{ sp.level }}
          <Divider />
          <p class="mt-2">
            Suggestions
          </p>
          <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
            <li
              :class="{
                'text-green-500': checkPasswordRule('lower', password),
              }"
            >
              At least one lowercase
            </li>
            <li
              :class="{
                'text-green-500': checkPasswordRule('upper', password),
              }"
            >
              At least one uppercase
            </li>
            <li
              :class="{
                'text-green-500': checkPasswordRule('number', password),
              }"
            >
              At least one numeric
            </li>
            <li
              :class="{
                'text-green-500': checkPasswordRule('symbol', password),
              }"
            >
              At least one symbol
            </li>
            <li :class="{ 'text-green-500': password && password.length >= 8 }">
              Minimum 8 characters
            </li>
          </ul>
        </template>
      </Password>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          error-key="password"
        />
      </transition>
    </div>
    <div class="field">
      <label for="confirmPassword" class="block font-medium text-900">
        Confirm Password
        <span class="text-red-600">*</span>
      </label>
      <Password
        id="confirmPassword"
        v-model="confirmPassword"
        name="confirmPassword"
        toggle-mask
        :feedback="false"
        class="w-full"
        :class="{ 'p-invalid': errors.confirmPassword }"
        :strong-regex="strongRegEx"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          error-key="confirmPassword"
        />
      </transition>
    </div>
    <Button
      label="Submit"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto"
    />
    <div class="font-medium mt-4">
      Don't want to reset password?
      <router-link class="text-base mt-2" :to="{ name: 'auth-signin' }">
        Sign in.
      </router-link>
    </div>
  </form>
</template>
