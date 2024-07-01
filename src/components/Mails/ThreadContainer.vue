<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import DataTable from 'primevue/datatable';
import type { PageState } from 'primevue/paginator';
import { useRouteQuery } from '@vueuse/router';
import type {
  Conversation,
  ConversationAction,
  ConversationActionType,
  Inbox,
  Thread,
  ThreadType
} from '@/types/inbox.type';
import type { FullNameObj } from '@/types/teams.type';
import type { PaginatedResponse } from '@/types/common.type';
import type { Client } from '@/types/client.type';

const props = withDefaults(
  defineProps<{
    // isCreateThread?: boolean;
    inbox: Inbox;
    hideFilters?: boolean;
    disabledFilters?: string[];
  }>(),
  { disabledFilters: () => [], hideFilters: false }
);

const { defaultBreakpoints, styles, isLarge } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { initials, fullName, dateToHumanShort } = useVueFilters();
const { getAttachmentUrl } = useAttachments();
const { initToast } = useToasts();
const { isPortalUser, currentUser } = useCurrentUserData();
const {
  toggleFilters,
  queryKeys,
  filtersRef,
  queryFilters,
  isFiltersVisible
} = useDataTableUtils();

const isCreateThread = ref(false);
const openTaskCreate = ref(false);
const formKey = ref(0);

const threads = ref<PaginatedResponse<Thread>>();
const selectedThreadType = ref<string>();
const selectedThread = ref<Thread>();
const selectedThreadForAddAgent = ref<Thread>();
const isAddAgentDialogVisible = ref<boolean>(false);
const inboxId = ref<string>('');
const threadId = ref<string>('');
const selectedMails = ref<string[]>([]);
const page = ref<number>(1);
const limit = ref<number>(15);
const isAttachDailog = ref<boolean>(false);
const router = useRouter();
const type = useRouteQuery<string>('type');

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const creationTitle = ref<string>('Create Thread');
const messageActionType = ref<ConversationActionType>();
const isThreadCreate = ref<boolean>(!!isCreateThread.value);
const selectedConversation = ref<Conversation>();
const { data: filterData, applyFilter } = useFilterColumns();

const selectedFolderName = ref<string>('Focused');
const clientListData = ref<Client[]>();
const currentClientId = ref<string[]>();

const items = computed(() => [
  {
    items: [
      {
        label: 'Focused',
        icon: 'pi pi-eye',
        isPortal: true,
        command: () => {
          selectedFolderName.value = 'Focused';
          if (clientData.value) {
            /* clientListData.value = clientData.value?.results.map(
              (val: any) => val.id
            );
            currentClientId.value = clientData.value?.results.map(
              (val: any) => val.id
            ); */
          }
          handleFocused();
        },
        class: selectedFolderName.value === 'Focused' ? 'focused' : ''
      },
      {
        label: 'Others',
        icon: 'pi pi-file',
        isPortal: !isPortalUser.value,
        command: () => {
          selectedFolderName.value = 'Others';
          handleOthers();
        },
        class: selectedFolderName.value === 'Others' ? 'focused' : ''
      },
      {
        label: 'Archived',
        icon: 'pi pi-archived w-1rem h-1rem',
        isPortal: !isPortalUser.value,
        command: () => {
          selectedFolderName.value = 'Archived';
          currentClientId.value = undefined;
          clientListData.value = undefined;
          archiveData();
        },
        class: selectedFolderName.value === 'Archived' ? 'focused' : ''
      }
    ]
  }
]);
const menuList = computed(() => {
  if (items.value) {
    const results = items.value.map(val => val);
    return results[0].items.filter((val: any) => val.isPortal === true);
  }
});

const { data: clientData } = useQuery(
  ['clients-list'],
  async () => {
    const clients = await useClientListV2({});
    return clients;
  },
  {
    onSuccess: (data: { results: Client[]; total: number }) => {
      if (!type.value) {
        clientListData.value = data.results.map((val: any) => val.id);
      }
    },
    enabled: !isPortalUser.value
  }
);

const initialFilters = computed(() => {
  if (type.value === 'Archived') {
    applyFilter('Is Active', 'false');
  }
  else {
    applyFilter('Is Active', 'true');
  }
  if (clientListData.value === undefined) {
    setTimeout(() => {
      handleQuery();
    }, 2000);
    return useEncodeFilterData(filterData);
  }
  else {
    if (type.value === 'Others') {
      applyFilter('Clients', 'null');
    }
    // else applyFilter('Clients', clientListData.value);
    return useEncodeFilterData(filterData);
  }
});

const { isFetching: fetchingThread } = useQuery(
  ['threads', props.inbox.id, ...queryKeys, page],
  () => {
    return useThreadList({
      inboxId: props.inbox.id,
      page: page.value,
      limit: limit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters.value,
      isPortal: isPortalUser.value,
      clientId: currentUser.value?.client?.id,
      threadType:
        (type.value as ThreadType) || (selectedFolderName.value as ThreadType)
    });
  },

  {
    enabled: !!props.inbox.id,
    onSuccess: (res) => {
      threads.value = res;
    }
  }
);

function handleCreate() {
  openTaskCreate.value = true;
}
function handleClose() {
  openTaskCreate.value = false;
}

function handlePageChange(event: PageState) {
  page.value = event.page + 1;
}

function handleAttachAgent(thread: Thread) {
  selectedThreadForAddAgent.value = thread;
  isAddAgentDialogVisible.value = true;
}

function handleAttachTask(thread: Thread) {
  isAttachDailog.value = true;
  inboxId.value = props.inbox.id as string;
  threadId.value = thread.id as string;
  if (thread.channel === 'SUPPORT')
    selectedThreadType.value = 'SUPPORTTASK';
  else selectedThreadType.value = 'TASK';
}

function handleMessageAction(val: ConversationAction) {
  selectedConversation.value = {
    ...val.message
  };
  isThreadCreate.value = true;
  creationTitle.value
    = val.type === 'reply' ? 'Reply Conversation' : 'Forward Conversation';
  messageActionType.value = val.type;
  // emit('conversationAction');
}

const { mutateAsync: addAgent } = useMutation(
  (payload: { agent: { uid: string } }) =>
    useAddAgentToThread(
      props.inbox.id,
      selectedThreadForAddAgent.value?.id as string,
      payload
    ),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['threads', props.inbox.id, page, limit]);
      queryClient.invalidateQueries('thread-details');
      isAddAgentDialogVisible.value = false;
      initToast({
        actionType: 'Add',
        summary: `${
          selectedThreadForAddAgent?.value?.agentId ? 'Reassign' : 'Add'
        } Agent`,
        detail: `Thread Agent updated Successfully`
      });
      selectedThreadForAddAgent.value = undefined;
    }
  }
);
const { mutateAsync: removeAgent } = useMutation(
  (agentId: string) =>
    useRemoveAgentToThread(
      props.inbox.id,
      selectedThreadForAddAgent.value?.id as string,
      agentId
    ),
  {
    onSuccess: () => {
      initToast({
        actionType: 'Remove',
        summary: 'Remove Agent',
        detail: `Thread Agent removed Successfully`
      });
    }
  }
);
const { mutateAsync: ArchiveThread } = useMutation(
  (threadId: string) => useArchiveThread(props.inbox.id, threadId),
  {
    onSuccess: () => {
      initToast({
        actionType: 'Archive',
        summary: 'Archive Thread',
        detail: `Thread Archived Successfully`
      });
      selectedThread.value = undefined;
      handleQuery();
    }
  }
);

const { mutateAsync: restoreThreads } = useMutation(
  (threadId: string) => useRestoreThread(props.inbox.id, threadId),
  {
    onSuccess: () => {
      initToast({
        actionType: 'Restore',
        summary: 'Restore Thread',
        detail: `Thread Restored Successfully`
      });
      selectedThread.value = undefined;
      handleQuery();
    }
  }
);

function updateSelectedThread(data: Thread) {
  selectedThread.value = data;
  closeCreateThread();
}

function closeCreateThread() {
  messageActionType.value = undefined;
  selectedConversation.value = undefined;
  creationTitle.value = 'Create Thread';
  isThreadCreate.value = false;
  isCreateThread.value = false;
  // emit('closeCreateThread');
}

async function handleAddAgent(data: any, detachableAgent?: string) {
  if (detachableAgent) {
    await removeAgent(detachableAgent);
  }
  if (data.uid)
    addAgent({ agent: data });
}

function handleQuery() {
  queryClient.invalidateQueries(['threads', props.inbox.id, page, limit]);
  queryClient.invalidateQueries('thread-details');
  queryClient.invalidateQueries('conversations');
}

function handleCurrentSelected(val: string[]) {
  if (val) {
    currentClientId.value = val;
  }
}

function handleOthers() {
  if (currentClientId.value) {
    applyFilter('Clients', 'null');
    applyFilter('Is Active', 'true');
    const preparedFilters = useEncodeFilterData(filterData);

    selectedThread.value = undefined;
    router.push({
      query: {
        type: 'Others',
        filters: preparedFilters
      }
    });
    handleQuery();
  }
  else {
    applyFilter('Clients', 'null');
    applyFilter('Is Active', 'true');
    const preparedFilters = useEncodeFilterData(filterData);
    selectedThread.value = undefined;
    router.push({
      query: {
        type: 'Others',
        filters: preparedFilters
      }
    });
    handleQuery();
  }
}

function handleFocused() {
  // isApplyFilter.value = true;
  if (currentClientId.value) {
    applyFilter('Clients', currentClientId.value);
    applyFilter('Is Active', 'true');
    const preparedFilters = useEncodeFilterData(filterData);
    selectedThread.value = undefined;
    router.push({
      query: {
        type: 'Focused',
        filters: preparedFilters
      }
    });
    handleQuery();
  }
  else {
    // applyFilter('Clients', clientListData.value);
    applyFilter('Is Active', 'true');
    const preparedFilters = useEncodeFilterData(filterData);
    selectedThread.value = undefined;
    router.push({
      query: {
        type: 'Focused',
        filters: preparedFilters
      }
    });
    handleQuery();
  }
}
function archiveData() {
  applyFilter('Is Active', 'false');
  if (currentClientId.value) {
    applyFilter('Clients', currentClientId.value);
  }
  else {
    applyFilter('Clients', undefined);
  }
  const preparedFilters = useEncodeFilterData(filterData);

  selectedThread.value = undefined;
  router.push({
    query: {
      type: 'Archived',
      filters: preparedFilters
    }
  });
  handleQuery();
}

function rowClass(data: any) {
  return `${
    data.id === selectedThread.value?.id ? 'bg-blue-100' : ''
  } border-bottom-2`;
}

function handleRefresh() {
  handleQuery();
}

function handleArchive(thread: Thread) {
  if (thread) {
    ArchiveThread(thread.id);
  }
}

function handleRestore(thread: Thread) {
  if (thread)
    restoreThreads(thread.id);
}

watchEffect(() => {
  if (isThreadCreate.value) {
    // selectedThread.value = undefined;
  }
});

onMounted(() => {
  nextTick(() => {
    setInterval(() => {
      queryClient.invalidateQueries(['threads', props.inbox.id, page, limit]);

      queryClient.invalidateQueries('conversations');
      // handleQuery();
    }, 30000);
  });
  if (type.value) {
    selectedFolderName.value = type.value as string;
  }
});

watch(
  () => isCreateThread.value,
  (val) => {
    isThreadCreate.value = !!val;
    messageActionType.value = undefined;
    selectedConversation.value = undefined;
    creationTitle.value = 'Create Thread';
  }
);

watch(
  () => clientData.value,
  (data) => {
    if (
      data
      && (type.value === 'Focused' || selectedFolderName.value === 'Focused')
    ) {
      if (!type.value) {
        clientListData.value = data?.results.map((val: any) => val.id);
      }
      // filtersRef.value.handleFilters();
      // canFetchThreads.value = true;
      // handleFocused();
    }
  }
);

function getClientUserName(clients: Client[] | Client, clientId: string) {
  if (!clientId)
    return false;
  if (Array.isArray(clients)) {
    const clientUser = clients.find(client => client.id === clientId);
    return clientUser?.name;
  }
  else return clients?.name;
}
function handleSuccessAttach(data: string) {
  isAttachDailog.value = false;
  if (!data) {
    selectedThread.value = undefined;
  }
}
</script>

<template>
  <div class="flex row-gap-1 mb-4 justify-content-between">
    <h1 class="font-medium text-3xl text-primary mb-0">
      Mails
    </h1>
    <div class="flex">
      <Button
        v-tooltip.top="'Refresh'"
        icon="pi pi-refresh"
        class="p-button-rounded ml-2 p-button p-button-icon-only p-0"
        aria-label="refresh"
        :loading="fetchingThread"
        @click="handleRefresh"
      >
        <Icon icon="charm:refresh" class="text-base" />
      </Button>

      <Button
        v-if="!isPortalUser"
        v-tooltip.top="'Mailbox Configuration'"
        icon="pi pi-cog"
        class="p-button-rounded ml-2 p-button p-button-icon-only p-0"
        :disabled="!inbox"
        @click="isCreateThread = true"
      />
      <a
        href="https://brightreturn.com/kb/email-inbox-management"
        target="_blank"
      >
        <Button
          v-tooltip.top="'Need Help'"
          type="button"
          icon="pi pi-question-circle text-lg"
          class="p-button-icon-only p-button-rounded ml-2"
        />
      </a>
    </div>
  </div>
  <div
    class="grid grid-nogutter flex-nowrap mails-wrapper surface-overlay border-round-lg border-2 default-border-color"
  >
    <div class="mail-folders border-right-2 default-border-color">
      <h2
        class="mb-0 p-3 font-medium text-2xl text-primary border-bottom-2 default-border-color"
      >
        Folders
      </h2>
      <div class="mail-scroll-section flex-1 p-2 bg-white">
        <div class="w-full">
          <Menu ref="menu" :model="menuList" class="w-auto h-full" />
        </div>
        <template v-if="selectedFolderName !== 'Others' && !isPortalUser">
          <div class="mt-5">
            <label :for="`${$tConfig('CLIENT').toLowerCase()}`" class="block font-semibold text-lg mb-1">
              Select {{ `${$tConfig('CLIENT').toLowerCase()}` }}
            </label>
          </div>
          <div class="flex flex-wrap gap-1">
            <MailsFilter
              ref="filtersRef"
              :mails-to-filter="selectedFolderName"
              :filters="queryFilters"
              :disabled-filters="disabledFilters"
              :hide-filters="hideFilters"
              @toggle="toggleFilters(!!queryFilters)"
              @current-selected-id="handleCurrentSelected"
            />
          </div>
        </template>
      </div>
    </div>
    <div class="col-3 border-right-2 default-border-color">
      <h2
        class="mb-0 p-3 font-medium text-2xl text-primary border-bottom-2 default-border-color flex flex-wrap justify-content-between align-items-center"
      >
        {{ selectedFolderName }}
        <div class="flex flex-wrap gap-2">
          <Button
            v-if="!hideFilters"
            type="button"
            :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
            class="p-button-icon-only p-button-rounded"
            :class="[{ 'p-button-danger': queryFilters }]"
            @click="toggleFilters(!!queryFilters)"
          />
          <Button
            v-if="!isPortalUser"
            v-tooltip="'Start Conversation'"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="handleCreate"
          />
        </div>
        <div v-if="isFiltersVisible && !hideFilters" class="mt-4 mb-2">
          <MailsChannelFilter
            ref="filtersRef"
            :filters="queryFilters"
            :disabled-filters="disabledFilters"
          />
        </div>
      </h2>
      <div class="relative p-datatable-threads">
        <DataTable
          ref="datatableRef"
          v-model:filters="filters"
          v-model:selection="selectedMails"
          :value="threads?.results || []"
          :loading="fetchingThread"
          responsive-layout="scroll"
          breakpoint="768px"
          :global-filter-fields="['title']"
          :paginator="false"
          :always-show-paginator="false"
          :page-link-size="3"
          filter-display="menu"
          class="border-noround"
          :class="
            (threads?.total as number) > 15
              ? 'datatable-scroll-section'
              : 'mail-scroll-section'
          "
          data-key="firstName"
          :empty-message="fetchingThread ? 'Loading...' : 'No mails found.'"
          :row-class="rowClass"
          @page="handlePageChange"
        >
          <template #empty>
            <div class="text-center">
              No mails found.
            </div>
          </template>
          <Column class="flex-1 w-5rem">
            <template #body="{ data }">
              <div
                class="flex cursor-pointer align-items-center"
                tabindex="0"
                role="link"
                :aria-label="data.displayTitle"
                @click="updateSelectedThread(data)"
              >
                <Avatar class="bg-primary mr-1" size="normal" shape="circle">
                  <img
                    v-if="!data.clientId && data.contact?.picture"
                    class="text-sm"
                    :src="getAttachmentUrl(data.contact.picture)"
                    style="vertical-align: middle;"
                    :alt="`${fullName(data.contact as unknown as FullNameObj)}`"
                  >
                  <template v-else>
                    {{
                      initials(
                        getClientUserName(
                          data.contact?.company?.client,
                          data.clientId,
                        ) || fullName(data.contact as unknown as FullNameObj),
                      )
                    }}
                  </template>
                </Avatar>
                <div class="flex flex-1 flex-column">
                  <div
                    class="flex justify-content-between font-medium align-items-center"
                  >
                    <span class="flex-1">
                      {{
                        getClientUserName(
                          data.contact?.company?.client,
                          data.clientId,
                        ) || fullName(data.contact as unknown as FullNameObj)
                      }}
                    </span>
                    <div class="thread-actions-container">
                      <Icon
                        v-if="data.channel === 'SUPPORT'"
                        v-tooltip="'Support Task'"
                        icon="tabler:ticket"
                        class="p-1 text-3xl border-circle"
                      />
                    </div>

                    <div
                      v-if="!isPortalUser"
                      class="thread-actions-container hidden"
                    >
                      <i
                        v-if="data.channel !== 'SUPPORT'"
                        v-tooltip="'Attach Task'"
                        class="pi pi-plus mr-2 hover:bg-gray-100 p-1"
                        @click.stop="handleAttachTask(data)"
                      />
                      <Icon
                        v-tooltip="'Attach Agent'"
                        icon="material-symbols:headphones"
                        class="hover:bg-gray-100 p-1 text-2xl border-circle"
                        @click.stop="handleAttachAgent(data)"
                      />
                      <template v-if="data.isActive">
                        <Icon
                          v-tooltip="'Archive'"
                          icon="quill:folder-archive"
                          class="hover:bg-gray-100 p-1 text-2xl border-circle"
                          @click.stop="handleArchive(data)"
                        />
                      </template>
                      <template v-else>
                        <Icon
                          v-tooltip="'Restore'"
                          icon="prime:undo"
                          class="hover:bg-gray-100 p-1 text-2xl border-circle"
                          @click.stop="handleRestore(data)"
                        />
                      </template>
                    </div>
                  </div>
                  <div
                    class="custom-line-clamp-1 font-medium"
                    :title="`${data.displayTitle}`"
                  >
                    {{ data.displayTitle }}
                  </div>
                  <div class="flex justify-content-between">
                    <span
                      class="w-11 mr-1 truncate custom-line-clamp-1"
                      :title="data.displayExcerpt"
                      v-html="data.displayExcerpt"
                    />
                    <span class="pl-1">
                      {{ dateToHumanShort(data.updatedAt, 'DD/MM/YY') }}
                    </span>
                  </div>
                </div>
              </div>
            </template>
          </Column>
        </DataTable>
        <div
          v-if="(threads?.total as number) > 15"
          class="absolute bottom-0 w-full bg-white border-top-1 border-gray-50 threads-paginator"
        >
          <Paginator
            :rows="15"
            :always-show-paginator="false"
            :total-records="threads?.total"
            :template="{
              '1300px': 'PrevPageLink CurrentPageReport NextPageLink',
              'default': 'FirstPageLink PrevPageLink NextPageLink LastPageLink',
            }"
            @page="handlePageChange"
          />
        </div>
      </div>
    </div>
    <div class="flex-1">
      <div
        class="mt-4 md:mt-0 flex-1 fadeinright messages-scroll-section border-round-right-lg"
        :class="{ fadeoutright: !selectedThread }"
      >
        <MailsSetting
          v-if="isCreateThread"
          :inbox="inbox"
          class="mails-settings"
          @cancel="isCreateThread = false"
        />
        <MailsMessages
          v-else-if="selectedThread"
          :thread="selectedThread"
          :inbox="inbox"
          @reply-message="handleMessageAction"
          @forward-message="handleMessageAction"
          @attach-task="handleAttachTask"
          @attach-agent="handleAttachAgent"
          @archive-thread="handleArchive"
          @restore-thread="handleRestore"
        />

        <div
          v-else
          class="surface-section w-full h-full flex justify-content-center align-items-center"
        >
          <div class="text-400 text-center">
            <div class="text-900 font-bold mb-2">
              <Icon icon="fa6-solid:envelope" class="text-8xl" />
            </div>
            <p class="mb-1 text-xl">
              <strong>Select an item to read</strong>
            </p>
            <div class="text-500 text-sm">
              Nothing is selected.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Dialog
    v-model:visible="isAttachDailog"
    :modal="true"
    append-to="body"
    header="Attach Task"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="isAttachDailog = false"
  >
    <MailsAttachTask
      :thread-id="threadId"
      :inbox-id="inboxId"
      :type="selectedThreadType"
      @cancel="isAttachDailog = false"
      @success="handleSuccessAttach"
      @modal-close="isAttachDailog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isAddAgentDialogVisible"
    :modal="true"
    :dismissable-mask="true"
    :header="`${
      selectedThreadForAddAgent?.agentId ? 'Reassign' : 'Add'
    } Agent to Thread`"
    :base-z-index="10000"
    :style="{ width: '30vw' }"
    content-class="border-round-bottom-md"
    @hide="selectedThreadForAddAgent = undefined"
  >
    <MailsAddAgent
      :thread="(selectedThreadForAddAgent as Thread)"
      :inbox="inbox"
      @add-agent="handleAddAgent"
    />
  </Dialog>
  <Dialog
    v-model:visible="openTaskCreate"
    :modal="true"
    append-to="body"
    header="Start Conversation"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <TasksCreateUpdate
      v-if="isLarge"
      :client-id="currentUser.client?.id"
      :firm-support-task="true"
      :is-support-task="true"
      @close="handleClose"
    />
    <TasksMobileCreateUpdate
      v-else
      :client-id="currentUser.client?.id"
      :firm-support-task="true"
      :is-support-task="true"
      @close="handleClose"
    />
  </Dialog>
</template>

<style lang="scss" scoped>
.messages-scroll-section {
  height: calc(100vh - 260px);
  overflow-y: auto;
  // border-radius: $cardBorderRadius;
}

.mail-scroll-section {
  height: calc(100vh - 320px);
  overflow-y: auto;
  // border-radius: $cardBorderRadius;
}

.p-datatable-threads {
  // border: 2px solid #a1b1cc;
  // border-radius: 10px;
  height: calc(100vh - 320px);
  background-color: #fff;

  .p-datatable {
    height: calc(100vh - 391.53px);
    overflow-y: auto;
    border: none;
  }

  /* .threads-paginator {
    border-radius: 0 0 10px 10px;
  } */
}

:deep(.p-datatable) {
  td {
    padding: 0.5rem !important;
    transition: all 1s ease;

    .thread-actions-container > i {
      border-radius: 50%;
      transition: all 0.25s ease;
    }

    &:hover {
      .thread-actions-container {
        display: flex !important;
      }
    }
  }

  &.p-datatable .p-datatable-tbody > tr.p-highlight {
    color: #1d4ed8 !important;
    background-color: #eff6ff !important;
  }

  tbody:last-child {
    tr {
      border-color: $borderColor !important;
    }
  }

  thead.p-datatable-thead {
    display: none;
  }

  .p-button.p-button-sm .p-button-icon {
    font-size: 1rem !important;
  }
}

.p-divider.p-divider-vertical::before {
  border-left: solid 1px var(--primary-color) !important;
}

.mail-folders {
  width: 290px;

  .mail-scroll-section {
    border-bottom-left-radius: 0.5rem;
  }

  :deep(.p-multiselect) {
    .p-multiselect-label {
      white-space: unset !important;
    }
  }
}

.mails-settings {
  :deep(.p-multiselect) {
    /* .p-multiselect-label {
      white-space: unset !important;
      gap: 5px;
      display: flex;
      flex-wrap: wrap;
      .p-multiselect-token {
        margin-right: 0;
      }
    } */
  }
}

:deep(.p-menu) {
  background: none;
  border: none;
  border-radius: none;

  .focused {
    .p-menuitem-text {
      color: $primaryColor !important;
    }

    background-color: var(--body-bg-color);
    border-radius: $borderRadius;

    .p-menuitem-icon {
      &.pi-archived::before {
        background-color: $primaryColor !important;
      }

      color: $primaryColor !important;
    }
  }

  .p-menuitem-link {
    display: flex;
    flex-direction: row !important;
    align-items: start;
    padding: 0.5rem !important;
    margin-bottom: 0.5rem !important;
    font-weight: 900;
    // font-size: 1.125rem;
    line-height: 1.75rem;
    transition: all 0.3s ease;

    .p-menuitem-icon {
      &.pi-archived::before {
        background-color: $primaryColor !important;
      }
    }

    &:hover {
      .p-menuitem-text {
        // color: white !important;
      }

      background-color: var(--body-bg-color) !important;
      border-radius: $borderRadius;
    }
  }

  .p-submenu-header {
    margin: 0;
    font-weight: 600;
    background: none !important;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  }
}

.custom-border {
  padding: 0.5rem !important;
  background-color: #fcfcfc !important;
  border: 2px solid #a1b1cc !important;
  border-radius: 10px !important;
}
</style>
