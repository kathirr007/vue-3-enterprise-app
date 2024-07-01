<script setup lang="ts">
import type { UploadFilesPayload } from '@/types/common.type';
import type {
  Attachment,
  AttachmentContentType,
  AttachmentExtension,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import { useMutation, useQueryClient } from 'vue-query';
import type { EntityType } from '@/types/tasks.type';

const props = defineProps<{
  taskId: string;
  entityType?: string;
  attachments: Attachment[];
  taskDetailsIsLoading: boolean;
  clientId?: string;
}>();
const { isPortalUser } = useCurrentUserData();
const { defaultBreakpoints } = useCommonBreakPoints();
const { getAttachmentUrl, createSavePayload, saveAttachment }
  = useAttachments();
const { isLarge } = useCommonBreakPoints();
const taskAttachmentsRef = ref<Record<string, any>>();
const { createAttachment, fileSelected } = useAttachments();
const { initToast } = useToasts();
const { fileIcon } = useVueFilters();
const queryClient = useQueryClient();
const UploadedIds = ref<string[]>([]);
const selectedAttachment = ref<Attachment>();
const isDeleteDailog = ref(false);
const isCopyDailog = ref(false);
const selectedClientId = ref<string>(props.clientId as string);

const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);

const { getClients } = useCommonListQueries();
const { data: clientList, isLoading: fetchingClients } = getClients(
  !isPortalUser.value,
  initialFilters
);

const { mutateAsync: taskAttactments } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      showToast: false,
      fileUploadRef: taskAttachmentsRef
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      UploadedIds?.value.push(data.res.id);
    }
  }
);
const { mutateAsync: addAttachment } = useMutation(
  async (payload: { attachmentId: string }) => {
    return useEntitiesAddAttachment(
      isPortalUser.value,
      props.taskId,
      props.entityType as EntityType,
      payload
    );
  }
);
const { mutateAsync: deleteAttachment } = useMutation(async (id: string) => {
  return useEntitiesDeleteAttachment(
    isPortalUser.value,
    props.taskId,
    props.entityType as EntityType,
    id
  );
});

const { mutateAsync: save } = useMutation(
  async (id: string | null) => {
    const { payload } = await createSavePayload(
      selectedAttachment.value?.id as string,
      id
    );
    return await saveAttachment(selectedClientId.value, payload);
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Add',
        summary: 'File Save',
        detail: `File <strong>${selectedAttachment.value?.name}</strong> saved successfully`
      });
      selectedAttachment.value = undefined;
      selectedClientId.value = props.clientId ? props.clientId : '';
      isCopyDailog.value = false;
    }
  }
);

async function makeParallelAPIReq(payloadArr: File[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      // filesSelected.value.push(item);
      fileSelected.value = item;
      const payload: CreateAttachment = {
        filename: item.name,
        contentType: item.type as unknown as AttachmentContentType,
        extension: item.name.split('.').pop() as unknown as AttachmentExtension,
        contentLength: item.size
      };
      // uploadFileRef.value
      await taskAttactments({ payload, file: fileSelected.value });
    })
  );
}
async function makeParallelAddAttachmentReq(payloadArr: string[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      await addAttachment({ attachmentId: item });
    })
  );
}

async function onUpload(value: UploadFilesPayload) {
  if (taskAttachmentsRef.value) {
    taskAttachmentsRef.value.isUploading = true;
  }
  if (Array.isArray(value.files)) {
    await makeParallelAPIReq(value.files);
    if (UploadedIds.value.length) {
      await makeParallelAddAttachmentReq(UploadedIds.value);
      queryClient.invalidateQueries('task-details');
      queryClient.invalidateQueries('tasks-list');
      initToast({
        actionType: 'Add',
        summary: 'File Upload',
        detail: `Total <strong>${UploadedIds.value?.length}</strong> File${
          UploadedIds.value?.length > 1 ? 's' : ''
        } uploaded successfully`
      });
      UploadedIds.value = [];
    }
  }
}

async function handleDelete(attachment: Attachment) {
  await deleteAttachment(attachment.id);
  queryClient.invalidateQueries('task-details');
  queryClient.invalidateQueries('tasks-list');

  initToast({
    actionType: 'Delete',
    summary: 'File Delete',
    detail: `File <strong>${attachment.name}</strong> deleted successfully`
  });
  isDeleteDailog.value = false;
}

function handleDownload(attachment: Attachment) {
  const link = document.createElement('a');
  link.href = getAttachmentUrl(attachment.path);
  link.setAttribute('download', attachment.name);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function handleCopy(attachment: Attachment) {
  selectedAttachment.value = attachment;
  isCopyDailog.value = true;
}

watch(
  () => props.clientId,
  (val) => {
    selectedClientId.value = val || '';
  }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="props.taskDetailsIsLoading" />
  <div v-else class="pb-4">
    <div v-if="attachments?.length" class="mb-3">
      <div v-if="isLarge" class="grid-container">
        <template v-for="(attachment, index) in attachments" :key="index">
          <TasksAttachmentPreview
            :attachment="attachment"
            @delete="
              isDeleteDailog = true;
              selectedAttachment = attachment;
            "
            @copy="handleCopy"
          />
        </template>
      </div>
      <DataTable
        v-else
        :value="attachments"
        responsive-layout="scroll"
        breakpoint="768px"
        :paginator="false"
        :header-style="{ display: 'none' }"
      >
        <template #empty>
          <div class="text-center">
            No Files found.
          </div>
        </template>

        <Column
          field="name"
          filter-field="name"
          sort-field="name"
          :show-filter-match-modes="false"
          class="w-8"
        >
          <template #body="{ data }">
            <div class="flex align-items-center break-all">
              <img
                class="w-2rem h-auto mr-1"
                :src="`${fileIcon(data.name)}`"
                :alt="data.name"
              >
              <span class="custom-text-overflow-ellipsis">
                {{ data.name }}
              </span>
            </div>
          </template>
        </Column>

        <Column class="w-4">
          <template #body="{ data }">
            <div class="flex space-x-1.5">
              <Button
                icon="pi pi-download"
                class="p-button-rounded"
                @click="handleDownload(data)"
              />
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger"
                @click="
                  isDeleteDailog = true;
                  selectedAttachment = data;
                "
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
    <p class="mb-2">
      Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
      csv.
      <br>Max size: 5MB.
    </p>
    <CommonFileUpload
      ref="taskAttachmentsRef"
      multiple
      custom-upload
      :max-file-size="5000000"
      accept="application/pdf, image/png, image/jpeg, image/jpeg, image/gif, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv"
      @uploader="(files: UploadFilesPayload) => onUpload(files)"
    >
      <template #empty>
        <div class="w-full text-lg font-medium text-center">
          <i class="pi pi-paperclip" />
          Drop Files or Add Attachments here
        </div>
      </template>
    </CommonFileUpload>
  </div>
  <CommonConfirmRemoveDialog
    v-if="isDeleteDailog"
    :visible="isDeleteDailog"
    title="Confirm Delete Attachment"
    @confirm="handleDelete(selectedAttachment as Attachment)"
    @hide="isDeleteDailog = false"
  >
    <span>
      Are you sure you want to delete the
      <strong> {{ selectedAttachment?.name }}</strong> Attachment?</span>
  </CommonConfirmRemoveDialog>

  <Dialog
    v-model:visible="isCopyDailog"
    :modal="true"
    append-to="body"
    header="Save Attachment"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    content-class="border-round-bottom-md"
    :style="{ width: '50vw' }"
    @hide="isCopyDailog = false"
  >
    <div class="field mb-2">
      <label class="block font-medium text-900">
        {{ `${$tConfig('CLIENT')}` }} <span class="text-red-600">*</span>
      </label>
      <Dropdown
        v-model="selectedClientId"
        :tabindex="0"
        name="client"
        :options="clientList"
        option-label="name"
        option-value="id"
        :filter="true"
        :placeholder="`Select ${$tConfig('CLIENT')}`"
        :loading="fetchingClients"
        :disabled="!!props.clientId"
      />
    </div>
    <ClientsDocumentMove
      v-if="selectedClientId"
      :source-id="[]"
      :client-id="selectedClientId"
      is-save
      @select="save"
      @cancel="isCopyDailog = false"
    />
  </Dialog>
</template>

<style lang="scss" scoped>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-gap: 1rem;
  place-items: center;
}

.grid-container > div {
  width: 200px;
  aspect-ratio: 1 / 1;
}

:deep(.p-datatable) {
  table > thead {
    display: none;
  }
}

.custom-text-overflow-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
