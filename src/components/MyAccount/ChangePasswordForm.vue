<script setup lang="ts">
import type { ChangePasswordPayload } from '@/types/auth.type';
import { ChangePasswordSchema } from '@/types/auth.type';
import { useMutation } from 'vue-query';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { checkPasswordRule, strongRegEx } = usePasswordValidator();
const { currentUser } = useCurrentUserData();
const { initToast } = useToasts();
const { isPortalUser } = useCurrentUserData();
const { handleSubmit, errors, values, meta, resetForm } = useForm({
  validationSchema: ChangePasswordSchema,
  initialValues: {
    email: currentUser.value?.email,
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
});

const { value: oldPassword } = useField<string>('oldPassword');
const { value: newPassword } = useField<string>('newPassword');
const { value: confirmPassword } = useField<string>('confirmPassword');

const { isLoading, mutateAsync: changePassword } = useMutation(
  (payload: ChangePasswordPayload) => {
    return useChangePassword(payload, isPortalUser.value);
  },
  {
    onSuccess: () => {
      emit('success');
      resetForm();
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await changePassword({
    email: values.email as string,
    oldPassword: values.oldPassword,
    newPassword: values.newPassword
  });
  initToast({
    title: 'Change Password',
    actionType: 'Update',
    detail: `Password was changed successfully. New password will take effect in next login.`
  });
});
</script>

<template>
  <form class="text-left grid formgrid" @submit="onSubmit">
    <div class="field col-12 md:col-6">
      <label for="oldPassword" class="block font-medium text-900">
        Old Password
        <span class="text-red-600">*</span>
      </label>
      <Password
        id="oldPassword"
        v-model="oldPassword"
        name="oldPassword"
        toggle-mask
        :feedback="false"
        class="w-full"
        :class="{ 'p-invalid': errors.oldPassword }"
        :strong-regex="strongRegEx"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :feedback="false"
          :values="values"
          error-key="oldPassword"
        />
      </transition>
    </div>
    <div class="md:col-6" />
    <div class="field col-12 md:col-6">
      <label for="newPassword" class="block font-medium text-900">
        New Password
        <span class="text-red-600">*</span>
      </label>
      <Password
        id="newPassword"
        v-model="newPassword"
        name="newPassword"
        toggle-mask
        class="w-full"
        :class="{ 'p-invalid': errors.newPassword }"
        :strong-regex="strongRegEx"
      >
        <template #footer="sp: any">
          {{ sp.level }}
          <Divider />
          <p class="mt-2">
            Suggestions
          </p>
          <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5;">
            <li
              :class="{
                'text-green-500': checkPasswordRule('lower', newPassword),
              }"
            >
              At least one lowercase
            </li>
            <li
              :class="{
                'text-green-500': checkPasswordRule('upper', newPassword),
              }"
            >
              At least one uppercase
            </li>
            <li
              :class="{
                'text-green-500': checkPasswordRule('number', newPassword),
              }"
            >
              At least one numeric
            </li>
            <li
              :class="{
                'text-green-500': checkPasswordRule('symbol', newPassword),
              }"
            >
              At least one symbol
            </li>
            <li
              :class="{
                'text-green-500': newPassword && newPassword.length >= 8,
              }"
            >
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
          error-key="newPassword"
        />
      </transition>
    </div>
    <div class="field col-12 md:col-6">
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
    <div class="col-12">
      <Button
        label="Submit"
        :disabled="!meta.valid"
        :loading="isLoading"
        type="submit"
        class="block ml-auto"
      />
    </div>
  </form>
</template>
