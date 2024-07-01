<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { ExtractionDocument } from '@/types/extraction.type';

const { getAll, remove, downloadFiles } = useExtraction();
const { dateToHumanShort } = useVueFilters();
const { initToast } = useToasts();
const { downloadFileAs, getAttachmentUrl, downLoadFilesAndFoldersAs }
  = useAttachments();
const { currentUser, isPortalUser } = useCurrentUserData();
const queryClient = useQueryClient();

const editDataType = ref<'File' | 'Folder'>();

const currentInstance = getCurrentInstance();
const deleteDataExtractionDialog = ref(false);
const selectedExtraction = ref<ExtractionDocument>();
const dataToModify = ref<ExtractionDocument>();

const {
  data: extractionList,
  isLoading: loadingExtractions,
  isFetching: fetchingExtractions
} = useQuery(['extraction-list'], () => {
  return getAll();
});

const { mutateAsync: deleteExtraction, isLoading: deletingExtraction }
  = useMutation(
    ['remove-extraction'],
    () => {
      return remove((dataToModify.value as ExtractionDocument).id as string);
    },
    {
      onSuccess: () => {
        deleteDataExtractionDialog.value = false;
        queryClient.invalidateQueries('extraction-list');
        initToast({
          actionType: 'Delete',
          summary: 'Extraction Deleted',
          detail: 'Data Extraction deleted successfully'
        });
      }
    }
  );

function toggleMenu(event: Event, ref: string) {
  const foundMenu = Array.isArray(
    currentInstance?.refs[ref] as InstanceType<typeof Menu>
  )
    ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
    : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);

  foundMenu && foundMenu.toggle(event);
}

const actionMenuItems = ref([
  {
    label: 'Download Extraction file as Excel',
    icon: 'pi-file-excel',
    command: () => {
      const filePath = encodeURIComponent(
        (dataToModify.value as ExtractionDocument).excelFilePath as string
      )
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');

      const pathSegments = decodeURIComponent(filePath).split('/');
      const fileName = pathSegments[pathSegments.length - 1];
      dataToModify.value
      && downloadFileAs(getAttachmentUrl(filePath), fileName);
    },
    showPortal: true
  },
  {
    label: 'Download Input files as Zip',
    icon: 'fluent:folder-zip-16-regular',
    // icon: 'ph:file-zip',
    iconify: true,
    iconClass: 'text-xl mr-1',
    command: () => {
      handleDownloadFiles();
    },
    showPortal: true
  },
  {
    label: 'Delete',
    icon: 'pi pi-trash',
    command: () => {
      deleteDataExtractionDialog.value = true;
    }
  }
]);

const { mutateAsync: downloadFileAndFolder, isLoading: downloadingFiles }
  = useMutation(
    async (id: string) => {
      return await downloadFiles(id);
    },
    {
      onSuccess: (data) => {
        initToast({
          actionType: 'Create',
          severity: 'success',
          summary: 'Success',
          detail: `A download link has been sent to your email address with the files you requested.`
        });
      }
    }
  );
async function handleDownloadFiles() {
  const payload = {
    folderIds: [(dataToModify.value as ExtractionDocument).id as string]
  };
  await downloadFileAndFolder(
    (dataToModify.value as ExtractionDocument).id as string
  );
}

function menuClick(item: MenuItem, data?: ExtractionDocument) {
  dataToModify.value = data;
  if ((dataToModify.value as ExtractionDocument).name) {
    editDataType.value = 'File';
  }
  else {
    editDataType.value = 'Folder';
  }
}
</script>

<template>
  <div id="extraction">
    <DataTable
      :value="extractionList"
      responsive-layout="scroll"
      :paginator="false"
      :loading="loadingExtractions || fetchingExtractions"
      breakpoint="768px"
    >
      <template #empty>
        <div class="text-center">
          No extraction record found.
        </div>
      </template>
      <Column header="Date">
        <template #body="{ data }">
          <span>{{
            data.updatedAt ? dateToHumanShort(data.updatedAt) : 'None'
          }}</span>
        </template>
      </Column>
      <Column :header="`${$tConfig('CLIENT')}`">
        <template #body="{ data }">
          <div>{{ data.client || 'NA' }}</div>
        </template>
      </Column>
      <Column header="Extraction">
        <template #body="{ data }">
          <div>{{ data.name }}</div>
        </template>
      </Column>
      <Column header="Extracted By">
        <template #body="{ data }">
          <div>{{ data.creator }}</div>
        </template>
      </Column>
      <Column header="Status" class="text-center">
        <template #body="{ data }: { data: ExtractionDocument }">
          <div v-if="data.isCompleted">
            {{ data.status === 'SUCCESS' ? 'Completed' : 'Failed' }}
            <span
              v-if="data.status === 'FAIL'"
              class="text-red-500 font-medium block"
            >
              {{ data.message ? `(${data.message})` : '(Unrecognized error)' }}
            </span>
          </div>
          <div v-else>
            In Progress
            <span class="font-medium block">(It may take up to 24 hrs)</span>
          </div>
        </template>
      </Column>
      <Column class="text-center w-6rem" header="Actions">
        <template #body="{ data }">
          <div class="flex justify-content-center gap-2">
            <span
              v-tooltip.top="
                !data.isCompleted
                  ? 'Extraction in progress'
                  : data.status === 'FAIL'
                    ? 'Extraction is failed'
                    : ''
              "
              class="inline-block"
            >
              <Button
                class="p-button-sm p-button-secondary p-button-rounded bg-primary"
                :icon="
                  downloadingFiles && dataToModify?.id === data.id
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-ellipsis-v'
                "
                aria-haspopup="true"
                :aria-controls="`overlay_menu_${data.id}`"
                :disabled="!data.isCompleted || data.status === 'FAIL'"
                @click.stop="toggleMenu($event, `menu-${data.id}` as string)"
              />
            </span>
            <Menu
              :id="`overlay_menu_${data.id}`"
              :ref="`menu-${data.id}`"
              :model="actionMenuItems"
              :popup="true"
            >
              <template #item="{ item }">
                <span
                  class="p-menuitem-link"
                  role="menuitem"
                  @click="menuClick(item, data)"
                >
                  <Icon
                    v-if="item.iconify"
                    class="flex-none"
                    :icon="item.icon"
                    :class="item.iconClass"
                  />
                  <span
                    v-else
                    class="p-menuitem-icon pi"
                    :class="item.icon"
                  />
                  <span class="p-menuitem-text">
                    {{ item.label }}
                  </span>
                </span>
              </template>
            </Menu>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <CommonConfirmRemoveDialog
    v-if="deleteDataExtractionDialog"
    :visible="deleteDataExtractionDialog"
    :title="`Confirm Delete ${(dataToModify as ExtractionDocument)?.name}`"
    @confirm="(() => deleteExtraction)()"
    @hide="deleteDataExtractionDialog = false"
  />
</template>
