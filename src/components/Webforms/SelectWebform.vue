<script setup lang="ts">
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import { Dropdown } from 'floating-vue';
import { WebformSelectionSchema } from '@/types/webforms.type';

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'modalClose'): void;
}>();

const router = useRouter();
const { getClients } = useCommonListQueries();

const formKey = ref(0);
const selectedClientId = ref();
const formRef = ref<SchemaFormRef>();

const { data: filterDataClient, applyFilter: applyFilterClient }
    = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const {
  data: clientList,
  isLoading: loadingClients,
  isFetching: fetchingClients
} = getClients(true, clientFilters);

async function setFormValues() {
  formRef.value?.setValues({
    ...formRef.value.schemaFormValues,
    clientId:
            selectedClientId.value
              ? selectedClientId.value
              : undefined

  });
}

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'clientId',
        label: `${$tConfig('CLIENT')}`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `Select ${$tConfig('CLIENT').toLowerCase()}`,
        showClear: true,
        required: true,
        options: clientList.value || [],
        loading: loadingClients.value || fetchingClients.value
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'webform',
        label: 'What would you like to do?',
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        options: [
          { id: 2, name: 'Request for details and documents' },
          { id: 1, name: 'Share agreement' }
        ],
        placeholder: 'Please Select',
        showClear: true,
        required: true
      }
    ],
    validationSchema: WebformSelectionSchema,
    btnText: 'Continue',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});

async function onSubmit(values: any) {
  router.replace({
    path: `/admin/clients/${values.clientId}`,
    query: {
      activeIndex: values.webform, quickstart: 'true'
    }
  });
  emit('modalClose');
}

async function handleDropdownChange(val: any, name: string) {
  if (name === 'clientId') {
    selectedClientId.value = val.clientId;
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
