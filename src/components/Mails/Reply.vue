<script setup lang="ts">
import type { ContentJSON, UploadFilesPayload } from '@/types/common.type';
import type {
  ConversationCreatePayload,
  GenerateSummaryPayload,
  GeneratedResponse,
  MailsAttachmentResponse,
  Thread
} from '@/types/inbox.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = defineProps<{
  thread: Thread;
  inboxId: string;
  channelType?: string;
}>();
const { currentUser, isPortalUser } = useCurrentUserData();
const queryClient = useQueryClient();
const { defaultBreakpoints } = useCommonBreakPoints();
const { replaceNewlines, copyToClipboard } = useUtilityFns();
const { initToast } = useToasts();
const { isRobotDialog, notValidData, showDialog } = useAiInfo();
const { getSummary } = useBrightAssist();
const { onUpload, isInbox, uploadFileRef } = useAttachments();
isInbox.value = true;
const mailsAttachments = ref();

const gettingSuggested = ref<GeneratedResponse[]>([]);
const currentEditorText = ref<string>();
const currentIndex = ref<number>(0);
const selectedSuggestion = ref<string>('');
const reWriteDialog = ref(false);
const suggestDialog = ref(false);
const isAutoreply = ref(false);
const isSummarizing = ref(false);
const isReply = ref(false);
const attachmentDialog = ref(false);
const selectedAttachments = ref<MailsAttachmentResponse[]>([]);
const selectedAttachmentIndex = ref<number | undefined>();

function handleCustomButtons() {
  attachmentDialog.value = true;
}
async function handleOnUpload(data: UploadFilesPayload) {
  const response: MailsAttachmentResponse[] | undefined = (await onUpload({
    payload: data
  })) as MailsAttachmentResponse[];

  selectedAttachments.value = [
    ...selectedAttachments.value,
    ...(Array.isArray(response) ? response : [])
  ];
  attachmentDialog.value = false;
}

const currentData = computed(() => {
  if (gettingSuggested.value) {
    // const data = gettingSuggested.value[currentIndex.value];
    return gettingSuggested.value[currentIndex.value];
  }
});
const currentChannelType = computed(() => {
  switch (props.channelType) {
    case 'EMAIL':
      return 'email-reply';
    case 'SUPPORT':
      return 'comment';
    default:
      return undefined;
  }
});

function showNextSuggest() {
  currentIndex.value
    = (currentIndex.value + 1) % gettingSuggested.value?.length;
}
function handleSelectSuggestion(data: any) {
  selectedSuggestion.value = replaceNewlines(data as string);
  currentEditorText.value = replaceNewlines(data as string);
  suggestDialog.value = false;
}
function handleOpenDialog(autoreply = false) {
  isAutoreply.value = autoreply;
  reWriteDialog.value = true;
}
function handleEditorValue(data: any) {
  if (data) {
    currentEditorText.value = data;
    // currentEditorText.value = data.replace(/(<([^>]+)>)/gi, '');
  }
}
function handleSuccess(data: GeneratedResponse[]) {
  reWriteDialog.value = false;
  /* initToast({
    actionType: 'Create',
    severity: 'success',
    summary: 'Generate By AI',
    actionObj: data,
    title: 'Generated Successfully',
    detail: `AI has been created successfully.`,
  }); */
  suggestDialog.value = true;
  gettingSuggested.value.push(...data);
}

const { mutateAsync: removeAttachment, isLoading: removingAttachment }
  = useMutation(
    (id: string) => {
      return useRemoveInboxAttachments(id, isPortalUser.value);
    },
    {
      onSuccess(data) {
        if (data && selectedAttachmentIndex.value !== undefined) {
          selectedAttachments.value.splice(
            selectedAttachmentIndex.value as number,
            1
          );
          selectedAttachmentIndex.value = undefined;
        }
      }
    }
  );

const { mutateAsync: reply, isLoading: replying } = useMutation(
  (payload: ConversationCreatePayload) => {
    return useConversationCreate(
      payload,
      props.inboxId,
      props.thread.id,
      isPortalUser.value
    );
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries('conversations');
      isReply.value = false;
    }
  }
);

const { mutateAsync: generateSummary, isLoading: generatingSummary }
  = useMutation(
    (payload: GenerateSummaryPayload) => {
      return getSummary(payload, isPortalUser.value);
    },
    {
      onSuccess: (data) => {
        if (Array.isArray(data) && data.length) {
          handleSuccess(data);
        }
        if (Array.isArray(data) && !data.length) {
          notValidData.value = true;
        }
      },
      onError: () => {
        notValidData.value = true;
      }
    }
  );

async function handleReply(value: ContentJSON) {
  const { client, type, orgRole, isOwner, isActive, ...agent }
    = currentUser.value;

  const payload: ConversationCreatePayload = {
    agent: { ...agent, uid: agent.id },
    contact: { ...agent, uid: agent.id },
    content: value,
    type: isPortalUser.value ? 'INCOMING' : 'OUTGOING',
    attachments: selectedAttachments.value.map(item => item.id)
  };
  await reply(payload);
  selectedSuggestion.value = '';
}

async function handleGenerateSummary() {
  isSummarizing.value = true;
  await generateSummary({ thread: props.thread.conversations });
}
async function handleCloseSuggest() {
  isSummarizing.value = false;
  gettingSuggested.value = [];
}

watchEffect(() => {
  uploadFileRef.value = mailsAttachments.value;
  isRobotDialog.value = generatingSummary.value;
});
</script>

<template>
  <div
    v-if="!isReply"
    class="w-full border-round-md"
    :class="{ 'cursor-pointer': thread.clientId }"
    :style="{ padding: '10px' }"
    @click="if (thread.clientId) isReply = true;"
  >
    <div class="bg-white p-2 w-full border-round-md text-primary font-medium">
      {{ thread.clientId ? 'Reply Here...' : `To Reply, Attach ${$tConfig('CLIENT')} First` }}
    </div>
  </div>
  <div v-else :style="{ padding: '10px' }">
    <div v-if="selectedAttachments.length" class="custom-grid mb-3">
      <MailsAttachmentPreview
        v-for="(item, index) in selectedAttachments"
        :key="item.id"
        :attachment="item"
        icon="pi pi-times text-red-500"
        icon-tooltip="Remove"
        :icon-loading="removingAttachment && selectedAttachmentIndex === index"
        @icon-click="
          selectedAttachmentIndex = index;
          removeAttachment(item.id);
        "
      />
    </div>
    <CommonEditorForm
      label="Send"
      :loading="replying"
      :is-delta="true"
      show-all-actions
      custom-btn-tooltip="Attach Files"
      custom-buttons="pi pi-paperclip"
      placeholder="Enter your message here"
      :value="selectedSuggestion"
      rewrite
      :summarize="!isPortalUser"
      :autoreply="!isPortalUser"
      @cancel="isReply = false"
      @submit="(() => handleReply)()"
      @custom-button="handleCustomButtons"
      @re-open="handleOpenDialog"
      @summarize="handleGenerateSummary"
      @auto-reply="handleOpenDialog(true)"
      @editor-value="handleEditorValue"
    />
  </div>
  <!-- :custom-buttons="'pi pi-paperclip'" -->
  <Dialog
    v-model:visible="attachmentDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <p class="mb-2">
      Supported formats: jpeg, jpg, pdf, doc, docx, xls, xlsx, ppt, pptx, txt,
      csv.
      <br>Max size: 5MB.
    </p>
    <CommonFileUpload
      ref="mailsAttachments"
      name="mailsAttachments"
      custom-upload
      :multiple="true"
      :max-file-size="5000000"
      accept="application/pdf, image/png, image/jpeg, image/jpeg, image/gif, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation, text/plain, text/csv"
      @uploader="(files: UploadFilesPayload) => handleOnUpload(files)"
    >
      <template #empty>
        <p>Drag and drop files to here to upload.</p>
      </template>
    </CommonFileUpload>
  </Dialog>
  <Dialog
    v-model:visible="suggestDialog"
    :modal="true"
    append-to="body"
    :header="`This ${
      isSummarizing ? 'summary' : 'message'
    } is generated by BrightAssistant`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
    @hide="handleCloseSuggest"
  >
    <div class="pb-2">
      <span v-html="replaceNewlines(currentData?.html as string)" />
      <div class="flex justify-content-end mt-3">
        <Button
          label="Cancel"
          class="p-button-sm p-button-danger"
          @click="suggestDialog = false"
        />
        <!-- <Button
          v-if="isSummarizing"
          label="Copy"
          class="p-button-sm ml-2"
          @click="copyToClipboard(currentData?.html as string, 'Summary')"
        /> -->
        <Button
          v-if="!isSummarizing"
          label="Continue"
          class="p-button-sm ml-2"
          @click="handleSelectSuggestion(currentData?.html)"
        />
        <Button
          v-if="gettingSuggested.length > 1"
          label="Next"
          class="p-button-sm ml-2"
          @click="showNextSuggest"
        />
      </div>
    </div>
  </Dialog>
  <Dialog
    v-model:visible="reWriteDialog"
    :modal="true"
    append-to="body"
    :header="`Which tone you want to use for your ${
      isAutoreply ? 'auto-' : ''
    }reply?`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <MailsGenerateSuggestion
      :type="currentChannelType"
      :message="currentEditorText"
      :is-autoreply="isAutoreply"
      :conversations="thread.conversations"
      @modal-close="reWriteDialog = false"
      @success="handleSuccess"
    />
  </Dialog>
  <Dialog
    v-model:visible="showDialog"
    modal
    append-to="body"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonAiInfo
      title="Hi I am BrightAssistant, your AI Team Member"
      :show-loading="generatingSummary"
    >
      <template #content>
        <p class="font-medium text-base mt-2">
          {{
            notValidData
              ? 'Apologies, There was an error. It would be helpful if you could provide more information.'
              : `Please take a moment to relax while I work on rewriting your text for you.`
          }}
        </p>
      </template>
    </CommonAiInfo>
  </Dialog>
</template>

<style lang="scss" scoped>
:deep(.p-editor-container) {
  .ql-snow.ql-toolbar button {
    float: none !important;
  }

  .ql-formats {
    display: flex;
  }

  .p-editor-toolbar {
    overflow-x: auto;
  }
}

.custom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 300px);
  grid-gap: 10px;
}
</style>
