<script setup lang="ts">
import type { CommonUserType } from '@/types/common.type';
import type { VerifyPayload, VerifyUserDetails } from '@/types/verify.type';
import {
  VerifyPayloadSchemaIsOwner,
  VerifyPayloadSchema,
} from '@/types/verify.type';

import { useRouteQuery } from '@vueuse/router';
import { useMutation, useQuery } from 'vue-query';

const props = defineProps<{
  verifyUserData: VerifyUserDetails;
}>();
const { assignObj1ToObj2 } = useUtilityFns();
const { initToast } = useToasts();
const key = useRouteQuery<string>('key');
const router = useRouter();

const { checkPasswordRule, strongRegEx } = usePasswordValidator();

const handleExpiredVerificaiton = () => {
  initToast({
    severity: 'info',
    actionType: 'Update',
    summary: 'User Verification',
    detail:
      'Verification link got expired. Please try signin with registered email.',
  });
  router.push({ name: 'auth-signin' });
};

const { verifySignUp } = useAuthVerify();

const isOwner = computed(
  () =>
    ((props.verifyUserData?.type as CommonUserType) === 'ORG_USER' ||
      (props.verifyUserData?.type as CommonUserType) ===
        'OUTSOURCED_ORG_USER') &&
    props.verifyUserData?.isOwner
);

const isClientUser = computed(
  () => (props.verifyUserData?.type as CommonUserType) === 'CLIENT_USER'
);
const verificationSchema = computed(() => {
  return isOwner.value === true
    ? VerifyPayloadSchemaIsOwner
    : VerifyPayloadSchema;
});

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: verificationSchema,
});

const { value: email } = useField<string>('email');
const { value: password } = useField<string>('password');
const { value: firstName } = useField<string>('firstName');
const { value: lastName } = useField<string>('lastName');
const { value: confirmPassword } = useField<string>('confirmPassword');
const { value: orgName } = useField<string>('orgName');

watchEffect(() => {
  if (props.verifyUserData) {
    email.value = props.verifyUserData.email;
    firstName.value = props.verifyUserData.firstName;
    orgName.value = (
      props.verifyUserData.org || props.verifyUserData.userClients[0].client.org
    ).name;
  }
});

const showToast = () => {
  return initToast({
    title: 'User Verification ',
    actionType: 'Update',
    actionObj: { email: props.verifyUserData?.email },
    detail: `<strong>${props.verifyUserData?.email}</strong> is verified successfully`,
  });
};

const { isLoading, mutateAsync: verifyAccount } = useMutation(
  (payload: VerifyPayload) => {
    return verifySignUp(payload);
  },
  {
    onSuccess: async () => {
      showToast();
      useDebounceFn(() => {
        router.go(0);
      }, 3000)();
    },
    onError: () => {
      handleExpiredVerificaiton();
    },
  }
);

const onSubmit = handleSubmit(async (values) => {
  let payload: { [key: string]: unknown } = { key: key.value };
  payload = assignObj1ToObj2(values, payload);
  await verifyAccount(payload as unknown as VerifyPayload);
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <Card v-if="!isOwner" class="mb-4 cpa-details-wrapper">
    <template #content>
      <AuthVerifyHeader
        :verifyUserData="verifyUserData"
        :isClientUser="isClientUser"
      />
    </template>
  </Card>
  <form @submit="onSubmit" class="text-left">
    <div class="field" v-if="isClientUser">
      <label for="orgName" class="block font-medium text-900">
        Your Organization Name
        <!-- <span class="text-red-600">*</span> -->
      </label>
      <InputText
        id="orgName"
        v-model="orgName"
        type="text"
        class="w-full"
        disabled
        :class="{ 'p-invalid': errors['orgName'] }"
      />
    </div>
    <div class="field">
      <label for="firstName" class="block font-medium text-900">
        First Name
        <span class="text-red-600">*</span>
      </label>
      <InputText
        id="firstName"
        v-model="firstName"
        type="text"
        class="w-full"
        :class="{ 'p-invalid': errors['firstName'] }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :success-class="'font-medium'"
          :errors="errors"
          :feedback="false"
          :values="values"
          :errorKey="'firstName'"
        />
      </transition>
    </div>
    <div class="field">
      <label for="firstName" class="block font-medium text-900">
        Last Name
        <span class="text-red-600">*</span>
      </label>
      <InputText
        id="lastName"
        v-model="lastName"
        type="text"
        class="w-full"
        :class="{ 'p-invalid': errors['lastName'] }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :success-class="'font-medium'"
          :errors="errors"
          :feedback="false"
          :values="values"
          :errorKey="'lastName'"
        />
      </transition>
    </div>
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
        :class="{ 'p-invalid': errors['email'] }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :success-class="'font-medium'"
          :errors="errors"
          :values="values"
          :feedback="false"
          :errorKey="'email'"
        />
      </transition>
    </div>
    <template v-if="!isOwner">
      <div class="field">
        <label for="password" class="block font-medium text-900">
          Password
          <span class="text-red-600">*</span>
        </label>
        <Password
          id="password"
          name="password"
          v-model="password"
          toggleMask
          class="w-full"
          :class="{ 'p-invalid': errors['password'] }"
          :strong-regex="strongRegEx"
        >
          <template #footer="sp: any">
            {{ sp.level }}
            <Divider />
            <p class="mt-2">Suggestions</p>
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
              <li
                :class="{ 'text-green-500': password && password.length >= 8 }"
              >
                Minimum 8 characters
              </li>
            </ul>
          </template>
        </Password>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :success-class="'font-medium'"
            :errors="errors"
            :values="values"
            :errorKey="'password'"
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
          name="confirmPassword"
          v-model="confirmPassword"
          toggleMask
          :feedback="false"
          class="w-full"
          :class="{ 'p-invalid': errors['confirmPassword'] }"
          :strong-regex="strongRegEx"
        >
        </Password>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :success-class="'font-medium'"
            :errors="errors"
            :values="values"
            :errorKey="'confirmPassword'"
            :feedback="false"
          />
        </transition>
      </div>
    </template>

    <Button
      label="Verify & Login"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto mt-4"
    ></Button>

    <div class="font-medium mt-4">
      <a
        class="text-base mt-2 cursor-pointer"
        :to="{ name: 'auth-signin' }"
        @click.prevent="router.push({ name: 'auth-signin' })"
      >
        Sign in as different user
      </a>
    </div>
  </form>
</template>

<style lang="scss" scoped>
:deep(.p-card-content) {
  padding: 0;
}
</style>
