<script setup lang="ts">
import type { OrgCreatePayload, Org } from '@/types/myaccount.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    orgDetails: Org;
  }>(),
  {}
);

const queryClient = useQueryClient();
const { initToast } = useToasts();
const isMFAEnabled = ref<boolean>(false);

const { mutateAsync: createUpdateOrg } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: (data: Org) => {
      if (data) {
        initToast({
          actionType: isMFAEnabled.value ? 'Enable' : 'Disable',
          summary: isMFAEnabled.value ? 'Enable MFA' : 'Disable MFA',
          detail: isMFAEnabled.value
            ? 'Enabled MFA successfully'
            : 'Disabled MFA Successfully',
        });
      }
      queryClient.invalidateQueries('org-data');
    },
  }
);
const { data: orgData } = useQuery('org-data', () => {
  return useOrgDetails();
});

const hanldeToggleMFA = async (val: Event) => {
  if (!isMFAEnabled.value) {
    isMFAEnabled.value = true;
    await createUpdateOrg({
      name: orgData.value?.name,
      isMfaEnabled: true,
    } as Partial<OrgCreatePayload>);
  } else {
    isMFAEnabled.value = false;
    await createUpdateOrg({
      name: orgData.value?.name,
      isMfaEnabled: false,
    } as Partial<OrgCreatePayload>);
  }
};

watchEffect(() => {
  if (props.orgDetails) {
    isMFAEnabled.value = !!props.orgDetails.isMfaEnabled;
  }
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <div class="field flex align-items-center">
    <label
      for="toggleMFA"
      class="cursor-pointer mb-0 mr-3 font-medium text-900 text-base"
      @click="hanldeToggleMFA"
    >
      {{
        `${
          isMFAEnabled
            ? 'Multi Factor Authentication is enabled for your organization.'
            : 'Enable Multi Factor Authentication'
        }`
      }}
    </label>
    <span class="inline-flex cursor-pointer">
      <span class="inline-flex cursor-pointer" @click="hanldeToggleMFA">
        <InputSwitch
          class="pointer-events-none"
          inputId="toggleMFA"
          v-model="isMFAEnabled"
        />
      </span>
    </span>
  </div>
</template>
