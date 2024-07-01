<script lang="ts" setup>
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import { OrgCreatePayloadSchema } from '@/types/myaccount.type';
import type { SchemaFormRef } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import InputText from 'primevue/inputtext';

const { initToast } = useToasts();
const { assignObj1ToObj2 } = useUtilityFns();
const queryClient = useQueryClient();

// const formValues = ref<Org>();
const orgUpdateRef = ref<SchemaFormRef | null>(null);

const formKey = ref(0);

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});

const { mutateAsync: createUpdateOrg } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organization Time Zone Update',
        detail: 'Organization Time Zone updated successfully'
      });
    }
  }
);

const allTimeZones = computed(() => {
  return Intl.supportedValuesOf('timeZone').map((zone: string) => {
    return { name: zone, value: zone };
  });
});

const orgInitialValues = computed(() => {
  return {
    name: orgDetails.value?.name,
    timezone: orgDetails.value?.timezone
  };
});
const formData = computed(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Name',
        required: true,
        autocomplete: 'off',
        placeholder: 'Name',
        hide: true
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'timezone',
        label: 'TimeZone',
        autocomplete: 'off',
        placeholder: 'Select Time Zone',
        formGridClass: 'md:col-4',
        optionLabel: 'name',
        optionValue: 'value',
        options: allTimeZones.value
      }
    ],
    initialValues: orgInitialValues,
    validationSchema: OrgCreatePayloadSchema,
    btnText: 'Submit'
  };
});

function createOrgPayload(values: Partial<Org>) {
  let payload: Partial<OrgCreatePayload> = {
    ...values
  } as Partial<OrgCreatePayload>;
  payload = assignObj1ToObj2(payload, {}, true);
  return payload;
}
function onSubmit(values: Partial<Org>) {
  createUpdateOrg(createOrgPayload(values));
}

watch(
  () => orgDetails.value,
  (val) => {
    if (val) {
      orgUpdateRef.value?.setValues({
        ...orgUpdateRef.value?.schemaFormValues,
        name: val.name,
        timezone: val.timezone
      });
    }
  },
  {
    deep: true,
    immediate: true
  }
);
</script>

<template>
  <CommonSchemaForm
    ref="orgUpdateRef"
    :key="formKey"
    :data="formData"
    @submit="onSubmit"
  />
</template>
