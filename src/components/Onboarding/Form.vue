<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { useMutation, useQueryClient } from 'vue-query';
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import { onBoardingPayloadSchema } from '@/types/myaccount.type';
import Dropdown from 'primevue/dropdown';
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';

const props = defineProps<{
  loading: boolean;
  org: Org | undefined;
  orgFormValues?: Partial<OrgCreatePayload>;
}>();

const emits = defineEmits<{
  (e: 'form', value: OrgCreatePayload, isCompleted?: boolean): void;
}>();

const formValues = ref<Org>();
const router = useRouter();

const {
  createAttachment,
  uploadFileRef,
  showFileErrorMessages,
  createFilePayload,
  fileSelected,
  getAttachmentUrl
} = useAttachments();

const { initials } = useVueFilters();
const { isFalsy } = useUtilityFns();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { getStatesList, getCountriesList } = useCommonListQueries();

const { handleSubmit, errors, meta, values, validateField, validate } = useForm({
  validationSchema: onBoardingPayloadSchema,
  initialValues: props.orgFormValues || props.org || formValues
});

const { value: name } = useField<string>('name');
const { value: mobile } = useField<string>('mobile');
// const { value: designationId } = useField<string>('designationId');
const { value: teamSize } = useField<string>('teamSize');
const { value: noOfClients } = useField<string>('noOfClients');
const { value: address } = useField<string>('address');
const { value: city } = useField<string>('city');
const { value: state } = useField<string | null>('state');
const { value: country } = useField<string>('country');
const { value: zipcode } = useField<string>('zipcode');

const callStatesAPI = computed(() => !!country.value);

const { data: countriesList } = getCountriesList();
const { data: statesList } = getStatesList(
  country,
  callStatesAPI,
  'states-list'
);

const logo = computed<Attachment | undefined>(() => props.org?.logo);
const isOrgLogoRemove = ref(false);

const updatedLogo = ref<AttachmentResponse | undefined>(
  props.org?.logo?.id
    ? { id: props.org?.logo?.id, url: props.org?.logo?.path }
    : undefined
);

const selectedLogoId = ref<string>();

const businessClientsOptions = ref([
  'Upto 50',
  '51 - 100',
  '101 - 200',
  '201 - 500',
  'More than 500'
]);
const teamSizeOptions = ref([
  'Solopreneur',
  'Upto 5',
  '6 - 10',
  '11 - 20',
  '21 - 50',
  'Above 50'
]);

const logoInitial = computed({
  get() {
    return name.value;
  },
  set(val) {
    name.value = val;
  }
});

const onSubmit = handleSubmit(async (values) => {
  const {
    name,
    noOfClients,
    address,
    city,
    country,
    state,
    zipcode,
    teamSize,
    mobile
    // designationId
  } = values;
  const payload = {
    name,
    noOfClients,
    address,
    city,
    country,
    state,
    zipcode,
    teamSize,
    mobile
    // designationId
  };
  emits('form', payload as unknown as OrgCreatePayload, true);
});

const { mutateAsync: orgAttachments, isLoading: updatingLogo } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      emits(
        'form',
        {
          logo: data.res.id,
          name: name.value
        } as unknown as OrgCreatePayload,
        false
      );
      updatedLogo.value = data.res;
    }
  }
);

const { mutateAsync: removeLogo, isLoading: removingLogo } = useMutation(
  async (id: string) => {
    return useLogoRemove(id);
  },
  {
    onSuccess: () => {
      updatedLogo.value = undefined;
      initToast({
        actionType: 'Remove',
        summary: 'Org Logo Remove',
        detail: `Org Logo Removed successfully.`
      });
    }
  }
);

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await orgAttachments({ payload, file: fileSelected.value });
}

async function handleOrgLogoDelete() {
  if (selectedLogoId.value) {
    await removeLogo(selectedLogoId.value as string);
    queryClient.invalidateQueries('org-data');
  }
}

function updateState() {
  state.value = null;
}

watch(() => props.org, (val, oldVal) => {
  if (val) {
    name.value = val.name;
  }
  /* if (country.value) {
    state.value = null;
  } */
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <h3 class="text-primary text-xl text-center">
    Let's setup the BrightReturn for you
  </h3>
  <form class="text-left grid formgrid" @submit="onSubmit">
    <div class="field col-12">
      <label for="name" class="block font-medium text-900">
        Firm Name
        <span class="text-red-600">*</span>
      </label>
      <VField v-slot="{ handleChange, value, validate }" name="name">
        <InputText
          id="name"
          type="text"
          class="w-full"
          placeholder="Enter Firm Name"
          :class="{ 'p-invalid': errors.name }"
          :model-value="(value as string)"
          @update:model-value="handleChange"
          @blur="validate()"
        />
      </VField>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="name"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="field col-12">
      <div class="field w-6">
        <label class="block font-medium text-900">
          Logo
          <!-- <span class="text-red-600">*</span> -->
        </label>

        <Avatar
          class="mr-2 p-avatar-xxl relative"
          :class="{ 'bg-primary': logo }"
          size="large"
          shape="circle"
        >
          <template v-if="logo">
            <img
              class="text-sm"
              :src="`${getAttachmentUrl((logo as unknown as Attachment).path)}`"
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
                  updatingLogo ? 'pi pi-spin pi-spinner' : 'pi pi-pencil'
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
                selectedLogoId = logo.id;
                isOrgLogoRemove = true;
              "
            >
              <i v-if="removingLogo" class="pi pi-spin pi-spinner" />
            </Button>
          </template>
          <template v-else>
            {{ initials(logoInitial || name || '') }}
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
    </div>
    <div class="field col-12">
      <label for="mobile" class="block font-medium text-900">
        Mobile Number
        <span class="text-red-600">*</span>
      </label>
      <VField v-slot="{ handleChange, value, validate }" name="mobile">
        <InputText
          id="mobile"
          class="w-full"
          placeholder="Enter Mobile Number"
          :class="{ 'p-invalid': errors.mobile }"
          :model-value="value as string"
          @update:model-value="handleChange"
          @blur="validate()"
        />
      </VField>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="mobile"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="field col-12">
      <label for="teamSize" class="block font-medium text-900">
        Team Size
      </label>
      <Dropdown
        v-model="teamSize"
        :options="teamSizeOptions"
        placeholder="Select Team Size"
        class="w-full"
        :class="{ 'p-invalid': errors.teamSize }"
        @blur="validateField('teamSize')"
      />
      <p v-if="errors.teamSize" class="p-error">
        {{ errors.teamSize }}
      </p>
    </div>
    <div class="field col-12">
      <label for="noOfClients" class="block font-medium text-900">
        No. of Business Clients
      </label>
      <Dropdown
        v-model="noOfClients"
        :options="businessClientsOptions"
        placeholder="Select No. of Business Clients"
        class="w-full"
        :class="{ 'p-invalid': errors.noOfClients }"
        @blur="validateField('noOfClients')"
      />
      <p v-if="errors.noOfClients" class="p-error">
        {{ errors.noOfClients }}
      </p>
    </div>
    <div class="field col-12">
      <label for="country" class="block font-medium text-900"> Country </label>
      <Dropdown
        v-model="country"
        :options="countriesList"
        placeholder="Select country"
        class="w-full"
        :class="{ 'p-invalid': errors.country }"
        option-label="country"
        option-value="country"
        show-clear
        @blur="validateField('country'); validateField('zipcode')"
        @change="updateState"
      />
      <p v-if="errors.country" class="p-error">
        {{ errors.country }}
      </p>
    </div>
    <div class="field col-12">
      <label for="state" class="block font-medium text-900"> State </label>
      <Dropdown
        v-model="state"
        :options="statesList"
        placeholder="Select State"
        class="w-full"
        :class="{ 'p-invalid': errors.state }"
        option-label="name"
        option-value="id"
        :show-clear="!!country"
        :disabled="!country"
        @blur="validateField('state')"
      />
      <p v-if="errors.state" class="p-error">
        {{ errors.state }}
      </p>
    </div>
    <div class="field col-12">
      <label for="address" class="block font-medium text-900"> Address </label>
      <InputText
        id="address"
        v-model="address"
        oninput="validity.valid||(value='');"
        placeholder="Enter Address"
        class="w-full"
        type="string"
        :class="{ 'p-invalid': errors.address }"
        @blur="validateField('address')"
      />
      <p v-if="errors.address" class="p-error">
        {{ errors.address }}
      </p>
    </div>
    <div class="field col-12">
      <label for="city" class="block font-medium text-900"> City </label>
      <InputText
        id="city"
        v-model="city"
        oninput="validity.valid||(value='');"
        placeholder="Enter city"
        class="w-full"
        type="string"
        :class="{ 'p-invalid': errors.city }"
        @blur="validateField('city')"
      />
      <p v-if="errors.city" class="p-error">
        {{ errors.city }}
      </p>
    </div>

    <div class="field col-12">
      <label for="zipcode" class="block font-medium text-900"> Zipcode </label>
      <InputText
        id="zipcode"
        v-model="zipcode"
        oninput="validity.valid||(value='');"
        placeholder="Enter zipcode"
        class="w-full"
        type="string"
        :class="{ 'p-invalid': errors.zipcode }"
        @blur="validateField('zipcode')"
      />
      <p v-if="errors.zipcode" class="p-error" v-html="errors.zipcode" />
    </div>

    <div class="col-12 text-right">
      <Button
        label="Get Started"
        :disabled="!meta.valid"
        :loading="loading"
        type="submit"
      />
    </div>
  </form>
  <CommonConfirmRemoveDialog
    v-if="isOrgLogoRemove"
    :visible="isOrgLogoRemove"
    title="Confirm Delete Org Logo"
    @confirm="handleOrgLogoDelete"
    @hide="isOrgLogoRemove = false"
  >
    <div>
      Are you sure you want to {{ 'Delete' }} the logo image for
      <strong>{{ org?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
