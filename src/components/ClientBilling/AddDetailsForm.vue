<script setup lang="ts">
import { Field as VField } from 'vee-validate';

import type {
  ClientBillingProfile,
  CreateProfileDetailsPayload
} from '@/types/client-billing.type';
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';

import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import InputText from 'primevue/inputtext';
import Title from '../Form/Title.vue';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';

import { CreateProfileDetailsSchema } from '@/types/client-billing.type';
import Divider from 'primevue/divider';
import Dropdown from 'primevue/dropdown';
import type { IntegrationId } from '@/types/integrations.type';
import InputNumber from 'primevue/inputnumber';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputGroup from 'primevue/inputgroup';

const props = defineProps<{
  detailBilling?: ClientBillingProfile;
  create?: boolean;
  apiKey?: number;
  loading?: boolean;
  hideBackButton?: boolean;
  btnText?: boolean;
}>();
const emit = defineEmits<{
  (e: 'emitStep', step: string): void;
  (e: 'back', step: 'form'): void;
  (e: 'skip', step: 'form'): void;
  (e: 'form', value: CreateProfileDetailsPayload, id?: string): void;
}>();

const { detailBilling: detailBillingProp } = toRefs(props);

const { getOne, update, removeLogoPicture } = useClientBilling();

const { fullName, initials, titleCase } = useVueFilters();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const route = useRoute();

const currentClientBillingId = ref<string>(route.params.id as string);
const updatedProfileDetails = ref<ClientBillingProfile>(
  detailBillingProp?.value as unknown as ClientBillingProfile
);
const logoId = ref();
const openLogoDialog = ref(false);
const isPaymentGatewayIntegratedOptions = reactive([
  { name: 'isPaymentGatewayIntegrated', value: true, radioLabel: 'Yes' },
  { name: 'isPaymentGatewayIntegrated', value: false, radioLabel: 'No' }
]);
const canCallPaymentGatewayDetails = ref(false);
const showPaymentGatewayError = ref(false);
const selectedPaymentGateway = ref('');
const selectedPaymentGatewayId = ref('');
const paymentGatewayOptions = ref([
  {
    name: 'Paypal',
    value: 'PAYPAL'
  },
  {
    name: 'Stripe',
    value: 'STRIPE'
  }
]);

const formRef = ref<SchemaFormRef>();
const country = ref('');
const countryEnabled = computed(() => !!country.value);
const billingTypeOptions = ref([
  // { name: 'None', value: 'NONE' },
  { name: 'Fixed', value: 'FIXED' },
  { name: 'Unit per hour, minute', value: 'UNIT' },
  { name: 'Both', value: 'BOTH' }
]);
const billingUnitType = ref<'minute' | 'hour'>('minute');
const billingUnitTypeOptions = ref([
  { name: 'Minute(s)', value: 'minute' },
  { name: 'Hour(s)', value: 'hour' }
]);

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        name: 'logoPictureId',
        label: 'Logo',
        showSlot: true,
        formGridClass: 'md:col-6'
      },
      {
        name: 'email',
        label: 'Email',
        as: InputText,
        placeholder: 'Enter Email ',
        formGridClass: 'md:col-6'
      },
      {
        as: InputText,
        name: 'address',
        label: 'Street',
        placeholder: 'Street',
        formGridClass: 'md:col-6',
        required: true
      },
      {
        as: InputText,
        name: 'city',
        label: 'City',
        placeholder: 'City',
        formGridClass: 'md:col-6',
        required: true
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'country',
        label: 'Country',
        optionLabel: 'country',
        optionValue: 'country',
        placeholder: 'Select Country',
        formGridClass: 'md:col-6',
        options: countriesList.value || [],
        required: true
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'state',
        label: 'State',
        optionLabel: 'name',
        optionValue: 'id',
        options: statesList.value || [],
        placeholder: 'Select State',
        formGridClass: 'md:col-6',
        disabled: isFalsy(formRef.value?.schemaFormValues.country),
        required: true
      },
      {
        as: InputText,
        name: 'zipcode',
        label: 'Zipcode',
        placeholder: 'Enter Zipcode',
        formGridClass: 'md:col-6',
        required: true
      },
      {
        name: 'taxNo',
        label: 'Tax No',
        as: InputText,
        placeholder: 'Enter Tax No',
        formGridClass: 'md:col-6'
      },
      {
        as: Divider,
        name: 'divider',
        label: 'divider'
      },
      {
        as: Title,
        name: 'title',
        label: 'Settings'
      },
      /* {
        name: 'invoiceNumber',
        label: 'Invoice No',
        as: InputText,
        placeholder: 'Enter Invoice No',
      }, */
      {
        name: 'unitInMinutes',
        label: 'Please define your unit',
        // required: true,
        showSlot: true,
        formGridClass: 'md:col-6'
      },
      {
        name: 'dueInDays',
        label: 'Due In (From the invoice date)',
        type: 'input-number',
        placeholder: 'Enter Days',
        dateFormat: 'dd M yy',
        min: 1,
        inputGroupSuffix: 'Days',
        inputGroup: true,
        formGridClass: 'md:col-6'
      },
      {
        name: 'isPaymentGatewayIntegrated',
        label: 'Do you want to integrate payment gateway for this profile?',
        type: 'radio',
        options: isPaymentGatewayIntegratedOptions
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'orgIntegrationId',
        label: 'Payment Gateway',
        optionLabel: 'name',
        optionValue: 'value',
        options: paymentGatewayOptions.value,
        placeholder: 'Select Payment Gateway',
        formGridClass: 'md:col-6',
        required: true,
        disabled: !props.create && !!props.detailBilling?.orgIntegrationId,
        hide: isFalsy(
          formRef.value?.schemaFormValues.isPaymentGatewayIntegrated
        )
      }
    ],
    btnText: !props.btnText ? 'Next' : 'Submit',
    secondaryBtnText: !props.hideBackButton ? 'Back' : '',
    validationSchema: CreateProfileDetailsSchema,
    initialValues: detailBillingProp?.value
      ? {
          ...detailBillingProp?.value,
          dueInDays: detailBillingProp?.value.dueInDays || 7,
          unitInMinutes: detailBillingProp?.value.unitInMinutes || 60

        }
      : { dueInDays: 7, country: 'United States', unitInMinutes: 60 }
  } as SchemaForm;
});

const { isFalsy } = useUtilityFns();
const { getOrgIntegration } = useIntegrations();
const {
  createAttachment,
  uploadFileRef,
  showFileErrorMessages,
  createFilePayload,
  fileSelected,
  getAttachmentUrl
} = useAttachments();
const { getCountriesList, getStatesList } = useCommonListQueries();
const { data: countriesList, isFetching: fetchingCountries }
  = getCountriesList();
const { data: statesList, isFetching: fetchingStates } = getStatesList(
  country,
  countryEnabled,
  'states-list'
);

const { data: orgDetails, isLoading } = useQuery(
  'org-data',
  () => {
    return useOrgDetails();
  },
  {
    onSuccess: (data) => {
      updatedProfileDetails.value = {
        ...(data || {}),
        ...(props.detailBilling || {})
      } as unknown as ClientBillingProfile;
      if (!props.detailBilling) {
        country.value = data.country as string;
        formRef.value?.setValues({
          ...formRef.value.schemaFormValues,
          ...updatedProfileDetails.value
        });
      }
    },
    enabled: !!detailBillingProp?.value
  }
);

const {
  data: paymentGatewayDetails,
  isLoading: loadingPaymentDetails,
  isFetching: fetchingPaymentDetails
} = useQuery(
  ['get-payment-gateway-details', selectedPaymentGateway],
  async () => {
    return getOrgIntegration(selectedPaymentGateway.value as IntegrationId);
  },
  {
    onSuccess: (data: { id: string; credentials: any }) => {
      showPaymentGatewayError.value = data === null;
      selectedPaymentGatewayId.value = data.id;
    },
    enabled: canCallPaymentGatewayDetails
  }
);

function handleDropdownChange(val: Record<string, any>, name: string) {
  if (name === 'country') {
    country.value = val.country;
    formRef.value?.validateField('zipcode');
  }

  if (name === 'orgIntegrationId') {
    selectedPaymentGateway.value = val.orgIntegrationId;
    canCallPaymentGatewayDetails.value = !!val.orgIntegrationId;
    // queryClient.invalidateQueries('get-payment-gateway-details');
  }
}

const { mutateAsync: orgAttachments, isLoading: updatingLogo } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      handlePostAttachment(data.res);
    }
  }
);

const { isLoading: loadingUpdatingData, mutateAsync: UpdateClientProfile }
  = useMutation(
    ({
      payload,
      id
    }: {
      payload: Partial<CreateProfileDetailsPayload>;
      id: string;
    }) => {
      return update(id, payload);
    },
    {
      onSuccess(data) {
        updatedProfileDetails.value = data;
        initToast({
          actionType: 'Update',
          summary: 'Logo Update',
          detail: 'Logo has been updated successfully'
        });
      }
    }
  );

const { isLoading: removingLogo, mutateAsync: removeClientProfileLogo }
  = useMutation(
    ({ id, logoPictureId }: { id: string; logoPictureId: string }) => {
      return removeLogoPicture(id, logoPictureId);
    },
    {
      onSuccess(data) {
        handlePostAttachment(data.data);
        initToast({
          actionType: 'Remove',
          summary: 'Logo Remove',
          detail: 'Logo has been removed successfully'
        });
      }
    }
  );

async function prepareLogoRemove(value: string) {
  logoId.value = value;
  openLogoDialog.value = true;
}

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await orgAttachments({ payload, file: fileSelected.value });
}
async function handlePostAttachment(data: AttachmentResponse) {
  const {
    state,
    city,
    country,
    address,
    name,
    orgIntegration,
    orgIntegrationId,
    ...rest
  } = detailBillingProp?.value as ClientBillingProfile;

  const addressJSON = {
    state,
    city,
    country,
    zipcode: detailBillingProp?.value?.zipcode
      ? `${detailBillingProp?.value?.zipcode}`
      : undefined,
    street: detailBillingProp?.value?.address
  };
  const payload = {
    logoPictureId: data.id,
    address: addressJSON,
    orgIntegration,
    orgIntegrationId: orgIntegration ? orgIntegration.id : null,
    ...rest
  };
  await UpdateClientProfile({
    id: detailBillingProp?.value?.id
      ? detailBillingProp?.value?.id
      : currentClientBillingId.value,
    payload: payload as unknown as CreateProfileDetailsPayload
  });
  queryClient.invalidateQueries('client-profile-details');
}

async function handleLogoRemove() {
  await removeClientProfileLogo({
    id: detailBillingProp?.value?.id
      ? detailBillingProp?.value?.id
      : currentClientBillingId.value,
    logoPictureId: logoId.value as string
  });
}

function onSubmit(formValues: Record<string, any>) {
  const {
    email,
    taxNo,
    state,
    city,
    country,
    invoiceNumber,
    logoPictureId,
    isPaymentGatewayIntegrated,
    unitInMinutes
  } = formValues;

  const payload = {
    email,
    taxNo,
    dueInDays: formValues.dueInDays ? +formValues.dueInDays : undefined,
    invoiceNumber,
    logoPictureId,
    unitInMinutes,
    address: {
      state,
      city,
      country,
      zipcode: formValues.zipcode ? `${formValues.zipcode}` : undefined,
      street: formValues.address
    },
    orgIntegrationId: isPaymentGatewayIntegrated
      ? detailBillingProp?.value?.orgIntegration?.id
      || selectedPaymentGatewayId.value
      : null,
    isPaymentGatewayIntegrated
  };
  emit('form', payload as unknown as CreateProfileDetailsPayload);
}

watch(
  () => detailBillingProp?.value,
  (val, oldVal) => {
    if (val) {
      selectedPaymentGatewayId.value = val?.orgIntegration?.id;
      country.value = val?.country as string;
      updatedProfileDetails.value
        = val as ClientBillingProfile;
      formRef.value?.setValues({
        ...formRef.value.schemaFormValues,
        ...val
      });
    }
  },
  {
    deep: true,
    immediate: true,
    flush: 'post'
  }
);

/* watchEffect(() => {
  if (detailBillingProp.value) {
    selectedPaymentGatewayId.value = detailBillingProp?.value?.orgIntegration?.id;
    country.value = detailBillingProp?.value?.country as string;
    updatedProfileDetails.value
        = detailBillingProp?.value as ClientBillingProfile;
    formRef.value?.setValues({
      ...formRef.value.schemaFormValues,
      ...detailBillingProp?.value
    });
  }
}); */

function handlePaymentGatewayOption() {
  formRef.value?.setFieldValue('isPaymentGatewayIntegrated', false);
  selectedPaymentGateway.value = '';
  canCallPaymentGatewayDetails.value = false;
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :primary-btn-loading="loading || loadingUpdatingData"
    :disable-submit="loadingPaymentDetails"
    @submit="onSubmit"
    @secondary-btn-click="emit('back', 'form')"
    @dropdown-change="handleDropdownChange"
  >
    <template #logoPictureId>
      <div class="field w-6">
        <label class="block font-medium text-900"> Logo </label>

        <Avatar
          class="mr-2 p-avatar-xxl relative"
          :class="{
            'bg-primary': !(
              detailBillingProp?.logo || updatedProfileDetails?.logo
            ),
          }"
          size="large"
          shape="circle"
        >
          <template
            v-if="detailBillingProp?.logo || updatedProfileDetails?.logo"
          >
            <img
              class="text-sm"
              :src="`${getAttachmentUrl(
                (detailBillingProp?.logo as unknown as Attachment)?.path
                  || (updatedProfileDetails?.logo as unknown as Attachment)?.path,
              )}`"
              style="vertical-align: middle;"
              alt="Logo"
            >
            <div v-tooltip.top="'Update Logo'" class="edit-profile-pic">
              <CommonFileUpload
                mode="basic"
                accept="image/*"
                :custom-upload="true"
                hide-choose-button-label
                hide-file-upload-messages
                :multiple="false"
                :auto="true"
                :upload-icon="`${
                  updatingLogo || loadingUpdatingData
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-pencil'
                }`"
                class="p-button-icon-only p-button-rounded"
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
            <Button
              v-tooltip.top="'Delete Logo'"
              type="button"
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger -mt-4 remove-profile-pic"
              aria-label="Delete"
              @click="
                prepareLogoRemove(
                  ((detailBillingProp?.logo as unknown as Attachment)
                    ?.id as string)
                    || ((updatedProfileDetails?.logo as unknown as Attachment)
                      ?.id as string),
                )
              "
            >
              <i v-if="removingLogo" class="pi pi-spin pi-spinner" />
            </Button>
          </template>
          <template v-else>
            {{
              initials(
                (detailBillingProp?.name as string)
                  || (updatedProfileDetails?.name as string),
              )
            }}
            <div v-tooltip.top="'Upload Logo'" class="edit-profile-pic">
              <CommonFileUpload
                mode="basic"
                accept="image/*"
                :custom-upload="true"
                hide-file-upload-messages
                hide-choose-button-label
                :multiple="false"
                :auto="true"
                class="p-button-icon-only p-button-rounded"
                :upload-icon="`${
                  updatingLogo ? 'pi pi-spin pi-spinner' : 'pi pi-upload'
                }`"
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
          </template>
        </Avatar>
      </div>
    </template>
    <template #unitInMinutes="{ ...attrs }">
      <div class="field mb-0">
        <label class="block font-medium text-900" for="unitInMinutes">
          {{ attrs.label }}
          <span v-if="attrs.required" class="text-red-600">*</span>
        </label>
        <div class="">
          <VField v-slot="{ handleChange, value, validate }" name="unitInMinutes">
            <InputGroup class="w-full">
              <InputNumber
                input-class="w-2rem"
                class="billing-unit text-center font-medium text-xl"
                :min="1"
                :model-value="1"
                disabled
              />
              <InputGroupAddon>
                Unit
              </InputGroupAddon>
              <InputText type="text" class="billing-unit text-center font-medium text-xl" disabled placeholder="=" value="=" />
              <InputNumber
                input-class="billing-unit__value" class="billing-unit__value"
                :min="1"
                :model-value="(value as number)"
                @update:model-value="handleChange"
                @blur="validate()"
              />
              <InputGroupAddon>
                Minute(s)
              </InputGroupAddon>
              <!-- <Dropdown
                v-model="billingUnitType"
                :options="billingUnitTypeOptions"
                option-label="name"
                option-value="value"
              /> -->
            </InputGroup>
          </VField>
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              :errors="(attrs.errors as ComputedRef).value"
              :values="(attrs.values as ComputedRef).value"
              error-key="unitInMinutes"
              :feedback="true"
            />
          </transition>
        </div>
      </div>
    </template>
  </CommonSchemaForm>
  <CommonConfirmRemoveDialog
    v-if="openLogoDialog"
    :visible="openLogoDialog"
    :record-to-remove="{
      name: (updatedProfileDetails?.logo as unknown as Attachment)
        ?.name as string,
    }"
    title="Confirm Delete Logo Image"
    @confirm="handleLogoRemove"
    @hide="openLogoDialog = false"
  >
    <div>
      Are you sure you want to {{ 'Delete' }} the logo image for
      <strong>{{ updatedProfileDetails?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>

  <Dialog
    v-model:visible="showPaymentGatewayError"
    content-class="border-round-bottom-md"
    modal
    :header="`${titleCase(selectedPaymentGateway)} Integration`"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
    @hide="handlePaymentGatewayOption()"
  >
    <p>
      {{ titleCase(selectedPaymentGateway) }} is not integrated in Integrations,
      Please add {{ titleCase(selectedPaymentGateway) }} integration from
      <router-link
        class="font-medium underline"
        :to="{ name: 'admin-integrations' }"
        target="_blank"
      >
        here
      </router-link>, then try to create billing profile again.
    </p>
  </Dialog>
</template>

<style lang="scss" scoped>
.billing-unit {
  flex-grow: 0;
  width: 2.5rem !important;
}

:deep(.billing-unit__value) {
  flex-grow: 0;
  width: 4rem;
}
</style>
