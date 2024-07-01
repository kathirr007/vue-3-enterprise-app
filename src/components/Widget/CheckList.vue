<script setup lang="ts">
import type { CheckListItem } from '@/types/dashboard.type';
import type { EntityStatus } from '@/types/status-entity.type';
import type { EntityType, Task, UpdateTask } from '@/types/tasks.type';
import type { User } from '@/types/teams.type';
import type { MetaObj } from '@/types/common.type';
import type { TagType } from '@/types/tags.type';

import { useMutation, useQuery, useQueryClient } from 'vue-query';
import router from '@/router';

const props = withDefaults(
  defineProps<{
    title: string;
    entityType?: EntityType;
    tasks: Task[];
    buttonTooltip: string;
    disableActions?: boolean;
    disabledTooltip?: string;
    loading?: boolean;
  }>(),
  {
    tasks: () => []
  }
);

const emit = defineEmits<{
  (e: 'add'): void;
  (e: 'task-details-close'): void;
  (
    e: 'listItem',
    value: boolean,
    item: CheckListItem,
    type: 'checkbox' | 'name'
  ): void;
}>();

const openActionDailog = ref<boolean>(false);

const { tasks } = toRefs(props);
const route = useRoute();
const { getUsers, getTimersList } = useCommonListQueries();
const { fullName, dateToHumanShort } = useVueFilters();
const actionKey = ref<string>('Delete');
const { initToast } = useToasts();
// const { data: users } = getUsers();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const clientId
  = route.name === 'admin-clients-id' ? ref(route.params.id as string) : ref('');
const { currentUser, isPortalUser } = useCurrentUserData();
const { isLarge } = useCommonBreakPoints();
const { handleTooltip } = useTooltip();
const { canDo } = usePermissions();

const slicedTask = computed(() => {
  return (
    tasks.value?.map((task: Task) => {
      return {
        name:
          route.name === 'index'
            ? metaFilter(task.meta as MetaObj[], 'title')
            + (task.client ? ` - ${task.client?.name}` : ' ')
            : metaFilter(task.meta as MetaObj[], 'title'),
        id: task.id,
        isChecked: task?.status?.status === 3,
        title: metaFilter(task.meta as MetaObj[], 'title'),
        type: task.type
      };
    }) || []
  );
});

const { metaFilter } = useUtilityFns();
const taskId = computed(() => {
  return selectedTask?.value?.id;
});
const selectedTask = ref<Task>();

const canMakeAPICall = computed(() => !isPortalUser.value);

const { isLoading: loadingTimerList, data: timerListData } = getTimersList(
  {},
  canMakeAPICall
);
const isSelectedTaskForCurrentUser = computed(
  () =>
    selectedTask.value?.assignees?.some(
      (assignee: User) => assignee.id === currentUser.value?.id
    )
);
const isActiveTimer = computed(() => timerListData.value?.isActiveTimer);
const isActiveTimerForSelectedTask = computed(
  () =>
    isActiveTimer.value
    && selectedTask.value?.id === timerListData.value?.activeTimer?.entity.id
);

const openAddTaskModal = ref(false);
const openDetailsTaskModal = ref(false);
const doneStatus = ref('');
const reopenStatus = ref('');
useQuery(
  'enttity-status-list',
  () => {
    return useStatusList(isPortalUser.value);
  },
  {
    onSuccess: (data) => {
      doneStatus.value = data.filter(
        (item: EntityStatus) => item.status === 3
      )[0]?.name;
      reopenStatus.value = data.filter(
        (item: EntityStatus) => item.status === 4
      )[0]?.name;
    }
  }
);

const {
  data: taskDetails,
  isLoading,
  isFetching
} = useQuery(
  ['task-details', taskId],
  async () => {
    if (!taskId.value)
      return;
    return useTask(
      taskId.value as string,
      props.entityType as EntityType,
      isPortalUser.value
    );
  },
  {
    onSuccess: (data) => {
      if (selectedTask.value) {
        openDetailsTaskModal.value = true;
      }
    }
  }
);
const queryClient = useQueryClient();

const { mutateAsync: updateTask } = useMutation(
  ({ id, payload }: { id: string; payload: Partial<UpdateTask> }) => {
    return useTaskUpdate({
      id,
      payload,
      entityType: payload.type as EntityType
    });
  },
  {
    onSuccess: (data: Task) => {
      handleSuccess(data);
      handleInvalidateDashboard();
    }
  }
);

function handleInvalidateDashboard() {
  emit('task-details-close');
  if (route.name === 'index') {
    queryClient.invalidateQueries('dashboard-home');
  }
  if (route.name === 'admin-clients-id') {
    // queryClient.invalidateQueries('get-comment-list');
    queryClient.invalidateQueries('dashboard-client');
    queryClient.invalidateQueries('audit-log-activity');
  }
}

const { mutateAsync: deleteTask } = useMutation(
  'deleteTask',
  async () => {
    return useEntityDelete(
      selectedTask.value?.id as string,
      selectedTask.value?.type as EntityType
    );
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Delete',
        severity: 'error',
        summary: 'Success',
        detail: 'Task Deleted Successfully'
      });
      openActionDailog.value = false;
      router.go(0);
    }
  }
);

function handleTaskUpdate(value: boolean,
  item: CheckListItem,
  name: 'checkbox' | 'name') {
  emit('listItem', value, item, name);
  if (name === 'checkbox') {
    const payload: Partial<UpdateTask> = {
      type: item.type,
      data: {
        type: item.type,
        title: item.title,
        entityStatus: value ? doneStatus.value : reopenStatus.value
      }
    };
    updateTask({ id: item.id, payload });
  }
  else {
    selectedTask.value = tasks.value?.find((task: Task) => task.id === item.id);
  }
}

function handleSuccess(value: Task) {
  if (value.status?.status === 3) {
    initToast({
      actionType: 'Update',
      summary: 'Task Update',
      detail: `Task <strong>
        ${metaFilter(value.meta as MetaObj[], 'title')}
      </strong> marked as Completed successfully.`
    });
  }
  else {
    initToast({
      actionType: 'Update',
      summary: 'Task Update',
      detail: `Task <strong>
        ${metaFilter(value.meta as MetaObj[], 'title')}
      </strong> re-opened successfully.`
    });
  }
}
function handleAction() {
  if (actionKey.value === 'Delete') {
    deleteTask();
  }
}
function handleClose() {
  openAddTaskModal.value = false;
  handleInvalidateDashboard();
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="box-shadow card p-3">
    <slot name="header">
      <div
        v-if="!isPortalUser"
        class="flex items-center justify-content-between align-items-center mb-2"
      >
        <h6 class="text-600 font-medium my-auto">
          {{ title }}
          <div
            v-if="isLoading || isFetching"
            class="text-sm flex align-items-center font-italic"
          >
            Loading Task... <i class="ml-2 pi pi-spin pi-spinner" />
          </div>
        </h6>
        <span
          v-if="canDo('tasks', 'create')"
          v-tooltip.top="
            handleTooltip(
              !disableActions,
              buttonTooltip,
              disabledTooltip as string,
            )
          "
        >
          <Button
            v-tooltip.top="buttonTooltip"
            :disabled="disableActions"
            icon="pi pi-plus"
            aria-label="add-record"
            class="p-button-sm p-button-rounded p-button-primary"
            @click="
              emit('add');
              openAddTaskModal = true;
            "
          />
        </span>
      </div>
      <div
        v-else
        class="flex items-center justify-content-between align-items-center mb-2"
      >
        <h4>
          Pending Tasks
          <div
            v-if="isLoading || isFetching"
            class="text-sm flex align-items-center font-italic mt-1"
          >
            Loading Task... <i class="ml-2 pi pi-spin pi-spinner" />
          </div>
        </h4>
      </div>
    </slot>
    <div
      class="card-container overflow-y-auto"
      :class="{ 'portal-card-container': isPortalUser }"
    >
      <CommonLoading v-if="loading" />
      <ul
        v-else-if="slicedTask.length > 0"
        class="mt-2 space-y-2.5 p-0 max-h-20rem "
        :class="{
          'to-do-tasks-list': !isPortalUser,
        }"
      >
        <li
          v-for="(item, index) in slicedTask"
          :key="index"
          class="flex items-center justify-content-between"
        >
          <div
            v-tooltip.top="`${disableActions ? disabledTooltip : ''}`"
            class="flex items-center space-x-2.5"
          >
            <Checkbox
              v-if="canDo('tasks', 'edit') && !isPortalUser"
              :disabled="disableActions"
              :model-value="item.isChecked"
              :binary="true"
              @input="handleTaskUpdate($event, item, 'checkbox')"
            />
            <span v-if="isPortalUser" class="text-base font-medium">{{ index + 1 }}.</span>
            <span
              class="cursor-pointer text-base font-medium"
              :class="[
                { 'line-through': item.isChecked },
                { 'opacity-50 pointer-events-none': disableActions },
              ]"
              @click="handleTaskUpdate(true, item, 'name')"
            >{{ item.name }}
            </span>
          </div>
        </li>
      </ul>
      <div v-else class="mt-2 p-2 w-full">
        <span v-if="!isPortalUser">No Tasks for Today</span><span v-else>No Pending To-Do Tasks</span>
      </div>
    </div>
  </div>

  <Dialog
    ref="dailogRef"
    v-model:visible="openDetailsTaskModal"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '95vw', height: '90%' }"
    content-class="border-round-bottom-md relative"
    class="dailog-custom"
    @hide="
      handleInvalidateDashboard();
      openDetailsTaskModal = false;
      selectedTask = undefined;
    "
  >
    <template #header>
      <div class="flex space-x-2.5 w-full">
        <!-- <div
          class="p-3 h-4rem w-4rem bg-primary border-circle flex justify-content-center align-items-center"
        >
          <i class="pi pi-check-square" style="font-size: 1.5rem"></i>
        </div> -->
        <div class="flex flex-column justify-content-center w-full">
          <div
            class="text-2xl font-medium flex justify-content-between align-items-end w-full"
          >
            <span :class="{ 'flex-1': !isLarge }">{{
              `${metaFilter(selectedTask?.meta as MetaObj[], 'title')}`
            }}</span>
            <CommonTimer
              v-if="isLarge && isActiveTimerForSelectedTask"
              class="mr-auto mt-2 ml-2"
              :timer-data="timerListData?.activeTimer"
              units
            />

            <Button
              v-if="!isLarge"
              v-tooltip.top="'Delete'"
              type="button"
              icon="pi pi-trash"
              class="text-sm p-button-rounded p-button-danger ml-4 delete-button-for-mobile"
              aria-label="Delete"
              style=" margin-top: 13px;margin-right: -13px;"
              @click="openActionDailog = true"
            />
          </div>
          <div
            v-if="
              taskDetails?.type !== 'SUPPORTTASK'
                || (taskDetails?.type === 'SUPPORTTASK' && taskDetails.tags?.length)
            "
            class="w-full inline-flex align-items-center md:w-6"
          >
            <span class="pr-2 border-gray-400 text-sm"> Tags: </span>
            <CommonTags
              :current-id="(taskDetails?.id as string)"
              :data="(taskDetails as Partial<Task>)"
              :tag-type="(taskDetails?.type as unknown as TagType)"
              :task-entity-type="entityType"
            />
          </div>
          <div v-if="selectedTask?.createdBy" class="text-sm pr-4">
            Created by:
            <strong> {{ fullName(selectedTask?.createdBy as User) }} - </strong>
            {{
              dateToHumanShort(selectedTask?.createdAt, 'D/MMM/YYYY HH:mm A')
            }}
          </div>
          <CommonTimer
            v-if="!isLarge && isActiveTimerForSelectedTask"
            class="mr-auto mt-2"
            :timer-data="timerListData?.activeTimer"
            units
          />
        </div>
      </div>
    </template>
    <TasksDetails
      v-if="openDetailsTaskModal"
      :task="(taskDetails as Task)"
      :entity-type="taskDetails?.type"
      :task-id="taskId"
      :is-active-timer-for-selected-task="isActiveTimerForSelectedTask"
      :is-selected-task-for-current-user="isSelectedTaskForCurrentUser"
      :is-active-timer="isActiveTimer"
      :client-id="taskDetails?.clientId"
      @close="openDetailsTaskModal = false"
    />
  </Dialog>

  <Dialog
    v-model:visible="openAddTaskModal"
    :modal="true"
    append-to="body"
    header="To-Do"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
  >
    <TasksCreateMyTask
      :client-id="clientId"
      entity-type="TASK"
      @close="handleClose"
    />
    <!-- <TasksMobileCreateUpdate
      v-else
      @close="
        openAddTaskModal = false;
        queryClient.invalidateQueries('dashboard-home');
      "
    /> -->
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="openActionDailog"
    :visible="openActionDailog"
    :title="`Confirm ${actionKey} Task`"
    @confirm="handleAction"
    @hide="openActionDailog = false"
  >
    Are you sure you want to {{ actionKey }} this task?
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss">
.to-do-tasks-list {
  height: calc(17rem - 30px) !important;
}
</style>
