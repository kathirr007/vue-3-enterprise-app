<script setup lang="ts">
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import { Dropdown } from 'floating-vue';
import { BillingProfileSelectionSchema } from '@/types/client-billing.type';
import { useQuery } from 'vue-query';

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'modalClose'): void;
}>();

const router = useRouter();
const { getAll: getAllBillingProfiles } = useClientBilling();

const formKey = ref(0);
const selectedProfileId = ref();
const formRef = ref<SchemaFormRef>();

const { data: billingProfiles, isLoading, isFetching } = useQuery('billing-profiles', () => {
  return getAllBillingProfiles({});
});

async function setFormValues() {
  formRef.value?.setValues({
    ...formRef.value.schemaFormValues,
    billingProfileId:
            selectedProfileId.value
              ? selectedProfileId.value
              : undefined

  });
}

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'billingProfileId',
        label: `${$tConfig('CLIENT_BILLING_PROFILE')}`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `Select ${$tConfig('CLIENT_BILLING_PROFILE')}`,
        showClear: true,
        required: true,
        options: billingProfiles.value?.results || [],
        loading: isLoading.value || isFetching.value
      }
    ],
    validationSchema: BillingProfileSelectionSchema,
    btnText: 'Create Invoice',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});

async function onSubmit(values: any) {
  router.replace({
    name: 'admin-billing',
    query: {
      billingId: selectedProfileId.value, quickstart: `true`
    }
  });
  emit('modalClose');
}

async function handleDropdownChange(val: any, name: string) {
  if (name === 'billingProfileId') {
    selectedProfileId.value = val.billingProfileId;
    setFormValues();
  }
}

function handleCancel() {
  emit('modalClose');
}
</script>

<template>
  <CommonSchemaForm
    ref="formRef" :data="formData" :form-key="formKey"
    @secondary-btn-click="handleCancel" @submit="onSubmit" @dropdown-change="handleDropdownChange"
  />
</template>
