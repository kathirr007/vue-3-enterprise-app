<script lang="ts" setup>
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';
import type { Org, OrgCreatePayload } from '@/types/myaccount.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const openLogoDialog = ref(false);
const deleteAccountDialog = ref(false);
const logoId = ref('');

const { activeTabIndex, tabRef, handleTabChange } = useSteps('settings');
const { initials } = useVueFilters();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const {
  getAttachmentUrl,
  createAttachment,
  fileSelected,
  showFileErrorMessages,
  createFilePayload
} = useAttachments();

const { data: orgData, isLoading: loadingOrgData, isFetching: fetchingOrgData } = useQuery('org-data', () => {
  return useOrgDetails();
});

async function handlePostAttachment(data: AttachmentResponse) {
  await createUpdateOrg({
    name: orgData.value?.name,
    logo: data.id
  } as Partial<OrgCreatePayload>);
  queryClient.invalidateQueries('org-data');
}

const { mutateAsync: createUpdateOrg } = useMutation(
  (payload: Partial<OrgCreatePayload>) => {
    return useOrgUpdate(payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Organization Logo Update',
        detail: 'Organization Logo has been updated successfully'
      });
    }
  }
);

const { mutateAsync: orgAttachments } = useMutation(
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

const { mutateAsync: removeLogo } = useMutation(
  async (id: string) => {
    return useLogoRemove(id);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Logo Image Update',
        detail: `Logo image Deleted successfully`
      });
    }
  }
);

const { mutateAsync: deleteOrg, isLoading: deletingOrg } = useMutation(
  () => {
    return useOrgDelete();
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        summary: 'Org Deleted Request',
        detail: `Request has been sent to delete your account`
      });
      queryClient.invalidateQueries('org-data');
    }
  }
);

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await orgAttachments({ payload, file: fileSelected.value });
}

async function prepareLogoRemove(value: string) {
  logoId.value = value;
  openLogoDialog.value = true;
}
async function handleLogoRemove() {
  await removeLogo(logoId.value as string);
  queryClient.invalidateQueries('org-data');
}

async function handleOrgDelete() {
  await deleteOrg();
}
</script>

<template>
  <div class="flex flex-column md:flex-row mb-4 align-items-center">
    <div class="w-full md:w-7 mb-2 md:mb-0">
      <div class="flex align-items-center">
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
              style="vertical-align: middle;"
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
                upload-icon="pi pi-pencil"
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
            />
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
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
          </template>
        </Avatar>
        <div class="ml-2 space-y-0.5 flex-1">
          <div>
            <h1 class="text-3xl text-primary mb-0">
              {{ orgData?.name }}
            </h1>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div>
    <TabView
      ref="tabRef"
      v-model:activeIndex="activeTabIndex"
      lazy
      @tab-change="handleTabChange"
    >
      <TabPanel header="Organization Details">
        <div>
          <div class="mb-4">
            <div class="font-bold mb-0.5 text-xl">
              My Organization
            </div>
            <small class="text-sm">These contact details will be used to communicate with your
              clients during different events</small>
          </div>
          <SettingsForm />
        </div>
      </TabPanel>
      <TabPanel header="Subcategories">
        <h2 class="text-3xl text-primary">
          Subcategories
          <small v-if="orgType === 'BUSINESS'" class="text-base block">
            To change subcategory, please contact
            <a href="mailto:help@brightreturn.com" class="font-medium underline">help@brightreturn.com</a>
            for assistance.
          </small>
        </h2>
        <SettingsSubcategories :is-loading="fetchingOrgData" :org-data="(orgData as Org)" />
      </TabPanel>
      <TabPanel header="Time Zone">
        <h2 class="text-3xl text-primary">
          Time Zone
        </h2>
        <SettingsTimeZone />
      </TabPanel>
      <TabPanel header="Danger Zone">
        <h2 class="text-3xl text-red-500">
          Delete Account
        </h2>
        <div v-if="orgData?.isDeletionRequested">
          <p class="mb-0">
            Your account deletion is in progress, and our support team will
            contact you shortly.
          </p>
          <p>
            This process may take up to 48 to 72 hours, so please remember to
            back up your data in the meantime.
          </p>
        </div>
        <p v-else>
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <Button
          v-if="!orgData?.isDeletionRequested"
          class="p-button-danger"
          label="Delete"
          :loading="deletingOrg"
          :disabled="deletingOrg"
          @click="deleteAccountDialog = true"
        />
      </TabPanel>
      <!-- <TabPanel header="Bussiness Hours">

      </TabPanel>
      <TabPanel header="Holidays"> </TabPanel> -->
    </TabView>
  </div>

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

  <CommonConfirmRemoveDialog
    v-if="deleteAccountDialog"
    :visible="deleteAccountDialog"
    title="Confirm Delete Account"
    @confirm="handleOrgDelete"
    @hide="deleteAccountDialog = false"
  >
    <div>
      <p>
        Once you delete your account, there is no going back. Please be certain.
      </p>
      Are you sure you want to {{ 'Delete' }} your account
      <strong>{{ orgData?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
