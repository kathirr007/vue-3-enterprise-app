<script setup lang="ts">
import type { EntityType, Task, UpdateTaskPayload } from '@/types/tasks.type';
import { useScroll } from '@vueuse/core';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { MetaObj } from '@/types/common.type';
import type { User } from '@/types/teams.type';
import type { OperationType } from '@/types/permissions.type';
import { operations } from '@/types/permissions.type';

const props = defineProps<{
  entityType?: EntityType;
  isActiveTimer?: boolean;
  isActiveTimerForSelectedTask?: boolean;
  task?: Task;
  taskId?: string;
  isSelectedTaskForCurrentUser?: boolean;
  isSelectedTaskCompleted?: boolean;
  projectId?: string;
  clientId?: string;
}>();

const emit = defineEmits<{
  (e: 'close', data?: Task): void;
  (e: 'task-deleted'): void;
  (e: 'task-delete-intiated', data?: Task): void;
}>();

const { entityType: currentEntityType } = toRefs(props);
const { isLarge } = useCommonBreakPoints();
const { initToast } = useToasts();
const el = ref<HTMLElement | null>(null);
const { y } = useScroll(el as unknown as HTMLElement, { behavior: 'smooth' });
const { defaultBreakpoints } = useCommonBreakPoints();
const { isPortalUser } = useCurrentUserData();
const queryClient = useQueryClient();
const clickedTab = ref();
const { metaFilter } = useUtilityFns();
const router = useRouter();

const { canDo, canDoAll, canDoSome, canAccessAllMenu, featureSubscribed }
  = usePermissions();

const activeTab = ref<string>('Details');
const refreshValue = ref<boolean>(false);
const openActionDailog = ref<boolean>(false);
const subscribeDialog = ref(false);
const detialsRef = ref();
const commentsRef = ref();
const descriptionRef = ref();
const attachmentRef = ref();
const conversationRef = ref();
const selectedTask = ref<Task>();
// const task = ref<Task>();
const actionKey = ref<string>('Delete');
const startTimerDialog = ref(false);

function getTabs() {
  const detailsTabs = [
    {
      name: 'Details',
      scrollTo: Math.ceil(detialsRef.value?.offsetTop) - 142
    },
    {
      name: 'Description',
      scrollTo:
        Math.ceil(
          descriptionRef.value?.taskCreateUpdateRef?.schemaForm.querySelector(
            'label[for="description"]'
          ).offsetTop
        ) - 142
    },
    {
      name: 'Comments',
      scrollTo: Math.ceil(commentsRef.value?.offsetTop) - 142
    },
    {
      name: 'Attachments',
      scrollTo: Math.ceil(attachmentRef.value?.offsetTop) - 142
    },
    {
      name: 'Conversation',
      scrollTo: Math.ceil(conversationRef.value?.offsetTop) - 142
    }
  ];
  return detailsTabs;
}

function canDoTaskAction(action: OperationType) {
  switch (currentEntityType?.value) {
    case 'TASK':
      return canDo('tasks', action);
    case 'SUPPORTTASK':
      return canDo('support_tasks', action);
    default:
      return true;
  }
}

const tabs = ref(getTabs());

watch(
  [detialsRef, descriptionRef, commentsRef, attachmentRef, conversationRef],
  () => {
    tabs.value = getTabs();
  },
  { deep: true }
);

const isSupportTask = computed(() => props.task?.type === 'SUPPORTTASK');
const icons = computed(() => {
  const icons = [
    {
      icon: 'pi-clone',
      tooltipText: 'Clone'
    },
    {
      icon: 'pi-trash',
      tooltipText: 'Delete'
    },
    {
      icon: 'pi-custom pi-stopwatch w-1.5rem h-1.5rem',
      tooltipText: 'Start Timer'
    }
  ];
  return icons
    .filter(
      icon =>
        !(
          (icon.icon === 'pi-clone' || icon.icon.includes('pi-stopwatch'))
          && (!canDoTaskAction('create')
          || isSupportTask.value
          || (taskDetails.value as Task)?.status?.status === 3)
        )
    )
    .filter(
      icon => !(icon.icon === 'pi-trash' && !canDoTaskAction('delete'))
    );
});

const canStartTimer = computed(() => {
  return (
    (canAccessAllMenu.value || props.isSelectedTaskForCurrentUser)
    && !props.isActiveTimer
    && !props.isSelectedTaskCompleted
  );
});

const {
  data: taskDetails,
  isLoading: taskDetailsIsLoading,
  isFetching
} = useQuery(
  ['task-details', props.taskId],
  async () =>
    await useTask(
      props.taskId as string,
      props.entityType as EntityType,
      isPortalUser.value
    ),
  {
    enabled: !!props.taskId
  }
);

const { mutateAsync: createTask } = useMutation(
  'createTask',
  async (payload: { data: UpdateTaskPayload }) => {
    return useTaskCreate(
      payload,
      (payload.data.type as EntityType) || (props.entityType as EntityType)
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: 'Task has been cloned successfully'
      });
      openActionDailog.value = false;
    }
  }
);
const { mutateAsync: deleteTask } = useMutation(
  'deleteTask',
  async () => {
    return useEntityDelete(
      props.task?.id as string,
      props.entityType as EntityType,
      isPortalUser.value
    );
  },
  {
    onSuccess: async () => {
      emit('task-deleted');
      initToast({
        actionType: 'Delete',
        severity: 'error',
        summary: 'Success',
        detail: 'Task Deleted Successfully'
      });
      openActionDailog.value = false;

      await nextTick();
    }
  }
);
watch(
  () => y.value,
  (val) => {
    tabs.value = getTabs();
    const clickedTabData = tabs.value.find(
      tab => tab.name === clickedTab.value
    );
    if (!clickedTab.value) {
      const descScrollTo = tabs.value[1].scrollTo;
      const commentsScrollTo = tabs.value[2].scrollTo;
      const attachmentScrollTo = tabs.value[3].scrollTo;
      const conversationScrollTo = tabs.value[4].scrollTo;
      if (val < descScrollTo) {
        activeTab.value = 'Details';
      }
      else if (val >= descScrollTo && val < commentsScrollTo) {
        activeTab.value = 'Description';
      }
      else if (val >= commentsScrollTo && val < attachmentScrollTo) {
        activeTab.value = 'Comments';
      }
      else if (val >= attachmentScrollTo && val < conversationScrollTo) {
        activeTab.value = 'Attachments';
      }
      else if (val >= conversationScrollTo) {
        activeTab.value = 'Conversation';
      }
    }
    else if (
      clickedTab.value
      && y.value < (clickedTabData?.scrollTo as number)
    ) {
      activeTab.value = clickedTab.value;
    }
    else clickedTab.value = undefined;
  }
);

/* const GetTaskDetails = (data: Task) => {
  task.value = data;
}; */
function handleSideIconClick(icon: string, data: Task | any) {
  if (icon === 'pi-clone') {
    actionKey.value = 'Clone';
    openActionDailog.value = true;
  }
  if (icon === 'pi-trash') {
    actionKey.value = 'Delete';
    selectedTask.value = data;
    openActionDailog.value = true;
  }
  if (icon.includes('pi-stopwatch')) {
    if (featureSubscribed('work', 'timer') === false) {
      subscribeDialog.value = true;
      return;
    }
    startTimerDialog.value = true;
  }
}
async function handleAction() {
  if (actionKey.value === 'Clone') {
    const payload: UpdateTaskPayload = {};
    props.task?.meta?.forEach((meta: MetaObj) => {
      if (meta.metaKey === 'description') {
        payload[meta.metaKey] = JSON.parse(meta.metaValue);
      }
      else {
        payload[meta.metaKey] = meta.metaValue;
      }
    });
    if (props.task?.client) {
      payload.clientId = props.task.client?.id;
    }
    if (props.task?.project) {
      payload.projectId = props.task?.project?.id;
    }
    if (props.task?.assignees) {
      payload.assignees = [
        ...props.task.assignees.map((user: User) => user.id)
      ] as unknown as string[];
    }
    if (props.task?.watchers) {
      payload.watchers = [
        ...props.task.watchers.map((user: User) => user.id)
      ] as unknown as string[];
    }
    if (props.task?.priority) {
      payload.entityPriority = props.task.priority?.name;
    }
    if (props.task?.status)
      payload.entityStatus = props.task.status?.name;
    payload.type = props.task?.type;
    if (props.task?.title) {
      payload.title = `Copy of ${payload.title}`;
    }
    if (props.task?.estimatedTime) {
      payload.estimatedTime = props.task.estimatedTime;
    }
    if (props.task?.dueDate) {
      payload.dueDate = props.task.dueDate;
    }
    if (props.task?.startDate) {
      payload.startDate = props.task.startDate;
    }
    createTask({ data: payload });
  }
  if (actionKey.value === 'Delete') {
    emit('task-delete-intiated');
    await deleteTask();
    emit('close');
  }
}

function scrollToTab(name: string, scrollTo: number) {
  y.value = scrollTo;
  activeTab.value = name;
  clickedTab.value = name;
}

function handleClose(data: Task) {
  emit('close', data);
}
</script>

<template>
  <div class="w-full flex h-full pb-6">
    <div class="lg:border-right-1 border-200 m-0 h-full w-full">
      <ul
        v-scroll-spy-active
        v-scroll-spy-link
        class="hidden lg:flex list-none p-0 border-bottom-1 border-200 sticky top-0 m-0 bg-white"
        style="z-index: 9999;"
      >
        <li
          v-for="({ name, scrollTo }, index) in tabs"
          :key="index"
          class="mr-5 cursor-pointer"
          :class="{
            'border-bottom-2 border-primary pb-3 text-primary':
              activeTab === name,
            'text-400': activeTab !== name,
          }"
          @click="scrollToTab(name, scrollTo)"
        >
          {{ name }}
        </li>
      </ul>
      <div
        ref="el"
        class="flex-1 h-6 overflow-y-scroll overflow-x-hidden md:pr-3"
        :style="isLarge ? { height: '95%' } : ''"
      >
        <div v-if="isLarge" ref="detialsRef">
          <TasksCreateUpdate
            ref="descriptionRef"
            :task-id="props.taskId || props.task?.id"
            :refresh="refreshValue"
            :project="!!projectId"
            :project-id="projectId"
            :client-id="clientId"
            :is-support-task="taskDetails?.type === 'SUPPORTTASK'"
            :entity-type="taskDetails?.type"
            is-task-details
            @close="handleClose"
          />
        </div>
        <TasksMobileCreateUpdate
          v-else
          :task-id="props.taskId || props.task?.id"
          :task="props.task"
          :is-support-task="taskDetails?.type === 'SUPPORTTASK'"
          :entity-type="taskDetails?.type"
          @close="handleClose"
        />

        <div ref="commentsRef">
          <Divider />
          <FormTitle
            title="Comments"
            remove-underline
            remove-divider
            class="my-4"
          />
          <CommonComments
            v-if="canDoSome('comments', Array.from(operations)) || isPortalUser"
            :task-id="props.taskId || props.task?.id || ''"
          />
          <div v-else class="card shadow-3">
            <p class="text-center font-medium text-xl">
              You don't have access of the Comments.
            </p>
          </div>
        </div>
        <div ref="attachmentRef">
          <Divider />
          <FormTitle
            title="Attachments"
            remove-underline
            remove-divider
            class="mb-2 mt-4"
          />
          <TasksAttachments
            :task-id="props.taskId || props.task?.id || ''"
            :entity-type="props.entityType || props.task?.entityType"
            :attachments="taskDetails?.attachments || []"
            :task-details-is-loading="taskDetailsIsLoading || isFetching"
            :client-id="taskDetails?.clientId"
          />
        </div>
        <div v-if="isLarge" ref="conversationRef" class="mb-4">
          <Divider />
          <FormTitle
            title="Conversation"
            remove-underline
            remove-divider
            class="mb-2 mt-4"
          />
          <div class="border-1 border-gray-100 rounded-2xl">
            <MailsMessagesPreview
              v-if="taskDetails?.conversations?.length"
              :messages="taskDetails?.conversations || []"
              :client-id="taskDetails?.clientId"
              class="max-h-26rem"
            />
            <div v-else class="text-center text-xl p-4">
              No conversation found
            </div>
          </div>
        </div>
      </div>
    </div>

    <ul
      v-if="!isPortalUser"
      class="hidden lg:block sticky left-0 top-0 m-0 list-none p-1 h-full px-2"
    >
      <li
        v-for="({ icon, tooltipText }, index) in icons"
        :key="index"
        class="mb-3 cursor-pointer"
      >
        <i
          v-tooltip.left="tooltipText"
          class="pi"
          :class="[
            icon,
            [
              canStartTimer && icon.includes('pi-stopwatch')
                ? 'pointer-events-auto opacity-100'
                : '',
            ],
            {
              'pointer-events-none opacity-50':
                !canStartTimer && icon.includes('pi-stopwatch'),
            },
          ]"
          style="font-size: 1.3rem;"
          @click="handleSideIconClick(icon, taskDetails)"
        />
      </li>
    </ul>
    <ul
      v-else-if="taskDetails?.type === 'SUPPORTTASK'"
      class="hidden lg:block sticky left-0 top-0 m-0 list-none p-1 h-full px-2"
    >
      <li class="mb-3 cursor-pointer">
        <i
          v-tooltip.left="'Delete'"
          class="pi pi-trash"
          style="font-size: 1.3rem;"
          @click="handleSideIconClick('pi-trash', taskDetails)"
        />
      </li>
    </ul>
  </div>
  <CommonConfirmRemoveDialog
    v-if="openActionDailog"
    :visible="openActionDailog"
    :title="`Confirm ${actionKey} Task`"
    @confirm="handleAction"
    @hide="openActionDailog = false"
  >
    <p>
      Are you sure you want to
      {{ actionKey }}
      <strong>
        {{ metaFilter(task?.meta as MetaObj[], 'title') || 'record' }}</strong>
    </p>
  </CommonConfirmRemoveDialog>
  <Dialog
    v-model:visible="startTimerDialog"
    :modal="true"
    append-to="body"
    header="Start Timer"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="startTimerDialog = false"
  >
    <TimerStart
      :task-id-value="task?.id"
      :project="task?.project?.id"
      :client="task?.client?.id"
      @modal-close="startTimerDialog = false"
    />
  </Dialog>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="timer"
    @hide="subscribeDialog = false"
  />
</template>

<style scoped lang="scss">
.pi-custom::before {
  background-color: #69707a;
}

:deep(*) {
  .buttons-wrapper {
    width: calc(100% - 50px) !important;
  }
}
</style>
