<script setup lang="ts">
import {
  ClientPortalSettingSchema,
  type ClientPortalSettingPayload,
} from '@/types/portal-setting.type';
import type { Org } from '@/types/myaccount.type';
import { useMutation, useQueryClient } from 'vue-query';

import InputSwitch from 'primevue/inputswitch';

const props = defineProps<{
  orgPortalData?: Org;
}>();
const queryClient = useQueryClient();

const { initToast } = useToasts();
const { metaFilter } = useUtilityFns();

const { orgPortalData: orgData } = toRefs(props);
const { handleSubmit, errors, meta, validateField } = useForm({
  validationSchema: ClientPortalSettingSchema,
  initialValues: {
    enablePortal: orgData?.value?.meta
      ? metaFilter(orgData.value.meta, 'enablePortal') == 'true'
        ? true
        : false
      : null,
    enablePortalProjectTracking: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enablePortalProjectTracking') == 'true'
        ? true
        : false
      : null,
    enablePortalTaskTracking: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enablePortalTaskTracking') == 'true'
        ? true
        : false
      : null,
    enablePortalBrightDesk: orgData?.value?.meta
      ? metaFilter(orgData.value.meta, 'enablePortalBrightDesk') == 'true'
        ? true
        : false
      : null,
    enablePortalDocuments: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enablePortalDocuments') == 'true'
        ? true
        : false
      : null,
  },
});
const hideOther = computed(() => {
  if (enablePortal.value) return true;
  return false;
});
const { isLoading, mutateAsync: createUpdateOrg } = useMutation(
  (payload: Partial<ClientPortalSettingPayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organization Portal Details Update',
        detail: 'Organization Portal Details updated successfully',
      });
      queryClient.invalidateQueries('org-data');
    },
  }
);

const { value: enablePortal } = useField<string>('enablePortal');
const { value: enablePortalProjectTracking } = useField<string>(
  'enablePortalProjectTracking'
);
const { value: enablePortalTaskTracking } = useField<string>(
  'enablePortalTaskTracking'
);
const { value: enablePortalBrightDesk } = useField<string>(
  'enablePortalBrightDesk'
);
const { value: enablePortalDocuments } = useField<string>(
  'enablePortalDocuments'
);

const onSubmit = handleSubmit(async (values: Record<string, any>) => {
  const {
    enablePortalProjectTracking,
    enablePortalTaskTracking,
    enablePortalBrightDesk,
    enablePortalDocuments,
  } = values;
  const payload = {
    name: orgData?.value?.name,
    enablePortalProjectTracking: enablePortalProjectTracking ? 'true' : 'false',
    enablePortalTaskTracking: enablePortalTaskTracking ? 'true' : 'false',
    enablePortalBrightDesk: enablePortalBrightDesk ? 'true' : 'false',
    enablePortalDocuments: enablePortalDocuments ? 'true' : 'false',
  };
  await createUpdateOrg(payload as unknown as ClientPortalSettingPayload);
});

const handlePortal = async (values: boolean) => {
  const payload = {
    name: orgData?.value?.name,
    enablePortal: values ? 'true' : 'false',
  };
  await createUpdateOrg(payload as unknown as ClientPortalSettingPayload);
};
</script>

<template>
  <div class="flex justify-content-between align-items-center">
    <div class="flex p-3 column-gap-5 align-items-center mt-1">
      <label for="enablePortal" class="mb-0 mr-3 font-medium text-900 text-lg">
        Client Portal Access
      </label>
      <span class="inline-flex cursor-pointer">
        <InputSwitch
          inputId="enablePortal"
          v-model="enablePortal"
          @input="handlePortal"
          :class="{ 'p-invalid': errors['enablePortal'] }"
        />
      </span>
      <p class="p-error" v-if="errors.enablePortal">
        {{ errors.enablePortal }}
      </p>
    </div>
    <a
      href="https://brightreturn.com/kb/accounting-client-portal"
      target="_blank"
    >
      <Button
        type="button"
        icon="pi pi-question-circle text-lg"
        v-tooltip.top="'Need Help'"
        class="p-button-icon-only p-button-rounded mr-2"
      />
    </a>
  </div>
  <form @submit="onSubmit" class="md:w-6 lg:w-7 xl:w-7 p-3">
    <div
      v-if="hideOther"
      class="mx-auto p-3 border-1 border-gray-100 border-round-md"
    >
      <div class="field flex justify-content-between">
        <div class="flex flex-column justify-content-between">
          <label
            for="enablePortalProjectTracking"
            class="mb-0 mr-3 font-medium text-900 text-base"
          >
            Work Tracking
          </label>
          <label
            for="enablePortalProjectTracking"
            class="mb-0 mr-3 font-small text-600 text-base"
          >
            Enable real-time client tracking to reduce status inquiry calls.
          </label>
        </div>
        <span class="inline-flex cursor-pointer">
          <InputSwitch
            inputId="name"
            v-model="enablePortalProjectTracking"
            :class="{ 'p-invalid': errors['enablePortalProjectTracking'] }"
          />
        </span>
        <p class="p-error" v-if="errors.enablePortalProjectTracking">
          {{ errors.enablePortalProjectTracking }}
        </p>
      </div>
      <div class="field flex justify-content-between">
        <div class="flex flex-column justify-content-between">
          <label
            for="enablePortalTaskTracking"
            class="mb-0 mr-3 font-medium text-900 text-base"
          >
            Task Management
          </label>
          <label
            for="enablePortalProjectTracking"
            class="mb-0 mr-3 font-small text-600 text-base"
          >
            Efficiently request documents and information from clients.
          </label>
        </div>
        <span class="inline-flex cursor-pointer">
          <InputSwitch
            inputId="enablePortalTaskTracking"
            v-model="enablePortalTaskTracking"
            :class="{ 'p-invalid': errors['enablePortalTaskTracking'] }"
          />
        </span>
        <p class="p-error" v-if="errors.enablePortalTaskTracking">
          {{ errors.enablePortalTaskTracking }}
        </p>
      </div>
      <div class="field flex justify-content-between">
        <div class="flex flex-column justify-content-between">
          <label
            for="enablePortalBrightDesk"
            class="mb-0 mr-3 font-medium text-900 text-base"
          >
            BrightDesk (HelpDesk)
          </label>
          <label
            for="enablePortalProjectTracking"
            class="mb-0 mr-3 font-small text-600 text-base"
          >
            Enhance client experience with support ticket submissions and
            improved SLA.
          </label>
        </div>
        <span class="inline-flex cursor-pointer">
          <InputSwitch
            inputId="enablePortalBrightDesk"
            v-model="enablePortalBrightDesk"
            :class="{ 'p-invalid': errors['enablePortalBrightDesk'] }"
          />
        </span>
        <p class="p-error" v-if="errors.enablePortalBrightDesk">
          {{ errors.enablePortalBrightDesk }}
        </p>
      </div>
      <div class="field flex justify-content-between">
        <div class="flex flex-column justify-content-between">
          <label
            for="enablePortalDocuments"
            class="mb-0 mr-3 font-medium text-900 text-base"
          >
            Document Management (Share, Download)
          </label>
          <label
            for="enablePortalProjectTracking"
            class="mb-0 mr-3 font-small text-600 text-base"
          >
            Enable seamless document sharing and exchange.
          </label>
        </div>
        <span class="inline-flex cursor-pointer">
          <InputSwitch
            inputId="enablePortalDocuments"
            v-model="enablePortalDocuments"
            :class="{ 'p-invalid': errors['enablePortalDocuments'] }"
          />
        </span>
        <p class="p-error" v-if="errors.enablePortalDocuments">
          {{ errors.enablePortalDocuments }}
        </p>
      </div>
      <div class="flex justify-content-end text-center mt-4">
        <Button
          label="Submit"
          :loading="isLoading"
          :disabled="!meta.valid"
          type="submit"
        ></Button>
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
