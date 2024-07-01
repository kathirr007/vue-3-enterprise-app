<script setup lang="ts">
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import { Field as VField } from 'vee-validate';
import type { Client, ClientUpdatePayload } from '@/types/client.type';
import { ClientInfoPayloadSchema } from '@/types/client.type';
import { useClientDetails } from '@/composables/client';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import Divider from 'primevue/divider';
import Title from '../Form/Title.vue';
import type { APIActions } from '@/types/common.type';

const disabledTooltip = inject<string>('disabledTooltip');
const canDoActions = inject<boolean>('canDoActions');

const formKey = ref(0);
const isBusinessEntityIndividual = ref(false);
const formValues = ref<Client>();
const formRef = ref<SchemaFormRef>();
const country = ref('');

const { canAccessAllMenu, featureSubscribed } = usePermissions();
const { initToast } = useToasts();
const route = useRoute();
const clientId = ref(route.params.id as string);

const queryClient = useQueryClient();

const { getCountriesList, getStatesList, getBusinessEntities }
  = useCommonListQueries();

function handleAction(data: Client, actionType: APIActions) {
  initToast({
    actionType,
    title: `${$tConfig('CLIENT')}`,
    actionObj: { ...data },
    detail: `${$tConfig('CLIENT')} <strong>${
      data.name
    }</strong> ${actionType.toLowerCase()}d successfully`
  });
  queryClient.invalidateQueries('client-details');
}

const { data: clientDetails } = useQuery<Client>(
  'client-details',
  async () => {
    return useClientDetails(clientId.value);
  },
  {
    onSuccess: (data: Client) => {
      if (data && data.businessEntity) {
        const businessEntity = data.businessEntity;
        ChangeFormFieldsOnBusinessEntity(businessEntity.businessType);
        formData.value.fields[businessEntityIndex].options = [
          { name: businessEntity.name, id: businessEntity.id }
        ];
        // updateFieldProp('disabled', businessEntityIndex, true);
        formKey.value = formKey.value + 1;
      }
      else {
        // updateFieldProp('disabled', businessEntityIndex, false);
      }
    }
  }
);

const { data: businessEntityList } = getBusinessEntities();
const { data: countriesList } = getCountriesList();

const enabled = computed(() => !!country.value);
const isAdmin = computed(() => {
  return (
    canAccessAllMenu.value
    || clientDetails.value?.relationshipManager?.id === currentUser.value?.id
  );
});

const { data: statesList } = getStatesList(country, enabled, 'states-list');

const { mutateAsync: updateClient, isLoading } = useMutation(
  ({
    clientId,
    payload
  }: {
    clientId: string;
    payload: ClientUpdatePayload;
  }) => {
    return useClientCreateUpdate(payload, clientId);
  },
  {
    onSuccess: (data) => {
      handleAction(data, 'Update');
    }
  }
);

function onSubmit(values: Record<string, any>) {
  const { clientUsers, ...payload } = values;
  if (payload.mobile === '')
    payload.mobile = null;
  updateClient({
    clientId: clientId.value as string,
    payload: {
      ...payload,
      zipcode: payload.zipcode ? `${payload.zipcode}` : undefined
    } as unknown as ClientUpdatePayload
  });
}

const formData = shallowRef<SchemaForm>({
  fields: [
    {
      as: InputText,
      name: 'name',
      label: 'Name',
      required: true,
      placeholder: 'Enter Name',
      formGridClass: 'md:col-6'
    },
    {
      as: Dropdown,
      type: 'dropdown',
      name: 'businessEntityId',
      label: `${$tConfig('BUSINESS_ENTITY')}`,
      required: true,
      placeholder: `Enter ${$tConfig('BUSINESS_ENTITY')}`,
      formGridClass: 'md:col-6',
      optionLabel: 'name',
      optionValue: 'id',
      showSlot: true
    },
    {
      as: InputText,
      name: 'ssn',
      label: 'SSN',
      placeholder: 'Enter SSN',
      formGridClass: 'md:col-6',
      disabled: !isAdmin.value,
      hide: true
    },
    {
      as: InputText,
      name: 'ein',
      label: 'EIN',
      placeholder: 'Enter EIN',
      formGridClass: 'md:col-6',
      disabled: !isAdmin.value,
      hide: true
    },
    {
      as: Divider,
      name: 'divider2',
      label: 'divider'
    },
    {
      as: Textarea,
      name: 'notes',
      label: 'Special notes',
      placeholder: 'Enter Special Notes',
      rows: 6,
      showSlot: true
    },
    /* {
      as: Divider,
      name: 'divider1',
      label: 'divider'
    },
    {
      as: Title,
      name: 'title1',
      label: `${$tConfig('CLIENT')}'s return Filing`,
      fontSize: 'text-lg'
    },
    {
      as: RadioButton,
      type: 'radio',
      label: `Did you file ${$tConfig('CLIENT').toLowerCase()} return last year?`,
      name: 'isFiledReturnLastYear',
      placeholder: 'Enter Name',
      options: [
        { name: 'Yes', value: 'true', radioLabel: 'Yes' },
        { name: 'No', value: 'false', radioLabel: 'No' }
      ]
    },
    {
      name: 'servicesUsedBefore',
      as: InputText,
      label: 'Services Offered',
      placeholder: 'Enter Services Offered'
    }, */
    {
      as: Divider,
      name: 'divider2',
      label: 'divider'
    },
    {
      as: Title,
      name: 'title2',
      label: 'Address Information'
    },
    {
      as: InputText,
      name: 'mobile',
      label: 'Mobile',
      placeholder: 'Enter Mobile',
      formGridClass: 'md:col-6'
    },
    {
      as: InputText,
      name: 'website',
      label: 'Website',
      placeholder: 'Enter Website',
      formGridClass: 'md:col-6',
      hide: true
    },
    {
      as: InputText,
      name: 'email',
      label: 'Email',
      placeholder: 'Enter Email',
      formGridClass: 'md:col-6',
      hide: true
    },
    {
      as: InputText,
      name: 'address',
      label: 'Address',
      placeholder: 'Enter Address'
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
      filter: false
    },
    {
      as: InputText,
      type: 'dropdown',
      name: 'state',
      optionLabel: 'name',
      optionValue: 'id',
      label: 'State',
      placeholder: 'Enter state',
      formGridClass: 'md:col-6'
    },
    {
      as: InputText,
      name: 'city',
      label: 'City',
      placeholder: 'Enter City',
      formGridClass: 'md:col-6'
    },
    {
      as: InputText,
      name: 'zipcode',
      label: 'Zipcode',
      placeholder: 'Enter Zipcode',
      formGridClass: 'md:col-6'
    }
  ],
  btnText: 'Submit',
  validationSchema: ClientInfoPayloadSchema,
  initialValues: clientDetails,
  hideButtons:
    !canAccessAllMenu.value
    && clientDetails.value?.relationshipManager?.id !== currentUser.value?.id
});

const { findFormIndex, updateOptions, updateFieldProp }
  = useSchemaForm(formData);

const ssnIndex = findFormIndex('ssn');
const einIndex = findFormIndex('ein');
const emailIndex = findFormIndex('email');
const websiteIndex = findFormIndex('website');
const businessEntityIndex: number = findFormIndex('businessEntityId');

function ChangeFormFieldsOnBusinessEntity(name: string) {
  if (name.toUpperCase() === 'INDIVIDUAL') {
    isBusinessEntityIndividual.value = true;
    updateFieldProp('hide', ssnIndex, false);
    updateFieldProp('hide', emailIndex, false);
  }
  else {
    isBusinessEntityIndividual.value = false;
    updateFieldProp('hide', einIndex, false);
    updateFieldProp('hide', websiteIndex, false);
  }
}

function handleRadioClick(val: Record<string, any>) {
  const servicesUsedBeforeIndex = findFormIndex('servicesUsedBefore');

  if ((val?.isFiledReturnLastYear as unknown as string) === 'true') {
    updateFieldProp('hide', servicesUsedBeforeIndex, false);
    updateFieldProp('required', servicesUsedBeforeIndex, true);
  }
  else {
    updateFieldProp('hide', servicesUsedBeforeIndex, true);
    updateFieldProp('required', servicesUsedBeforeIndex, false);

    // updateFieldProp('required', servicesUsedBeforeIndex, true);
  }
}
function handleDropdownChange(val: Record<string, any>, name?: string) {
  formValues.value = val as unknown as Client;
  if (name === 'country') {
    formRef.value?.setFieldValue('state', null);
    formRef.value?.validateField('zipcode');
  }
}

watchEffect(() => {
  if (clientDetails.value) {
    const updatedValues = {
      ...clientDetails.value,
      ssn: isAdmin.value
        ? clientDetails.value.ssn
        : clientDetails.value.maskedSSN,
      ein: isAdmin.value
        ? clientDetails.value.ein
        : clientDetails.value.maskedEIN
    };
    formValues.value = { ...updatedValues };
    formData.value.initialValues = { ...updatedValues };
    formKey.value = formKey.value + 1;
  }
  if (countriesList.value) {
    const countriesIndex = findFormIndex('country');
    updateOptions(countriesList, countriesIndex);
  }
  updateOptions(businessEntityList, businessEntityIndex);
});

const instance = getCurrentInstance();

watch(
  () => [formValues, statesList],
  async ([formValues, statesList]) => {
    if (formValues) {
      country.value = (formValues.value as Client)?.country as string;
      handleRadioClick(formValues.value as Client);
      // queryClient.invalidateQueries('states-list');
    }
    if (statesList) {
      await nextTick(() => {
        const statesIndex = findFormIndex('state');
        updateOptions(statesList, statesIndex);
        instance?.proxy?.$forceUpdate();
      });
    }
  },
  {
    deep: true,
    immediate: true
  }
);

onMounted(() => {
  useTimeoutFn(() => {
    formKey.value += 1;
  }, 1000);
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :key="formKey"
    :data="formData"
    :disable-submit="!canDoActions"
    :disabled-tooltip="disabledTooltip"
    :primary-btn-loading="isLoading"
    @radio-click="handleRadioClick"
    @dropdown-change="handleDropdownChange"
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
            @change="handleDropdownChange(attrs.values as Client)"
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

    <template #notes>
      <div class="font-medium underline text-lg mb-3">
        Notes
      </div>
      <Common426 v-if="featureSubscribed('client', 'notes') === false" feature="notes" />
      <CommonComments v-else resource-type="CLIENT" :resource-id="clientId" />
    </template>
  </CommonSchemaForm>
</template>
