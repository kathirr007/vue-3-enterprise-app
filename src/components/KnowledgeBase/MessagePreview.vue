<script setup lang="ts">
import type { Attachment } from '@/types/attachment.type';
import type {
  FAQ,
  KnowledgeBaseMessages,
  Source
} from '@/types/knowlege-base.type';
import type { FullNameObj } from '@/types/teams.type';
import { useMutation } from 'vue-query';

const props = defineProps<{
  queries: KnowledgeBaseMessages;
  threadId: number;
}>();
const emit = defineEmits<{
  (e: 'share-message', data: FAQ): void;
  (e: 'send-rating', index: any, rating: any): void;
}>();

const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { initToast } = useToasts();
const { currentUser } = useCurrentUserData();
const { fullName, initials } = useVueFilters();
const { getStringToHTML, replaceNewlines, isJsonStringValid } = useUtilityFns();
const { getAttachmentUrl } = useAttachments();
const { canDo } = usePermissions();
const { sendFeedback } = useKnowledgeBase();

const numMessages = props.queries.messages.length;

const badResponseComment = ref();
const showFeedbackComment = ref(false);
const feedbackSubmitted = ref(false);
const selectedIndex = ref();
const responseLiked = ref<boolean[]>(props.queries.messages.map(message => message.rating === 1));
const responseDisliked = ref<boolean[]>(props.queries.messages.map(message => message.rating === 0));

function handleShare(messageIndex: number) {
  const messageMetaData = props.queries.messages[messageIndex].metadata;
  const sources = messageMetaData
    ? isJsonStringValid(messageMetaData)
      ? (JSON.parse(messageMetaData as unknown as string).sources as Source[])
      : (messageMetaData?.sources as Source[])
    : ([] as Source[]);
  const emitData = {
    question: props.queries.messages[messageIndex - 1].content,
    answer: props.queries.messages[messageIndex].content,
    sources
  };
  emit('share-message', emitData);
}

async function handleBadResponse() {
  const metadataProps = props.queries.messages[selectedIndex.value].metadata;
  const messageOutputId = isJsonStringValid(metadataProps) ? JSON.parse(metadataProps as unknown as string).output_id : metadataProps.output_id;
  await sendKbFeedback({ threadId: props.threadId, messageId: messageOutputId, payload: { rating: 0, feedback_description: badResponseComment.value } });
  showFeedbackComment.value = false;
  feedbackSubmitted.value = true;
}

async function closeFeedbackComment() {
  if (feedbackSubmitted.value) {
    responseDisliked.value[selectedIndex.value] = true;
    emit('send-rating', selectedIndex.value, 0);
  }
  else {
    responseDisliked.value[selectedIndex.value] = false;
  }
  showFeedbackComment.value = false;
}

function showToast() {
  return initToast({
    title: 'Feedback',
    actionType: 'Update',
    detail: `Your feedback is accepted and valuable for us to provide better service in future`
  });
}

const { mutateAsync: sendKbFeedback, isLoading: sendingFeedback } = useMutation(
  async ({ threadId, messageId, payload }: { threadId: number;messageId: number;payload: any }) => {
    await sendFeedback({ threadId, messageId, payload });
  },
  {
    onSuccess: (data) => {
      showToast();
    }
  }
);

async function handleSendFeedback(index: number, rating?: 0 | 1) {
  selectedIndex.value = index;
  if (rating === 1) {
    responseLiked.value[index] = true;
    responseDisliked.value[index] = false;
  }
  else if (rating === 0) {
    responseLiked.value[index] = false;
    responseDisliked.value[index] = true;
    showFeedbackComment.value = true;
    return;
  }
  const metadataProps = props.queries.messages[index].metadata;
  const messageOutputId = isJsonStringValid(metadataProps) ? JSON.parse(metadataProps as unknown as string).output_id : metadataProps.output_id;
  await sendKbFeedback({ threadId: props.threadId, messageId: messageOutputId, payload: { rating } });
  emit('send-rating', selectedIndex.value, rating);
}
</script>

<template>
  <div class="custom-chat">
    <div class="chat">
      <div class="chat-content p-3">
        <template v-for="(message, index) in queries.messages" :key="index">
          <div
            v-if="message.role === 'user' || message.role === 'assistant'"
            class="chat-message"
            :class="message.role === 'user' ? 'send' : ''"
          >
            <Avatar
              class="mb-2"
              size="normal"
              shape="circle"
              :class="
                message.role === 'assistant' || currentUser.picture
                  ? ''
                  : 'bg-primary'
              "
              :style="{
                background:
                  message.role === 'assistant' || currentUser.picture
                    ? 'none'
                    : undefined,
              }"
            >
              <img
                v-if="message.role === 'assistant' || currentUser.picture"
                class="text-sm"
                :src="
                  message.role === 'assistant'
                    ? '/images/robot-icon.png'
                    : getAttachmentUrl((currentUser.picture as Attachment)?.path as string)
                "
                style="vertical-align: middle;"
              >
              <template v-else>
                {{
                  initials(
                    fullName(currentUser as unknown as FullNameObj) as string,
                  )
                }}
              </template>
            </Avatar>
            <div class="message border-round-lg">
              <p v-html="replaceNewlines(message.content)" />
              <template v-if="message?.metadata?.sources?.length">
                <KnowledgeBaseSources
                  :sources="message?.metadata?.sources"
                  class="my-3"
                />
              </template>
              <div class="flex align-items-center gap-2 mt-2 justify-content-between">
                <Icon
                  v-if="
                    message.role === 'assistant'
                      && canDo('broadcasts', 'create')
                  "
                  v-tooltip.top="'Share with clients'"
                  icon="fluent:share-16-filled"
                  class="text-3xl text-primary cursor-pointer"
                  role="link"
                  @click="handleShare(index)"
                  @keyup.enter="handleShare(index)"
                />
                <div
                  class="flex align-items-center gap-2"
                >
                  <Icon
                    v-if="
                      message.role === 'assistant'"
                    v-tooltip.top="'Like'"
                    :icon="responseLiked[index] ? 'mdi:like' : 'mdi:like-outline'"
                    :class="{ 'pointer-events-none ': responseLiked[index] }"
                    class="text-3xl text-primary cursor-pointer"
                    role="link"
                    @click="handleSendFeedback(index, 1)"
                  />
                  <Icon
                    v-if="
                      message.role === 'assistant'"
                    v-tooltip.top="'Dislike'"
                    :icon="responseDisliked[index] ? 'mdi:dislike' : 'mdi:dislike-outline'"
                    class="text-3xl text-primary cursor-pointer"
                    :class="{ 'pointer-events-none cursor-pointer-none': responseDisliked[index] }"
                    role="link"
                    @click="handleSendFeedback(index, 0)"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <Dialog
    v-model:visible="showFeedbackComment"
    :modal="true"
    append-to="body"
    header="Provide additional feedback"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="closeFeedbackComment"
  >
    <form class="flex flex-column gap-3" @submit.prevent="handleBadResponse">
      <div>
        <label class="block font-medium text-900 mb-2">
          How can we improve?
        </label>
        <Textarea
          v-model="badResponseComment"
          rows="3"
          class="w-full"
          placeholder="(optional) Feel free to add specific details"
        />
      </div>
      <div class="flex justify-content-end">
        <Button
          v-tooltip="'Send'"
          type="submit"
          :loading="sendingFeedback"
        >
          <i v-if="sendingFeedback" class="pi pi-spin pi-spinner mr-2" />
          Submit
        </Button>
      </div>
    </form>
  </Dialog>
</template>
