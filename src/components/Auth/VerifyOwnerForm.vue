<script setup lang="ts">
import type { VerifyPayload } from '@/types/verify.type';
import { VerifyPayloadSchemaIsOwner } from '@/types/verify.type';
import { useRouteQuery } from '@vueuse/router';
import { useMutation } from 'vue-query';

const { initToast } = useToasts();

const routers = useRouter();
const props = defineProps<{
  email?: string;
}>();

const { verifySignUp } = useAuthVerify();

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: VerifyPayloadSchemaIsOwner,
  initialValues: {
    email: props.email as string,
    firstName: null,
    lastName: null,
    orgName: null,
  },
});

const { value: email } = useField<string>('email');
const { value: firstName } = useField<string>('firstName');
const { value: lastName } = useField<string>('lastName');
const { value: orgName } = useField<string>('orgName');

const { isLoading, mutateAsync: verifyAccount } = useMutation(
  (payload: VerifyPayload) => {
    return verifySignUp(payload);
  },
  {
    onSuccess: (data) => {
      initToast({
        title: 'User Verification ',
        actionType: 'Update',
        actionObj: { ...data },
        detail: `${data.email} is verified successfully`,
      });

      routers.replace({ name: 'settings' });
    },
  }
);

const onSubmitData = handleSubmit(async (values) => {
  const { firstName, lastName, email, orgName } = values;
  const key = useRouteQuery<string>('key');

  const verifyPayloadData = {
    firstName,
    lastName,
    email,
    key,
    orgName,
  };
  await verifyAccount(verifyPayloadData as unknown as VerifyPayload);
});
</script>

<template>
  <form @submit="onSubmitData" class="text-left">
    <div class="field">
      <label for="orgName" class="block font-medium text-900">
        Organization Name
        <span class="text-red-600">*</span>
      </label>
      <InputText
        id="orgName"
        v-model="orgName"
        type="text"
        class="w-full"
        :class="{ 'p-invalid': errors['orgName'] }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :success-class="'font-medium'"
          :errors="errors"
          :values="values"
          :errorKey="'orgName'"
        />
      </transition>
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
          :errorKey="'email'"
        />
      </transition>
    </div>

    <Button
      label="Sign up"
      :disabled="!meta.valid"
      :loading="isLoading"
      type="submit"
      class="block mx-auto mt-4"
    ></Button>
  </form>
</template>
