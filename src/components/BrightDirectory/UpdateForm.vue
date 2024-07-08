<script setup lang="ts">
import { BrightDirectoryUpdateSchema } from '@/types/brightdirectory.type';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import type {
  BrightDirectory,
  BrightDirectoryUpdatePayload,
  DirectoryServices
} from '@/types/brightdirectory.type';
import MultiSelect from 'primevue/multiselect';
import type {
  SchemaForm
  , SchemaFormRef } from '@/types/schemaform.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

import type {
  FileObject,
  UploadFilesPayload
} from '@/types/common.type';
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';

const props = defineProps<{
  directoryId?: string;
  orgDetails?: Org;
}>();
const emit = defineEmits<{
  (e: 'listingData', data: BrightDirectory): void;
  (e: 'create-or-update-directory', data: BrightDirectory): void;
}>();

// const isDev = isDevBuild;
// const isProd = isProdBuild;
const { orgDetails: orgData, directoryId: directoryIdProp } = toRefs(props);
const formRef = ref<SchemaFormRef>();
const formValues = ref<BrightDirectory>();
const servicesListData = ref<DirectoryServices[]>();
const slugBaseUrl = computed(() => {
  if (isProdBuild) {
    return 'https://directory.brightreturn.com/';
  }
  else {
    return 'https://br-directory.fly.dev/';
  }
});
const logoId = ref();
const openLogoDialog = ref(false);

const isOrgLogoPresent = computed(() => !!orgData?.value?.logo);

const { initToast } = useToasts();

const queryClient = useQueryClient();
const {
  createAttachment,
  uploadFileRef,
  showFileErrorMessages,
  createFilePayload,
  fileSelected,
  getAttachmentUrl
} = useAttachments();
const { fullName, initials } = useVueFilters();

const { data: BightDirectoryStateData } = useQuery(
  ['state-directory-list'],
  () => {
    return useStateListDirectory();
  }
);
const { data: BightDirectoryServiceData } = useQuery(
  ['service-directory-list'],
  () => {
    return useServiceListDirectory();
  },
  {
    onSuccess: (data) => {
      return (servicesListData.value = data);
    }
  }
);

const { mutateAsync: removeLogo, isLoading: removingLogo } = useMutation(
  async (id: string) => {
    return useLogoRemove(id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Remove',
        summary: 'Directory Logo Remove',
        detail: `Directory Logo Removed successfully.`
      });
    }
  }
);

const { mutateAsync: createUpdateOrg, isLoading: updatingOrgData }
  = useMutation(
    (payload: Partial<OrgCreatePayload>) => {
      return useOrgUpdate(payload);
    },
    {
      onSuccess: () => {
        initToast({
          actionType: 'Update',
          summary: 'Directory Logo Update',
          detail: 'Directory Logo has been updated successfully'
        });
      }
    }
  );

async function handlePostAttachment(data: AttachmentResponse) {
  await createUpdateOrg({
    name: orgData?.value?.name,
    logo: data.id
  } as Partial<OrgCreatePayload>);
  queryClient.invalidateQueries('org-data');
}

const { mutateAsync: orgAttactments, isLoading: updatingLogo } = useMutation(
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

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await orgAttactments({ payload, file: fileSelected.value });
}

const {
  isLoading: gettingBrightDirectoryList,
  data: BightDirectoryListingData
} = useQuery(
  ['bright-directory-list', directoryIdProp],
  () => {
    if (directoryIdProp?.value) {
      return useListingDirectory(directoryIdProp?.value);
    }
  },
  {
    onSuccess: (data) => {
      emit('listingData', data as BrightDirectory);
      formValues.value = data;
      formRef.value?.setValues({
        ...data
      });
    }
  }
);

const { mutateAsync: updateDirectory, isLoading: updateIsLoading }
  = useMutation(
    ({ payload }: { payload: BrightDirectoryUpdatePayload }) => {
      return useUpdateListing(directoryIdProp?.value as string, payload);
    },
    {
      onSuccess: (data) => {
        emit('create-or-update-directory', data);
        initToast({
          actionType: 'Update',
          severity: 'success',
          summary: 'Update Directory Page',
          detail: `Directory page updated sucessfully.`
        });
      }
    }
  );
const { mutateAsync: createDirectory, isLoading: createIsLoading }
  = useMutation(
    ({ payload }: { payload: BrightDirectoryUpdatePayload }) => {
      return useCreateListing(payload);
    },
    {
      onSuccess: (data) => {
        emit('create-or-update-directory', data as unknown as BrightDirectory);
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Create Directory Page',
          detail: `Directory page created sucessfully.`
        });
      }
    }
  );

async function onSubmit(values: Record<string, any>) {
  const selectedDate = new Date(values.foundedYear as string);
  const foundedYear = values.foundedYear
    ? selectedDate.getFullYear()
    : undefined;
  const { subject, name, about, stateId, services } = values;
  const payload = {
    title: subject,
    name,
    about,
    stateId,
    services,
    foundedYear: foundedYear ? +foundedYear : undefined
  };
  if (directoryIdProp?.value) {
    await updateDirectory({
      payload: payload as unknown as BrightDirectoryUpdatePayload
    });
  }
  else {
    await createDirectory({
      payload: payload as unknown as BrightDirectoryUpdatePayload
    });
  }
  queryClient.invalidateQueries('bright-directory-list');
}

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        name: 'picture',
        label: 'Directory Logo',
        showSlot: true,
        formGridClass: 'md:col-6'
      },
      {
        name: 'subject',
        label: 'Page Title',
        as: InputText,
        placeholder: 'Enter Subject ',
        required: true,
        formGridClass: 'md:col-6'
      },
      {
        name: 'name',
        label: 'Organization Name',
        as: InputText,
        placeholder: 'Enter organization name',
        required: true
      },
      {
        name: 'slug',
        label: 'Slug',
        as: InputText,
        placeholder: 'Enter slug',
        hide: !directoryIdProp?.value,
        showSlot: true
      },
      {
        name: 'about',
        label: 'About Us',
        as: Textarea,
        placeholder: 'Enter about us',
        required: true
      },
      {
        name: 'stateId',
        label: 'State',
        type: 'dropdown',
        placeholder: 'Select state',
        required: true,
        optionLabel: 'name',
        optionValue: 'id',
        options: BightDirectoryStateData.value || []
      },
      {
        as: MultiSelect,
        name: 'services',
        label: 'Services',
        type: 'multiSelect',
        placeholder: 'Select services',
        required: true,
        optionLabel: 'name',
        optionValue: 'id',
        options: servicesListData.value || []
      },
      {
        name: 'foundedYear',
        label: 'Founded Year',
        type: 'calender',
        placeholder: 'Select founded year',
        required: false,
        view: 'year',
        dateFormat: 'yy'
      }
    ],
    btnText: 'Submit',
    validationSchema: BrightDirectoryUpdateSchema,
    initialValues: formValues || undefined
  } as SchemaForm;
});

async function prepareLogoRemove(value: string) {
  logoId.value = value;
  openLogoDialog.value = true;
}
async function handleLogoRemove() {
  await removeLogo(logoId.value as string);
  queryClient.invalidateQueries('org-data');
}
</script>

<template>
  <CommonLoading v-if="gettingBrightDirectoryList" />
  <CommonSchemaForm
    v-else
    ref="formRef"
    :data="formData"
    class="w-8 mx-auto p-3 border-1 border-gray-100 border-round-md"
    :primary-btn-loading="updateIsLoading || createIsLoading"
    @submit="onSubmit"
  >
    <template #picture>
      <div class="field w-6">
        <label class="block font-medium text-900"> Directory Logo </label>

        <Avatar
          class="mr-2 p-avatar-xxl relative"
          :class="{ 'bg-primary': !orgData?.logo }"
          size="large"
          shape="circle"
        >
          <template v-if="orgData?.logo">
            <img
              class="text-sm"
              :src="`${getAttachmentUrl((orgData?.logo as Attachment).path)}`"
              style="vertical-align: middle"
              alt="Organization Logo"
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
                  updatingLogo || updatingOrgData
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
                  (orgData?.picture as Attachment)?.id as string,
                )
              "
            >
              <i v-if="removingLogo" class="pi pi-spin pi-spinner" />
            </Button>
          </template>
          <template v-else>
            {{ initials(orgData?.name as string) }}
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
                  updatingLogo || updatingOrgData
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-upload'
                }`"
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
          </template>
        </Avatar>
      </div>
    </template>
    <template #slug="{ values }">
      <div class="field">
        <label class="block font-medium text-900"> Directory Url </label>
        Directory page is accessible
        <a
          :href="`${slugBaseUrl}${(values as any).slug}`"
          target="_blank"
          class="underline mt-2"
        >
          {{ (values as any).slug }}
        </a>
      </div>
    </template>
  </CommonSchemaForm>
  <CommonConfirmRemoveDialog
    v-if="openLogoDialog"
    :visible="openLogoDialog"
    :record-to-remove="{ name: (orgData?.logo as Attachment)?.name as string }"
    title="Confirm Delete Logo Image"
    @confirm="handleLogoRemove"
    @hide="openLogoDialog = false"
  >
    <div>
      Are you sure you want to {{ 'Delete' }} the logo image for
      <strong>{{ orgData?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
