<script setup lang="ts">
import type {
  ClientPortalSettingPayload
} from '@/types/portal-setting.type';
import type { Org } from '@/types/myaccount.type';
import { useMutation, useQueryClient } from 'vue-query';

import InputSwitch from 'primevue/inputswitch';
import {
  type OrgAISettingPayload,
  OrgAISettingSchema
} from '@/types/ai-setting.type';

const props = defineProps<{
  orgPortalData?: Org;
}>();
const queryClient = useQueryClient();

const { initToast } = useToasts();
const { metaFilter } = useUtilityFns();

const { orgPortalData: orgData } = toRefs(props);
const { handleSubmit, errors, meta, validateField } = useForm({
  validationSchema: OrgAISettingSchema,
  initialValues: {
    enableExtraction: orgData?.value?.meta
      ? metaFilter(orgData.value.meta, 'enableExtraction') === 'true'
      : null,
    enableClassification: orgData?.value?.meta
      ? metaFilter(orgData?.value.meta, 'enableClassification') === 'true'
      : null
  }
});
const { isLoading: updatingOrg, mutateAsync: createUpdateOrg } = useMutation(
  (payload: Partial<ClientPortalSettingPayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organization Data Extraction Setting Update',
        detail: 'Organization Data Extraction Setting updated successfully'
      });
      queryClient.invalidateQueries('org-data');
    }
  }
);

const { value: enableExtraction } = useField<boolean>('enableExtraction');
const { value: enableClassification } = useField<boolean>(
  'enableClassification'
);

const onSubmit = handleSubmit(async (values: Record<string, any>) => {
  const { enableExtraction: autoExtract, enableClassification: autoTag }
    = values;
  if (autoExtract || autoExtract === 'true') {
    enableClassification.value = true;
  }
  const payload = {
    name: orgData?.value?.name,
    enableExtraction: autoExtract || autoExtract === 'true' ? 'true' : 'false',
    enableClassification: autoTag || autoTag === 'true' ? 'true' : 'false'
  };
  await createUpdateOrg(payload as unknown as OrgAISettingPayload);
});

async function handleAutoExtraction(value: boolean) {
  if (value) {
    enableClassification.value = true;
  }
  await nextTick();
  onSubmit();
}
</script>

<template>
  <div class="flex flex-column p-3 column-gap-5 mt-1">
    <form
      class="md:w-6 lg:w-7 xl:w-5 p-3 border-1 border-gray-100 border-round-md"
      @submit.stop="onSubmit"
    >
      <div class="field flex justify-content-between">
        <label class="mb-0 mr-3 font-medium text-900 text-lg">
          Auto Extraction
        </label>
        <span class="inline-flex cursor-pointer">
          <InputSwitch
            v-model="enableExtraction"
            input-id="enablePortal"
            @input="handleAutoExtraction"
          />
        </span>
      </div>
      <div class="field flex justify-content-between">
        <label class="mb-0 mr-3 font-medium text-900 text-lg"> Auto Tag </label>
        <span class="inline-flex cursor-pointer">
          <InputSwitch
            v-model="enableClassification"
            input-id="enablePortal"
            :disabled="enableExtraction"
            @change="onSubmit"
          />
        </span>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped></style>
