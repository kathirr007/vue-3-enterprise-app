<script setup lang="ts">
import type { FullNameObj } from '@/types/teams.type';
import type {
  Conversation,
  ConversationAction,
  ConversationActionType,
  GenerateSummaryPayload,
  GeneratedResponse,
  Inbox,
  Thread
} from '@/types/inbox.type';
import { useMutation, useQuery } from 'vue-query';
import type { MetaObj } from '@/types/common.type';
import type { Attachment } from '@/types/attachment.type';
import type { RouterLinkProps } from 'vue-router';

const props = defineProps<{
  thread: Thread | undefined;
  inbox: Inbox;
}>();

const emits = defineEmits<{
  (e: 'reply-message', value: ConversationAction): void;
  (e: 'forward-message', value: ConversationAction): void;
  (e: 'attach-task', val: Thread): void;
  (e: 'attach-agent', val: Thread): void;
  (e: 'archive-thread', val: Thread): void;
  (e: 'restore-thread', val: Thread): void;
}>();

const { featureSubscribed } = usePermissions();
const { fullName, initials, pluralize } = useVueFilters();
const { getAttachmentUrl } = useAttachments();
const { defaultBreakpoints } = useCommonBreakPoints();
const { metaFilter, replaceNewlines, copyToClipboard } = useUtilityFns();
const { isPortalUser, currentUser } = useCurrentUserData();
const { getSummary } = useBrightAssist();
const { isRobotDialog, notValidData, showDialog } = useAiInfo();

const conversations = ref<Conversation[]>([]);
const suggestedValues = ref<GeneratedResponse[]>([]);
const suggestDialog = ref(false);
const currentIndex = ref<number>(0);
const { thread: threadProp } = toRefs(props);
const subscribeDialog = ref(false);

const currentData = computed(() => {
  if (suggestedValues.value) {
    return suggestedValues.value[currentIndex.value];
  }
});

const { isLoading: gettingConversations } = useQuery(
  ['conversations', threadProp],
  () => {
    return useConversationList({
      inboxId: props.inbox.id,
      threadId: props.thread?.id as string,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: (data) => {
      conversations.value = data;
    }
  }
);

const { data: threadDetails, isFetching: gettingThread } = useQuery(
  ['thread-details', threadProp],
  () => {
    return useThread(
      props.inbox.id,
      props.thread?.id as string,
      isPortalUser.value
    );
  }
);

function handleSuccess(data: GeneratedResponse[]) {
  suggestedValues.value.push(...data);
  suggestDialog.value = true;
}

function showNextSuggest() {
  currentIndex.value = (currentIndex.value + 1) % suggestedValues.value?.length;
}

async function handleCloseSuggest() {
  suggestedValues.value = [];
}

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

async function handleGenerateSummary() {
  if (featureSubscribed('ai_features', 'email_summary') === false) {
    subscribeDialog.value = true;
    return;
  }
  await generateSummary({ thread: (props.thread as Thread)?.conversations });
}

function handleConversationAction(message: Conversation,
  type: ConversationActionType) {
  if (type === 'reply') {
    emits('reply-message', { message, type });
  }
  if (type === 'forward') {
    emits('forward-message', { message, type });
  }
}

function getLink(id: string): RouterLinkProps['to'] {
  if (!isPortalUser.value) {
    if (threadDetails.value?.inboxData?.entities[0].type === 'TASK') {
      return {
        name: 'admin-tasks',
        query: { notificationId: id }
      };
    }
    else if (
      threadDetails.value?.inboxData?.entities[0].type === 'SUPPORTTASK'
    ) {
      return {
        name: 'admin-support',
        query: { notificationId: id }
      };
    }
    else {
      return {};
    }
  }
  return {};
}
watchEffect(() => {
  isRobotDialog.value = generatingSummary.value;
});
</script>

<template>
  <div
    v-if="gettingConversations"
    class="flex h-full justify-content-center align-items-center"
  >
    <CommonLoading />
  </div>
  <div v-else class="messages-grid-container default-border-color">
    <div
      class="flex flex-column md:flex-row border-bottom-2 default-border-color"
      :class="`${!isPortalUser ? 'message-header' : 'p-3'}`"
    >
      <div class="w-full md:w-9 mb-2 md:mb-0">
        <h2 class="text-2xl mb-0 text-primary">
          {{ thread?.displayTitle }}
        </h2>
      </div>
      <div v-if="!isPortalUser" class="w-full md:w-3 flex justify-content-end">
        <div v-tooltip.top="'Summarize'" style="height: 2.357rem;">
          <Button
            class="p-button-sm p-button-rounded ml-2 p-button p-button-icon-only p-0"
            aria-label="Summarize"
            :disabled="generatingSummary"
            @click="handleGenerateSummary"
          >
            <i v-if="generatingSummary" class="pi pi-spin pi-spinner" />
            <Icon
              v-else
              icon="material-symbols:summarize-outline-rounded"
              class="text-2xl"
            />
          </Button>
        </div>
        <div
          v-if="threadDetails?.channel !== 'SUPPORT'"
          v-tooltip.top="'Attach Task'"
          style="height: 2.357rem;"
        >
          <Button
            icon="pi pi-plus"
            class="p-button-sm p-button-rounded"
            aria-label="Attach Task"
            @click="emits('attach-task', thread as Thread)"
          />
        </div>
        <div v-tooltip.top="'Attach Agent'" style="height: 2.357rem;">
          <Button
            icon="pi pi-user"
            class="p-button-sm p-button-rounded ml-2 p-button p-button-icon-only p-0"
            aria-label="Attach Agent"
            @click="emits('attach-agent', thread as Thread)"
          >
            <Icon icon="material-symbols:headphones" class="text-2xl" />
          </Button>
        </div>
        <div
          v-if="thread?.isActive"
          v-tooltip.top="'Archive'"
          style="height: 2.357rem;"
        >
          <Button
            icon="pi"
            class="p-button-sm p-button-rounded ml-2 p-button p-button-icon-only p-0"
            aria-label="Archive"
            @click="emits('archive-thread', thread as Thread)"
          >
            <div class="flex-none">
              <Icon icon="fa6-solid:box-archive" class="text-lg" />
            </div>
          </Button>
        </div>
        <div v-else v-tooltip.top="'Restore'" style="height: 2.357rem;">
          <Button
            icon="pi "
            class="p-button-sm p-button-rounded ml-2 p-button p-button-icon-only p-0"
            aria-label="Restore"
            @click="emits('restore-thread', thread as Thread)"
          >
            <div class="flex-none">
              <Icon icon="prime:undo" class="text-2xl" />
            </div>
          </Button>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap p-2 px-3 message-details-container">
      <div
        v-if="threadDetails?.inboxData?.clients.length"
        class="inline-flex align-items-center"
      >
        <i
          v-tooltip.top="`${pluralize($tConfig('CLIENT'))}`"
          class="pi pi-users text-primary text-xl mr-1"
        />
        <div
          class="flex align-items-center flex-wrap flex-1 ml-2 avatar-overlap"
        >
          <template
            v-for="(item, index) in threadDetails?.inboxData?.clients"
            :key="index"
          >
            <router-link
              v-tooltip.top="`${item.name}`"
              :to="
                !isPortalUser
                  ? {
                    name: 'admin-clients-id',
                    params: { id: item.id },
                  }
                  : {}
              "
            >
              <!-- <Tag :value="item.name" class="cursor-pointer"></Tag> -->
              <Avatar
                class="bg-primary"
                size="normal"
                shape="circle"
                :style="{
                  width: '1.7rem',
                  height: '1.7rem',
                  fontSize: '0.8rem !important',
                }"
              >
                {{ initials(item.name) }}
              </Avatar>
            </router-link>
          </template>
        </div>
        <Divider
          v-if="
            threadDetails?.inboxData?.assignedAgents.length
              || threadDetails?.inboxData?.entities.length
              || threadDetails?.inboxData?.projects.length
          "
          layout="vertical"
        />
      </div>
      <div
        v-if="threadDetails?.inboxData?.assignedAgents.length"
        class="inline-flex align-items-center"
      >
        <Icon
          v-tooltip.top="'Agents'"
          icon="material-symbols:headphones"
          class="text-primary text-2xl mr-1"
        />
        <div
          class="flex align-items-center flex-wrap flex-1 ml-2 avatar-overlap"
        >
          <template
            v-for="(item, index) in threadDetails?.inboxData?.assignedAgents"
            :key="index"
          >
            <router-link
              v-tooltip.top="`${fullName(item)}`"
              :to="
                !isPortalUser
                  ? { name: 'admin-teams-id', params: { id: item.id } }
                  : {}
              "
            >
              <Avatar
                class="bg-primary"
                size="normal"
                shape="circle"
                :style="{
                  width: '1.7rem',
                  height: '1.7rem',
                  fontSize: '0.8rem !important',
                }"
              >
                <img
                  v-if="item?.picture"
                  class="text-sm"
                  :src="getAttachmentUrl((item?.picture as Attachment).path)"
                  style="vertical-align: middle;"
                  :alt="`${fullName(item as unknown as FullNameObj)}`"
                >
                <template v-else>
                  {{
                    initials(fullName(item as unknown as FullNameObj) as string)
                  }}
                </template>
              </Avatar>
              <!-- <Tag :value="fullName(item)" class="cursor-pointer"></Tag> -->
            </router-link>
          </template>
        </div>
        <Divider
          v-if="
            threadDetails?.inboxData?.entities.length
              || threadDetails?.inboxData?.projects.length
          "
          layout="vertical"
        />
      </div>
      <div
        v-if="threadDetails?.inboxData?.entities.length"
        class="inline-flex align-items-center"
      >
        <i
          v-tooltip.top="'Tasks'"
          class="pi pi-check-square text-primary text-xl"
        />
        <div class="flex flex-wrap gap-1 flex-1 ml-2">
          <template
            v-for="(item, index) in threadDetails?.inboxData?.entities"
            :key="index"
          >
            <router-link
              v-tooltip.top="metaFilter(item.meta as MetaObj[], 'title')"
              :to="getLink(item.id)"
            >
              <Tag
                :value="metaFilter(item.meta as MetaObj[], 'title')"
                class="cursor-pointer"
                severity="success"
                rounded
              />
            </router-link>
          </template>
        </div>
        <Divider
          v-if="threadDetails?.inboxData?.projects.length"
          layout="vertical"
        />
      </div>
      <div
        v-if="threadDetails?.inboxData?.projects.length"
        class="inline-flex align-items-center"
      >
        <i
          v-tooltip.top="'Projects'"
          class="pi pi-custom flex-none pi-rectangle-list w-1.5rem h-1.5rem"
        />
        <div class="flex flex-wrap gap-1 flex-1 ml-2">
          <template
            v-for="(item, index) in threadDetails?.inboxData?.projects"
            :key="index"
          >
            <router-link
              v-tooltip.top="item.name"
              :to="
                !isPortalUser
                  ? {
                    name: 'admin-projects-id',
                    params: { id: item.id },
                  }
                  : {}
              "
            >
              <Tag
                :value="item.name"
                class="cursor-pointer"
                severity="success"
                rounded
              />
            </router-link>
          </template>
        </div>
      </div>
    </div>
    <MailsMessagesPreview
      :messages="conversations"
      :client-id="(thread?.clientId as string)"
    />
    <div class="border-top-2 default-border-color p-2 overflow-hidden">
      <MailsReply
        :thread="(thread as Thread)"
        :channel-type="threadDetails?.channel"
        :inbox-id="inbox.id"
      />
    </div>
  </div>
  <Dialog
    v-model:visible="suggestDialog"
    :modal="true"
    append-to="body"
    header="This summary is generated by BrightAssistant"
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
        <Button
          label="Copy"
          class="p-button-sm ml-2"
          @click="copyToClipboard(currentData?.html as string, 'Summary')"
        />
        <Button
          v-if="suggestedValues.length > 1"
          label="Next"
          class="p-button-sm ml-2"
          @click="showNextSuggest"
        />
      </div>
    </div>
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
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="email summary"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped>
.pi-custom {
  &.pi-rectangle-list::before {
    background-color: $primaryColor;
  }
}

.avatar-overlap {
  > a {
    margin-left: -5px;
    transition: all 0.25s;

    &:hover:not(:nth-child(1)) {
      .p-avatar {
        margin: 0 7.5px;
      }

      z-index: 1;
    }

    .p-avatar {
      border: 2px solid #fff;
      transition: all 0.25s;
    }
  }
}

:deep(.p-tag) {
  font-size: 0.65rem !important;
}

.messages-grid-container {
  display: grid;
  grid-template-rows: max-content max-content minmax(auto, 85%) max-content;
  grid-template-columns: 1fr;
  width: 100%;
  height: 100%;
  border-color: $borderColor;

  .message-header {
    padding: 0.75rem 1rem 0.67rem;
  }

  .message-details-container {
    background-color: var(--body-bg-color);
  }
}

:deep(*) {
  .p-divider-vertical {
    &::before {
      // border-left-width: 2px;
      border-color: $primaryColor;
    }
  }
}
</style>
