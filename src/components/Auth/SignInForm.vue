<script setup lang="ts">
import { useMutation } from 'vue-query';
import type { SignInPayload, SignInResponse } from '@/types/auth.type';
import { SignInPayloadSchema } from '@/types/auth.type';

const props = defineProps<{
  email: string;
}>();

const emit = defineEmits<{
  (
    e: 'success',
    data: { res: SignInResponse; payload: { email: string; password: string } }
  ): void;
  (e: 'prelogin'): void;
}>();

const { strongRegEx } = usePasswordValidator();

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: SignInPayloadSchema,
  initialValues: {
    email: props.email,
    password: null
  }
});

const { value: password } = useField<string>('password');
const { value: emailValue } = useField<string>('email');

const { isLoading, mutateAsync: signIn } = useMutation(
  (payload: SignInPayload) => {
    return useAuthSignIn(payload);
  },
  {
    onSuccess(data) {
      emit('success', {
        res: data,
        payload: { email: emailValue.value, password: password.value }
      });
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await signIn(values as unknown as SignInPayload);
});

function gotoPrelogin() {
  emit('prelogin');
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
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
        v-model="emailValue"
        disabled
        type="email"
        class="w-full"
        :class="{ 'p-invalid': errors.email }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :feedback="false"
          :values="values"
          error-key="email"
        />
      </transition>
    </div>
    <div class="field" :class="{ 'mb-1': errors.password }">
      <label for="password" class="block font-medium text-900">
        Password
        <span class="text-red-600">*</span>
      </label>
      <Password
        id="password"
        v-model="password"
        name="password"
        toggle-mask
        :feedback="false"
        class="w-full"
        :class="{ 'p-invalid': errors.password }"
        :strong-regex="strongRegEx"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          error-key="password"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="font-medium text-right">
      <router-link
        :to="{ name: 'auth-forgotpassword', query: { email } }"
        class="no-underline ml-2 text-blue-500 text-right cursor-pointer"
      >
        Forgot password?
      </router-link>
    </div>
    <Button
      label="Sign in"
      icon="pi pi-user"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto my-4"
    />
    <div class="font-medium">
      Don't have an account yet?
      <a
        class="text-base mt-2 cursor-pointer"
        :to="{ name: 'auth-signin' }"
        @click.prevent="gotoPrelogin"
      >
        Create today!
      </a>
    </div>
  </form>
</template>
