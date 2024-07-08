<script setup lang="ts">
import {
  type ClientPortalSettingPayload,
  ClientPortalSettingSchema
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
      ? metaFilter(orgData.value.meta, 'enablePortal') === 'true'
      : null,
    enablePortalProjectTracking: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enablePortalProjectTracking') === 'true'
      : null,
    enablePortalTaskTracking: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enablePortalTaskTracking') === 'true'
      : null,
    enablePortalBrightDesk: orgData?.value?.meta
      ? metaFilter(orgData.value.meta, 'enablePortalBrightDesk') === 'true'
      : null,
    enablePortalDocuments: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enablePortalDocuments') === 'true'
      : null
  }
});
const hideOther = computed(() => {
  if (enablePortal.value)
    return true;
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
        detail: 'Organization Portal Details updated successfully'
      });
      queryClient.invalidateQueries('org-data');
    }
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
    enablePortalDocuments
  } = values;
  const payload = {
    name: orgData?.value?.name,
    enablePortalProjectTracking: enablePortalProjectTracking ? 'true' : 'false',
    enablePortalTaskTracking: enablePortalTaskTracking ? 'true' : 'false',
    enablePortalBrightDesk: enablePortalBrightDesk ? 'true' : 'false',
    enablePortalDocuments: enablePortalDocuments ? 'true' : 'false'
  };
  await createUpdateOrg(payload as unknown as ClientPortalSettingPayload);
});

async function handlePortal(values: boolean) {
  const payload = {
    name: orgData?.value?.name,
    enablePortal: values ? 'true' : 'false'
  };
  await createUpdateOrg(payload as unknown as ClientPortalSettingPayload);
}
</script>

<template>
  <div class="flex justify-content-between align-items-center">
    <div class="flex p-3 column-gap-5 align-items-center mt-1">
      <label for="enablePortal" class="mb-0 mr-3 font-medium text-900 text-lg">
        Client Portal Access
      </label>
      <span class="inline-flex cursor-pointer">
        <InputSwitch
          v-model="enablePortal"
          input-id="enablePortal"
          :class="{ 'p-invalid': errors.enablePortal }"
          @input="handlePortal"
        />
      </span>
      <p v-if="errors.enablePortal" class="p-error">
        {{ errors.enablePortal }}
      </p>
    </div>
    <a
      href="https://brightreturn.com/kb/accounting-client-portal"
      target="_blank"
    >
      <Button
        v-tooltip.top="'Need Help'"
        type="button"
        icon="pi pi-question-circle text-lg"
        class="p-button-icon-only p-button-rounded mr-2"
      />
    </a>
  </div>
  <form class="md:w-6 lg:w-7 xl:w-7 p-3" @submit="onSubmit">
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
            v-model="enablePortalProjectTracking"
            input-id="name"
            :class="{ 'p-invalid': errors.enablePortalProjectTracking }"
          />
        </span>
        <p v-if="errors.enablePortalProjectTracking" class="p-error">
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
            v-model="enablePortalTaskTracking"
            input-id="enablePortalTaskTracking"
            :class="{ 'p-invalid': errors.enablePortalTaskTracking }"
          />
        </span>
        <p v-if="errors.enablePortalTaskTracking" class="p-error">
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
            v-model="enablePortalBrightDesk"
            input-id="enablePortalBrightDesk"
            :class="{ 'p-invalid': errors.enablePortalBrightDesk }"
          />
        </span>
        <p v-if="errors.enablePortalBrightDesk" class="p-error">
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
            v-model="enablePortalDocuments"
            input-id="enablePortalDocuments"
            :class="{ 'p-invalid': errors.enablePortalDocuments }"
          />
        </span>
        <p v-if="errors.enablePortalDocuments" class="p-error">
          {{ errors.enablePortalDocuments }}
        </p>
      </div>
      <div class="flex justify-content-end text-center mt-4">
        <Button
          label="Submit"
          :loading="isLoading"
          :disabled="!meta.valid"
          type="submit"
        />
      </div>
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
