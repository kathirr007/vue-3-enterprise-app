<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import type {
  Client,
  ClientCreatePayload,
  ClientUpdatePayload,
  ClientUserPayload,
  CreateClientPayload
} from '@/types/client.type';
import {
  ClientCreatePayloadSchema,
  ClientUpdatePayloadSchema
} from '@/types/client.type';
import InputText from 'primevue/inputtext';

import RadioButton from 'primevue/radiobutton';
import FileUpload from 'primevue/fileupload';
import Dropdown from 'primevue/dropdown';
import { useCommonListQueries } from '@/composables/common';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { useRouteQuery } from '@vueuse/router';

import type { APIActions } from '@/types/common.type';
import MultiSelect from 'primevue/multiselect';
import type {
  SchemaForm,
  SchemaFormRef
} from '@/types/schemaform.type';
import { Icon } from '@iconify/vue';

const emit = defineEmits(['close', 'emitStep']);

const { initToast } = useToasts();

const formValues = ref();
const formKey = ref(0);
const formRef = ref<SchemaFormRef>();
const isClientIndividual = ref(false);
const country = ref('');
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { usersListOptions } = useUserListOptions(true, initialFilters);
const { getBusinessEntities, getCountriesList, getStatesList }
  = useCommonListQueries();
const { data: businessEntityList } = getBusinessEntities();
const { data: countriesList } = getCountriesList();
const enabled = computed(() => !!country.value);
const { data: statesList } = getStatesList(country, enabled, 'states-list');
const queryClient = useQueryClient();
const isDetailsRoute = useRoute().name === 'admin-clients-id';
const { isFalsy } = useUtilityFns();
const route = useRoute();

let clientId = useRouteQuery<string>('clientId');
if (isDetailsRoute) {
  clientId = ref(route.params.id as string);
}

function updateEngagementLetterStatus(data: Client) {
  const willSignIndex: number = findFormIndex('willSign');
  const uploadFileIndex: number = findFormIndex('uploadFile');
  if (!clientDetails.value) {
    if (data && data.isSigned === 'true') {
      updateFieldProp('hide', uploadFileIndex, false);
      updateFieldProp('hide', willSignIndex, true);
    }
    if (data && data.isSigned === 'false') {
      updateFieldProp('hide', willSignIndex, false);
      updateFieldProp('hide', uploadFileIndex, true);
    }
  }
}

function handleAction(data: Client, actionType: APIActions) {
  initToast({
    actionType,
    title: `${$tConfig('CLIENT')}`,
    actionObj: { ...data },
    detail: `${$tConfig('CLIENT')} <strong>${
      data.name
    }</strong> ${actionType.toLowerCase()}d successfully`
  });
  if (clientId.value) {
    queryClient.invalidateQueries('client-details');
    queryClient.invalidateQueries('audit-log-activity');
    queryClient.invalidateQueries('client-limit');
  }
  emit('close');
}

const { data: clientDetails, isLoading: detailsIsLoading } = useQuery<
  Client | undefined
>(
  'client-details',
  async () => {
    return clientId.value ? useClientDetails(clientId.value) : undefined;
  },
  {
    onSuccess: (data: Client | undefined) => {
      if (data) {
        formValues.value = data;
        updateEngagementLetterStatus(data);
        handleDropdownChange(data as unknown as ClientCreatePayload);
        /* if (!data.businessEntity) {
          updateFieldProp('disabled', businessEntityIndex, false);
        } else {
          updateFieldProp('disabled', businessEntityIndex, true);
        } */
        formKey.value += 1;
      }
    }
  }
);

const { mutateAsync: createUpdateClient, isLoading: createUpdateIsLoading }
  = useMutation(
    ({
      payload,
      clientId
    }: {
      payload: CreateClientPayload | ClientUpdatePayload;
      clientId?: string;
    }) => {
      if (clientId) {
        return useClientCreateUpdate(payload as ClientUpdatePayload, clientId);
      }
      else {
        return useCreateClient(payload);
      }
    },
    {
      onSuccess: (data) => {
        handleAction(data, clientId.value ? 'Update' : 'Create');
      }
    }
  );

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'businessEntityId',
        label: `${$tConfig('BUSINESS_ENTITY')}`,
        required: true,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `${$tConfig('BUSINESS_ENTITY')}`,
        options: businessEntityList.value || [],
        formGridClass: 'md:col-6',
        showSlot: true
      },
      {
        as: InputText,
        name: 'name',
        label: `${$tConfig('CLIENT')} Name`,
        required: true,
        autocomplete: 'off',
        formGridClass: 'md:col-6'
      },
      {
        as: InputText,
        name: 'email',
        label: 'Email ID',
        required: true,
        placeholder: 'Email ID',
        autocomplete: 'off',
        types: 'email',
        formGridClass: 'md:col-6'
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'relationshipManagerId',
        label: 'Relationship Manager',
        required: true,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Relationship Manager',
        options: usersListOptions.value || [],
        formGridClass: 'md:col-6'
      },
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'collaborators',
        label: 'Working Team',
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Team Members',
        options: usersListOptions.value?.filter(
          item =>
            formRef.value?.schemaFormValues.relationshipManagerId !== item.id
        ),
        disabled: isFalsy(
          formRef.value?.schemaFormValues.relationshipManagerId
        ),
        formGridClass: 'md:col-6',
        hide: !!clientId.value
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'country',
        label: 'Country',
        optionLabel: 'country',
        optionValue: 'country',
        placeholder: 'Enter Country',
        formGridClass: 'md:col-6',
        required: true,
        filter: false,
        options: countriesList.value || [],
        hide: !!clientId.value
      },
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'stateIds',
        optionLabel: 'name',
        optionValue: 'id',
        label: 'State(s)',
        placeholder: 'Enter state',
        formGridClass: 'md:col-6',
        required: true,
        hide: !!clientId.value
      },
      {
        label: 'Have you signed the engagement letter for this client?',
        as: RadioButton,
        type: 'radio',
        name: 'isSigned',
        required: true,
        formGridClass: 'md:col-12',
        options: [
          { name: 'truthy', value: 'true', radioLabel: 'Yes' },
          { name: 'falsy', value: 'false', radioLabel: 'No' }
        ],
        hide: true
      },
      {
        label: 'Would you like to sign?',
        as: RadioButton,
        type: 'radio',
        name: 'willSign',

        options: [
          { name: 'truthy_willsign', value: 'true', radioLabel: 'Yes, sure' },
          { name: 'falsy_willsign', value: 'false', radioLabel: 'Not now' }
        ],
        hide: true
      },
      {
        as: FileUpload,
        name: 'uploadFile',
        label: `Please attach the "Engagement letter" copy for your record`,
        type: 'file',
        multiple: false,
        fileLimit: 1,
        hide: true,
        accept:
          'image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    ],
    validationSchema: clientId.value
      ? ClientUpdatePayloadSchema
      : ClientCreatePayloadSchema,
    initialValues: clientDetails || { country: 'USA' },
    btnText: 'Submit',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});

const { findFormIndex, updateFieldProp, updateOptions }
  = useSchemaForm(formData);

const ClientIndex = findFormIndex('name');
const countryIndex = findFormIndex('country');
const stateIndex = findFormIndex('stateIds');
const isSignedIndex = findFormIndex('isSigned');
const willSignIndex = findFormIndex('willSign');
const uploadFileIndex = findFormIndex('uploadFile');

watch(
  () => formValues.value,
  (val) => {
    updateEngagementLetterStatus(val);
  },
  { deep: true }
);

watch(
  () => [formValues, statesList],
  async ([formValues, statesList]) => {
    if (formValues) {
      country.value = (formValues.value as Client)?.country as string;
    }
    if (statesList) {
      await nextTick(() => {
        const statesIndex = findFormIndex('stateIds');
        updateOptions(statesList, statesIndex);
      });
    }
  },
  {
    deep: true,
    immediate: true
  }
);

function handleDropdownChange(formVal: Record<string, any>, name?: string) {
  formValues.value = formVal;
  const record = businessEntityList.value?.find(
    el => el.id === formVal?.businessEntityId
  );
  if (orgType.value === 'ACCOUNTING') {
    updateFieldProp(
      'label',
      ClientIndex,
      record?.businessType === 'INDIVIDUAL' ? `${$tConfig('CLIENT')} Name` : 'Organization Name'
    );
  }
  isClientIndividual.value = record?.businessType === 'INDIVIDUAL';

  if (name === 'relationshipManagerId') {
    formRef.value?.setFieldValue('collaborators', []);
  }
  if (name === 'country') {
    formRef.value?.setFieldValue('stateIds', []);
  }
}

function handleRadioChange(val: any) {
  formValues.value = val;
}
function onSubmit(values: Record<string, any>) {
  const { mobile, ...rest } = values;
  let payload: Partial<
    ClientCreatePayload & ClientUserPayload & { mobile: number }
  > & {
    engagementLetterStatus: string;
  } = { ...rest, engagementLetterStatus: '' };
  if (!isFalsy(mobile)) {
    payload.mobile = mobile;
  }
  if (isClientIndividual.value) {
    payload = {
      ...rest,
      mobile,
      engagementLetterStatus: '',
      clientUsers: [{ email: rest.email, firstName: rest.name }]
    };
  }
  if (clientId.value) {
    createUpdateClient({
      payload: payload as unknown as ClientUpdatePayload,
      clientId: clientId.value as string
    });
  }
  else {
    createUpdateClient({ payload: payload as unknown as ClientUpdatePayload });
  }
}
onMounted(() => {
  if (clientId.value) {
    updateFieldProp('hide', isSignedIndex, true);
    updateFieldProp('hide', willSignIndex, true);
    updateFieldProp('hide', uploadFileIndex, true);
    updateFieldProp('hide', countryIndex, true);
    updateFieldProp('hide', stateIndex, true);
  }
});
</script>

<template>
  <CommonLoading v-if="detailsIsLoading" />
  <CommonSchemaForm
    v-else
    :key="formKey"
    ref="formRef"
    :data="formData"
    :primary-btn-loading="createUpdateIsLoading"
    @dropdown-change="handleDropdownChange"
    @radio-click="handleRadioChange"
    @secondary-btn-click="$emit('close')"
    @submit="onSubmit"
  >
    <template #businessEntityId="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900" for="businessEntityId">{{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span></label>
        <VField
          v-slot="{ handleChange, value, validate }"
          name="businessEntityId"
        >
          <Dropdown
            :tabindex="0"
            class="w-full"
            :model-value="value"
            v-bind="attrs"
            @update:model-value="handleChange"
            @blur="validate()"
            @change="handleDropdownChange(attrs.values as CreateClientPayload)"
          >
            <template #header>
              <RouterLink
                :to="{ name: 'admin-business-entities' }"
                class="flex align-items-center py-2 px-3 font-medium text-sm text-gray-500 hover:text-gray-700"
              >
                Add New {{ `${$tConfig('BUSINESS_ENTITY')}` }}
                <Icon icon="mdi:external-link" class="ml-1 h-1.5rem w-1.5rem" />
              </RouterLink>
            </template>

            <template #option="slotProps">
              <div class="w-full flex justify-content-between">
                <div>{{ slotProps.option.name }}</div>
                <div v-if="slotProps.option.org === null">
                  <span class="text-orange-500">Predefined</span>
                </div>
              </div>
            </template>
          </Dropdown>
        </VField>
      </div>
    </template>
  </CommonSchemaForm>
</template>

<style lang="scss" scoped></style>
