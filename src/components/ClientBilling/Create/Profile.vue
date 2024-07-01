<script setup lang="ts">
import type {
  ClientBillingProfile,
  CreateProfilePayload
} from '@/types/client-billing.type';

import { CreateProfileNameSchema } from '@/types/client-billing.type';

const props = defineProps<{
  profileClient?: ClientBillingProfile;
  create?: boolean;
  loading?: boolean;
  apiKey?: number;
}>();
const emit = defineEmits<{
  (e: 'back', step: 'profile'): void;
  (
    e: 'profile',
    value: CreateProfilePayload | ClientBillingProfile,
    id?: string
  ): void;
}>();
const route = useRoute();
const { getOrgIntegration } = useIntegrations();

const clientBillingId = ref<string>(route.params.id as string);

const { handleSubmit, errors, values, meta } = useForm({
  validationSchema: CreateProfileNameSchema,
  initialValues: {
    name: props.profileClient ? props.profileClient.name : ''
  }
});

const { value: name } = useField<string>('name');

const onSubmit = handleSubmit((formValues) => {
  const selectedId = clientBillingId.value
    ? `${clientBillingId.value}`
    : undefined;
  let addressJSON: any;
  let payload: any;
  if (props.profileClient) {
    const {
      state,
      city,
      country,
      address,
      name,
      orgIntegration,
      orgIntegrationId,
      ...rest
    } = props.profileClient as ClientBillingProfile;

    addressJSON = {
      state,
      city,
      country,
      zipcode: props.profileClient?.zipcode
        ? `${props.profileClient?.zipcode}`
        : undefined,
      street: props.profileClient?.address
    };

    payload = {
      orgIntegration,
      orgIntegrationId: orgIntegration ? orgIntegration.id : null,
      ...rest,
      address: addressJSON
    };
  }

  if (selectedId) {
    emit(
      'profile',
      {
        ...payload,
        ...formValues,
        isPaymentGatewayIntegrated: false
      } as unknown as ClientBillingProfile,
      selectedId
    );
  }
  else {
    emit('profile', {
      ...formValues,
      isPaymentGatewayIntegrated: false
    } as CreateProfilePayload);
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <form class="text-left" @submit="onSubmit">
    <div class="field w-full md:pr-4">
      <label for="email" class="block font-medium text-900">
        Profile Name
        <span class="text-red-600">*</span>
      </label>
      <InputText
        id="name"
        v-model="name"
        type="name"
        class="w-full"
        :class="{ 'p-invalid': errors.name }"
      />
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          success-class="font-medium"
          :errors="errors"
          :values="values"
          :feedback="false"
          error-key="name"
        />
      </transition>
    </div>
    <div class="flex justify-content-between mt-4">
      <Button
        v-if="props.create"
        class="max-w-max mr-auto p-button-text"
        label="Back"
        icon="pi pi-chevron-left"
        @click="emit('back', 'profile')"
      />
      <Button
        class="max-w-max ml-auto"
        :disabled="!meta.valid"
        type="submit"
        :label="props.create ? 'Next' : 'Submit'"
        :loading="loading"
      />
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
