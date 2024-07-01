<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import { useQuery, useQueryClient } from 'vue-query';
import type { DocumentFolder } from '@/types/documents.type';
import type { UploadFilesPayload } from '@/types/common.type';
import type { MenuItem } from 'primevue/menuitem';

const props = defineProps<{
  folderDetails?: any;
}>();

const disabledTooltip = inject('disabledTooltip', '');
const clientDetails = inject('clientDetails', undefined);

const route = useRoute();
const clientId = ref(route.params.id as string);
const folderId = useRouteQuery<string>('folderId');
const fileId = useRouteQuery<string>('fileId');
const isDocumentViewer = useRouteQuery<string>('isDocumentViewer');
const isSignReq = useRouteQuery<string>('isSignReq');
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { handleTooltip } = useTooltip();
const { defaultBreakpoints } = useCommonBreakPoints();
const { currentUser, isPortalUser } = useCurrentUserData();
const {
  activeTabIndex,
  activeNestedTabIndex,
  handleStep,
  handleTabChange,
  tabRef,
  nestedTabRef
} = useSteps();
const { canDo } = usePermissions();
const {
  uploadFileRef,
  uploadDialog,
  onUpload,
  clientId: clientIdAttachment,
  isDocument,
  folderId: folderIdAttachment
} = useAttachments();
const { canAccessAllMenu } = usePermissions();
const { metaFilter } = useUtilityFns();

isDocument.value = true;
clientIdAttachment.value = (clientId.value
|| currentUser.value?.client?.id) as string;
folderIdAttachment.value = folderId.value as string;

const isOpenSignRequest = ref<boolean>(false);
// const isGalleryUpload = true;

const isCreateFolderDialog = ref<boolean>(false);
const menu = ref();
const items = ref([
  // {
  //   label: 'New Folder',
  //   icon: 'pi pi-folder',
  //   command: () => {
  //     isCreateFolderDialog.value = true;
  //   },
  // },
  {
    label: 'Upload Files',
    icon: 'pi pi-file',
    command: () => {
      uploadDialog.value = true;
      /* initToast({
        actionType: 'Update',
        summary: 'Upload Files',
        detail: 'Files are uploaded successfully',
      }); */
    },
    showInPortal: true
  }
]);
const currentFolderData = ref<DocumentFolder | DocumentFolder[]>();

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails(isPortalUser.value, currentUser.value?.client?.org?.id);
});

/* const { data: documentLimits } = useQuery('document-limit', () => {
  return getResourceLimits({ resource: ResourceType['document management'] });
});

const documentResource = computed(() => {
  const limitComputed = documentLimits.value?.[0].limit === -1 ? 0 : documentLimits.value?.[0].limit;
  const usageComputed = documentLimits.value?.[0].orgSubscriptionResourceUsages && documentLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? documentLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: documentResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'document-limit',
  resource: 'document management'
});

const orgAISettings = computed(() => {
  return {
    enableExtraction: orgDetails?.value?.meta
      ? metaFilter(orgDetails.value.meta, 'enableExtraction') === 'true'
      : null,
    enableClassification: orgDetails?.value?.meta
      ? metaFilter(orgDetails?.value.meta, 'enableClassification') === 'true'
      : null
  };
});

const canDoActions = computed(() => (!!folderId.value));

const filteredMenuItems = computed(() =>
  isPortalUser.value
    ? items.value.filter((item: MenuItem) => item.showInPortal)
    : items.value
);

function toggle(event: Event) {
  menu.value.toggle(event);
}
function handleCreateSuccess(data: DocumentFolder) {
  isCreateFolderDialog.value = false;
  initToast({
    actionType: 'Add',
    severity: 'success',
    summary: 'Add Folder',
    title: 'Document Folder',
    detail: `<strong>${data.name}</strong> has been added successfully`
  });
  queryClient.invalidateQueries('gallery-files');
  queryClient.invalidateQueries('gallery-folders');
  queryClient.invalidateQueries('search-gallery-docs');
  queryClient.invalidateQueries('document-limit');
}

async function handleOnUpload(data: UploadFilesPayload) {
  await onUpload({ payload: data, isGalleryUpload: true });
  queryClient.invalidateQueries('gallery-files');
  queryClient.invalidateQueries('gallery-folders');
  queryClient.invalidateQueries('search-gallery-docs');
  queryClient.invalidateQueries('document-limit');
}

function handleFolderData(data: DocumentFolder | DocumentFolder[]) {
  currentFolderData.value = data;
}
function handleSelectionRequest(id: string | null) {
  console.log('Testing', id);
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <PSPDFKitContainer
    v-if="isDocumentViewer === 'true'"
    is-gallery
    :file-id="fileId"
  />
  <TabView
    v-else
    ref="nestedTabRef"
    v-model:activeIndex="activeNestedTabIndex"
    lazy
    @tab-change="handleTabChange($event, true)"
    @tab-click="handleTabChange($event, true)"
  >
    <TabPanel header="Documents Gallery">
      <div
        class="w-full flex flex-column md:align-items-center md:justify-content-between md:flex-row"
      >
        <header
          class="w-full flex justify-content-between align-items-center flex-column md:flex-row"
        >
          <div class="w-full mr-auto">
            <h1 class="font-medium text-3xl text-primary mb-0">
              {{ 'Documents Gallery' }}
              <small class="block text-gray-500 text-sm font-normal">Utilize pre-designed templates or upload new documents to
                efficiently share with clients via
                <a
                  class="font-medium underline"
                  href="/admin/broadcasts/client"
                >
                  Bulk Emails</a>
              </small>
            </h1>
          </div>
          <div class="my-4 md:m-0 ml-auto">
            <template v-if="isPortalUser && !!folderId">
              <span
                v-tooltip.left="`${documentResource.limit && (documentResource.usage >= documentResource.limit) ? `Can't create more than available limit ${documentResource.limit} KB` : documentResource.limit && (documentResource.usage >= documentResource.limit) ? `Available limit of ${documentResource.limit} KB already created` : !(currentFolderData as DocumentFolder)?.clientWritable
                  ? `Don't have Folder Write Access`
                  : 'Add Folder/Files'}`
                "
                class="inline-block"
              >
                <Button
                  icon="pi pi-plus"
                  class="p-button-sm p-button-rounded"
                  aria-haspopup="true"
                  aria-controls="overlay_menu"
                  :disabled="
                    !(currentFolderData as DocumentFolder)?.clientWritable
                      || !canDoActions || (documentResource.limit && (documentResource.usage >= documentResource.limit))
                  "
                  @click="toggle"
                />
              </span>
            </template>

            <span
              v-else-if="!isPortalUser && canAccessAllMenu && !!folderId"
              v-tooltip.left="`${documentResource.limit && (documentResource.usage >= documentResource.limit) ? `Can't create more than available limit ${documentResource.limit} KB` : documentResource.limit && (documentResource.usage >= documentResource.limit) ? `Available limit of ${documentResource.limit} KB already created` : handleTooltip(
                !!canDoActions
                  && !(currentFolderData as DocumentFolder)?.isExtractionFolder,
                'Add Files',
                `${(currentFolderData as DocumentFolder)?.isExtractionFolder
                  ? 'Modifying the extraction folder is not allowed'
                  : (disabledTooltip as string)
                }`,
              )}`
              "
              class="inline-block"
            >
              <Button
                icon="pi pi-plus"
                class="p-button-sm p-button-rounded"
                aria-haspopup="true"
                aria-controls="overlay_menu"
                :disabled="
                  !canAccessAllMenu
                    || (currentFolderData as DocumentFolder)?.isExtractionFolder
                    || !canDoActions || (documentResource.limit && (documentResource.usage >= documentResource.limit))
                "
                @click="toggle"
              />
            </span>
            <!-- <Menu
          v-if="items?.length"
          id="overlay_menu"
          ref="menu"
          :model="items"
          :popup="true"
        /> -->
            <Menu
              v-if="items?.length"
              id="overlay_menu"
              ref="menu"
              :model="filteredMenuItems"
              :popup="true"
            >
              <template #item="{ item }">
                <span class="p-menuitem-link" role="menuitem" tabindex="0">
                  <span class="p-menuitem-text">{{ item.label }}</span></span>
              </template>
            </Menu>
          </div>
        </header>
      </div>

      <div>
        <GalleryDocumentStructure
          :ai-settings="orgAISettings"
          :is-portal-user="isPortalUser"
          @folder-fetched="handleFolderData"
        />
      </div>
    </TabPanel>
  </TabView>

  <Dialog
    v-model:visible="isCreateFolderDialog"
    content-class="border-round-bottom-md"
    modal
    header="Create New Folder"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <GalleryDocumentCreateFolder @success="handleCreateSuccess" />
  </Dialog>
  <Dialog
    v-model:visible="uploadDialog"
    :modal="true"
    append-to="body"
    header="Upload Files"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <p class="mb-2">
      Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
      csv.
      <br>Supported formats for Auto tag - image, pdf. <br>Max size: 20MB.
    </p>
    <!-- <Message class="mb-2 p-custom-message">
      Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
      csv.
      <br />Supported formats for Auto tag - image, pdf. <br />Max size: 20MB.
    </Message> -->
    <CommonFileUpload
      ref="uploadFileRef"
      name="fileUploads"
      custom-upload
      is-gallery-upload
      :is-portal-user="isPortalUser"
      multiple
      :max-file-size="20000000"
      :ai-settings="orgAISettings"
      is-document
      accept="application/pdf, image/png, image/jpeg, image/jpeg, image/gif, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv"
      @uploader="(files: UploadFilesPayload) => handleOnUpload(files)"
    >
      <template #empty>
        <p>Drag and drop files to here to upload.</p>
      </template>
    </CommonFileUpload>
  </Dialog>
  <Dialog
    v-model:visible="isOpenSignRequest"
    content-class="border-round-bottom-md"
    modal
    header="Select Folder/File"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <!-- <ClientsDocumentMove
      isESignature
      isSave
      :sourceId="[]"
      @select="handleSelectionRequest"
      @cancel="isOpenSignRequest = false"
    /> -->
  </Dialog>
</template>

<style lang="scss" scoped></style>
