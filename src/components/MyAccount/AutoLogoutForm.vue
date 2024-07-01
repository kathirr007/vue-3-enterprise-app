<script setup lang="ts">
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import { autoLogoutIntervalSchema } from '@/types/myaccount.type';
import type { SchemaForm } from '@/types/schemaform.type';
import type { UpdateTeamMemberPayload, User } from '@/types/teams.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  interval: string | null | undefined;
  userId: string;
  isSetting?: boolean;
}>();

const { intervalOptions } = useAutoLogout(props.isSetting);

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { currentUser } = useCurrentUserData();

const optionData = computed(() => {
  const result = intervalOptions.filter(
    (val: any) => val.securitySetting === true
  );
  return result;
});

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        label: 'Interval',
        name: 'interval',
        required: true,
        options: optionData.value,
        optionLabel: 'label',
        optionValue: 'value',
        placeholder: 'Select Interval',
        formGridClass: 'md:col-6',
        clearable: false,
        showLabelSlot: true
      }
    ],
    btnText: 'Submit',
    validationSchema: autoLogoutIntervalSchema,
    initialValues: {
      interval: props.interval || intervalOptions.find(e => e.default)?.value
    }
  };
});

const { data: orgData } = useQuery('org-data', () => {
  return useOrgDetails();
});
const { mutateAsync: updateInterval, isLoading: userLoading } = useMutation(
  (payload: UpdateTeamMemberPayload) => {
    return useUserUpdateDetails(props.userId, payload);
  },
  {
    onSuccess: (data: User) => {
      if (data) {
        initToast({
          actionType: 'Update',
          summary: 'Update Interval',
          detail: 'Interval updated successfully'
        });
      }
    }
  }
);
const { mutateAsync: UpdateOrg, isLoading: orgLoading } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: (data: Org) => {
      if (data) {
        initToast({
          actionType: 'Update',
          summary: 'Update Interval',
          detail: 'Interval updated successfully'
        });
      }
    }
  }
);

function onSubmit(values: Record<string, any>) {
  if (props.isSetting) {
    UpdateOrg({
      name: orgData.value?.name,
      autoLogoutInterval: values.interval
    } as Partial<OrgCreatePayload>);
    queryClient.invalidateQueries('org-data');
  }
  else
    updateInterval({
      email: currentUser.value?.email,
      autoLogoutInterval: values.interval
    } as unknown as UpdateTeamMemberPayload);
}
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    :primary-btn-loading="userLoading || orgLoading"
    @submit="onSubmit"
  >
    <template #interval-label="values">
      <span>{{ values.label }}</span>
      <span v-if="values.required" class="text-red-600 ml-1">*</span>
      <i
        v-tooltip="
          'You will get logout from application after selected interval of inactivity'
        "
        class="pi pi-question-circle text-black ml-1 mt-1"
      />
    </template>
  </CommonSchemaForm>
</template>
