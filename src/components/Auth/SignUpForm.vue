<script setup lang="ts">
import type { SignUpPayload, SignUpResponse } from '@/types/auth.type';
import { SignUpPayloadSchema } from '@/types/auth.type';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import { useMutation } from 'vue-query';

const props = defineProps<{
  email?: string;
}>();

const emit = defineEmits<{
  (e: 'success', data: SignUpResponse): void;
}>();

dayjs.extend(timezone);

const { checkPasswordRule, strongRegEx } = usePasswordValidator();
const router = useRouter();

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: SignUpPayloadSchema,
  initialValues: {
    email: props.email as string,
    password: null,
    confirmPassword: null,
    acceptTerms: false
  }
});

const { value: email } = useField<string>('email');
const { value: password } = useField<string>('password');
const { value: confirmPassword } = useField<string>('confirmPassword');
const { value: acceptTerms } = useField<string>('acceptTerms');

const { isLoading, mutateAsync: signUp } = useMutation(
  (payload: SignUpPayload) => {
    const userTimeZone = dayjs.tz.guess();
    return useAuthSignUp({ ...payload, timezone: userTimeZone });
  },
  {
    onSuccess: (data) => {
      emit('success', data);
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await signUp(values as unknown as SignUpPayload);
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
        disabled
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
          :feedback="false"
        />
      </transition>
    </div>
    <div
      class="field-checkbox mb-1"
      :class="{ 'p-invalid': errors.acceptTerms }"
    >
      <Checkbox
        v-model="acceptTerms"
        input-id="acceptTerms"
        name="option"
        value="true"
        :binary="true"
      />
      <label for="acceptTerms" class="line-height-2 text-sm">
        I agree to BrightReturn's
        <a
          :href="`${'https://mudrantar.com/usa/terms-and-conditions.html'}`"
          target="_blank"
          class="underline"
        >Terms of Services</a>
        and acknowledge the Privacy Policy.
      </label>
    </div>
    <transition mode="out-in" name="field-slide-down">
      <FormFeedbackMessage
        success-class="font-medium"
        :errors="errors"
        :values="values"
        error-key="acceptTerms"
        :feedback="false"
      />
    </transition>
    <Button
      label="Sign up"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto mt-4"
    />
  </form>
  <div class="font-medium mt-4 text-left">
    <a
      class="text-base mt-2 cursor-pointer"
      :to="{ name: 'auth-signin' }"
      @click.prevent="router.push({ name: 'auth-signin' })"
    >
      Sign in as different user
    </a>
  </div>
</template>
