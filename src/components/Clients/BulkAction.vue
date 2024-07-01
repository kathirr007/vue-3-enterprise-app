<script setup lang="ts">
import type { DownloadFilesAndFolders } from '@/types/attachment.type';
import type {
  BulkDocument,
  DocumentFile,
  DocumentFolder
} from '@/types/documents.type';

import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  clientId: string;
  label: string;
  document: DocumentFile[] | DocumentFolder[];
  disableDropdownBtn?: boolean;
  disableTooltip?: string;
}>();
const emits = defineEmits<{
  (event: 'success'): void;
}>();

const { featureSubscribed } = usePermissions();
const { bulkUpdateDocuments } = useDocuments();
const { isPortalUser } = useCurrentUserData();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { downLoadFilesAndFoldersAs } = useAttachments();
const bulkType = ref<'move' | 'download' | 'delete'>();
const isMoveTo = ref<boolean>(false);
const isDownload = ref<boolean>(false);
const menu = ref<any>();
const isDeleteDialogVisible = ref(false);
const selectedDocument = ref<DocumentFile[] | DocumentFolder[]>([]);
const selectedOption = computed(() => {
  switch (bulkType.value) {
    case 'move':
      return 'Move';
    case 'download':
      return 'Download';
    case 'delete':
      return 'Delete';
    default:
      return '';
  }
});
const selectedId = computed(() => {
  const folderId = props.document.map((el: any) => {
    return el.id;
  });
  return folderId.filter(el => el !== undefined);
});

const selectedFileIds = computed(() => {
  const fileId = props.document.map((el: any) => {
    if (el.filename) {
      return el.id;
    }
    return undefined;
  });

  return fileId.filter(el => el !== undefined);
});
const selectedFolderIds = computed(() => {
  const folderId = props.document.map((el: any) => {
    if (el.documentKind === 'File folder') {
      return el.id;
    }
    return undefined;
  });
  return folderId.filter(el => el !== undefined);
});

const bulkActionsMenu = ref([
  {
    label: 'Move',
    isPortal: false,
    command: () => {
      isMoveTo.value = true;
      bulkType.value = 'move';
    }
  },
  {
    label: 'Download',
    command: () => {
      isDownload.value = true;
      bulkType.value = 'download';
      selectedDocument.value = props.document;
    }
  },
  {
    label: 'Delete',
    isPortal: false,
    command: () => {
      isDeleteDialogVisible.value = true;
      selectedDocument.value = props.document;
    }
  }
]);

const filteredActionsMenu = computed(() => {
  const data = bulkActionsMenu.value.filter(val =>
    isPortalUser.value ? val.isPortal !== false && val.label : val.label
  );
  const filteredMenu = data.filter(
    val =>
      !(
        val.label === 'Download'
        && featureSubscribed('document_management', 'bulk_download') === false
      )
  );
  return filteredMenu;
});
function toggle(event: any) {
  menu.value.toggle(event);
}

function handleUpdateSuccesss() {
  isMoveTo.value = false;
  initToast({
    actionType: 'Update',
    summary: ` Update`,
    detail: ` File(s)/Folder(s) Moved successfully.`
  });
}

function handleRemove() {
  initToast({
    actionType: 'Delete',
    severity: 'error',
    summary: 'Delete',
    detail: 'File(s)/Folder(s) Deleted Successfully'
  });
}

const { mutateAsync: updateBulkDoc, isLoading: isUpdating } = useMutation(
  ['document-bulk-update'],
  (payload: BulkDocument) => {
    return bulkUpdateDocuments(props.clientId, payload, isPortalUser.value);
  },
  {
    onSuccess: () => {
      if (selectedOption.value === 'Move') {
        handleUpdateSuccesss();
      }
      else {
        handleRemove();
      }
      emits('success');
      queryClient.invalidateQueries('files-list');
      queryClient.invalidateQueries('folders-list');
      queryClient.invalidateQueries('search-docs');
    }
  }
);
const { mutateAsync: bulkDownload } = useMutation(
  async (payload: DownloadFilesAndFolders) => {
    return await downLoadFilesAndFoldersAs(
      props.clientId,
      payload,
      isPortalUser.value
    );
  },
  {
    onSuccess: (data) => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: `A download link has been sent to your email address with the files/folders you requested.`
      });
      emits('success');
      queryClient.invalidateQueries('files-list');
      queryClient.invalidateQueries('folders-list');
    }
  }
);
async function deleteBulk() {
  const payload = {
    fileIds: selectedFileIds.value,
    folderIds: selectedFolderIds.value,
    field: 'delete'
  };
  await updateBulkDoc(payload);
}
async function handleMoveSelection(id: string | null) {
  const payload = {
    fileIds: selectedFileIds.value,
    folderIds: selectedFolderIds.value,
    field: 'move',
    newFolderId: id as string
  };
  await updateBulkDoc(payload);
}
async function downloadBulk() {
  const payload = {
    fileIds: selectedFileIds.value,
    folderIds: selectedFolderIds.value
  };
  await bulkDownload(payload);
}
</script>

<template>
  <span
    v-tooltip.top="`${disableDropdownBtn ? disableTooltip : ''}`"
    class="inline-block"
  >
    <Button
      type="button"
      :label="label"
      :disabled="disableDropdownBtn"
      icon="pi pi-angle-down"
      icon-pos="right"
      class="p-button-outlined w-full sm:w-auto flex-order-0 sm:flex-order-1 mr-2"
      v-bind="$attrs"
      @click="toggle"
    />
  </span>
  <Menu ref="menu" :model="filteredActionsMenu" :popup="true" />

  <Dialog
    v-model:visible="isMoveTo"
    content-class="border-round-bottom-md"
    modal
    header="Select Folder"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
  >
    <ClientsDocumentMove
      :source-id="selectedId"
      :is-moving="isUpdating"
      @select="handleMoveSelection"
      @cancel="isMoveTo = false"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="isDeleteDialogVisible"
    :visible="isDeleteDialogVisible"
    :record-to-remove="selectedDocument as Record<string, any>"
    title="Confirm Delete"
    @confirm="deleteBulk"
    @hide="isDeleteDialogVisible = false"
  >
    <div>Are you sure you want to delete selected file(s)/folder(s) ?</div>
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="isDownload"
    :visible="isDownload"
    :record-to-remove="selectedDocument as Record<string, any>"
    title="Confirm Download"
    @confirm="downloadBulk"
    @hide="isDownload = false"
  >
    <div>
      Are you sure you want to download selected file(s)/folder(s) ?
      <br>
      You will get download link on your registered email id once download
      process will be completed.
    </div>
  </CommonConfirmRemoveDialog>
</template>
