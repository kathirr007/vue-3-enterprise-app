<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { EntityStatus } from '@/types/status-entity.type';
import type { EntityType, Task, UpdateTask } from '@/types/tasks.type';
import type { Tag, TagType } from '@/types/tags.type';
import type { MetaObj } from '@/types/common.type';
import Dialog from 'primevue/dialog';
import type { FullNameObj, User } from '@/types/teams.type';
import type { DataTableRowClickEvent } from 'primevue/datatable';
import DataTable from 'primevue/datatable';
import type { Attachment } from '@/types/attachment.type';
import { useRouteQuery } from '@vueuse/router';
import type { OperationType } from '@/types/permissions.type';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';

const props = withDefaults(
  defineProps<{
    userId?: string;
    clientId?: string;
    // status?: 'OPEN' | 'CLOSED';
    projectId?: string;
    isProjectCompleted?: boolean;
    tasks?: Task[];
    entityType?: EntityType;
    isPortal?: boolean;
    hideFilters?: boolean;
    hideStatusFilters?: boolean;
    disabledFilters?: string[];
    filterType?: string;
  }>(),
  {
    disabledFilters: () => [],
    hideFilters: false,
    hideStatusFilters: false,
    filterType: 'Tasks'
  }
);
const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'tasksSelected', data: Task[]): void;
  (e: 'taskStatusTitle', data: string): void;
}>();
dayjs.extend(minMax);
const notifiedTaskId = useRouteQuery<string>('notificationId');
const activeIndex = useRouteQuery<string>('activeIndex');

const disabledTooltip = inject('disabledTooltip', '');
const canDoActions = inject('canDoActions', true);
const router = useRouter();
const route = useRoute();

const { initToast } = useToasts();
const { getTimersList } = useCommonListQueries();
const { fullName, dateToHumanShort, initials } = useVueFilters();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { metaFilter, sortCompare } = useUtilityFns();
const queryClient = useQueryClient();
const { currentUser, isPortalUser } = useCurrentUserData();
const { getAttachmentUrl, downloadFileAs } = useAttachments();
const { canAccessAllMenu, featureSubscribed, canDo } = usePermissions();
const { filters, searchText: staticSearchText } = useDatatableFilters();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableRecords,
  tableAttrs,
  queryKeys,
  filtersRef,
  queryFilters,
  querySortBy,
  allFilters
} = useDataTableUtils();
const { filterObjByKeys, isFalsy } = useUtilityFns();

const currentSelectedbtn = ref<string>('To Do');
const selectedTaskClientId = ref<string>('');
const selectedTaskProjectId = ref<string>('');
const doneStatus = ref('');
const reopenStatus = ref('');
const todoStatusId = ref('');
const tasksList = ref<Task[]>();
const selectedTask = ref<Task>();
const dailogRef = ref<InstanceType<typeof Dialog> | null>(null);
const datatableRef = ref<InstanceType<typeof DataTable> | null>(null);
const openTaskEditModal = ref(false);
const startTimerDialog = ref(false);
const tasksBulkActionDialog = ref(false);
const subscribeDialog = ref(false);
const formKey = ref(0);
const selectedAttachments = ref<Record<string, any>[]>([]);
const attachmentsListDialog = ref(false);
const selectedTasks = ref<Task[] | null>(null);
const isSelectedTasks = ref<Task[]>([]);
const selectedTags = ref<Tag[]>();
const selectedStatus = ref<string>();
const isStatus = ref<string>();
const { entityType: currentEntityType } = toRefs(props);
// const statusListOptions = ref<EntityStatus[]>();
const isFiltersVisible = ref(false);
const canCallTaskDetails = ref(false);

defineExpose({
  props,
  selectedTask,
  selectedTasks,
  tasksBulkActionDialog
});

const keysToExclude = ref(['AssignedBy', 'Type']);

if (!props.hideStatusFilters) {
  keysToExclude.value.push('Status');
}
if (route.name === 'admin-tasks' || route.name === 'admin-teams-id') {
  keysToExclude.value.push('Assigned To');
}

if (isPortalUser.value || props.clientId) {
  keysToExclude.value.push('Client');
}

const filtersApplied = computed(() => {
  return queryFilters.value
    ? filterObjByKeys(
      useDecodeFilterData(queryFilters.value),
      keysToExclude.value,
      true
    )
    : {};
});

const doesFiltersHasValues = computed(() => {
  return !!Object.values(filtersApplied.value as any)
    .map((item: any) => item.value)
    .filter(value => !isFalsy(value)).length;
});

const canMakeAPICall = computed(() => !isPortalUser.value);
const { isLoading: loadingTimerList, data: timerListData } = getTimersList(
  {},
  canMakeAPICall
);
const isSelectedTaskForCurrentUser = computed(() =>
  Array.isArray(selectedTask.value?.assignees)
    ? selectedTask.value?.assignees?.some(
      (assignee: User) => assignee.id === currentUser.value?.id
    )
    : false
);
const isSelectedTaskCompleted = computed(
  () => selectedTask.value?.status?.status === 3
);
const isActiveTimer = computed(() => timerListData.value?.isActiveTimer);
const isActiveTimerForSelectedTask = computed(
  () =>
    isActiveTimer.value
    && selectedTask.value?.id === timerListData.value?.activeTimer?.entity.id
);

const activeStatus = computed(() => {
  return currentSelectedbtn.value;
});
const tasksInSelectedStatus = computed(() => {
  return activeStatus.value !== 'Closed'
    ? selectedTasks.value?.filter((task: Task) => task.status?.status !== 3)
    : selectedTasks.value?.filter((task: Task) => task.status?.status === 3);
});
const bulkActionLabel = computed(() => {
  if (
    isSelectedTasks.value.length === 0
    || isSelectedTasks.value.length === 1
  ) {
    return `Action (${isSelectedTasks.value.length})`;
  }
  else {
    return `Action (${isSelectedTasks.value.length})`;
  }
});

const canStartTimer = computed(() => {
  if (isActiveTimer.value)
    return 'pointer-events-none opacity-50';
  if (canAccessAllMenu.value) {
    return 'pointer-events-auto opacity-100';
  }
  else if (
    !isSelectedTaskForCurrentUser.value
    || isSelectedTaskCompleted.value
    || !canDoActions
  ) {
    return 'pointer-events-none opacity-50';
  }
});

const disabledTimerAndEdit = computed(() => {
  if (isSelectedTasks.value)
    return !!isSelectedTasks.value.length;
});
function toggleFilters(reset: boolean) {
  if (reset && filtersRef.value) {
    filtersRef.value.resetFilters();
  }
  else {
    isFiltersVisible.value = !isFiltersVisible.value;
  }
}

function handleSuccess(value: Task) {
  if (value.status?.status === 3) {
    refetchTimerOnTaskUpdate(value?.id);
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
      </strong> re-opened successfully.${
        props.hideStatusFilters
          ? ''
          : ' It will be available in <strong>To Do</strong> list of tasks.'
      }`
    });
  }

  queryClient.invalidateQueries('tasks-list');
}

function handleSelectedTags(value: Task) {
  if (value?.tags) {
    selectedTags.value = value?.tags;
  }
}
const { mutateAsync: updateTask, isLoading: updatingTask } = useMutation(
  ({ id, payload }: { id: string; payload: Partial<UpdateTask> }) => {
    return useTaskUpdate({
      id,
      payload,
      entityType: payload.type as EntityType,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: (data: Task) => {
      emit('success');
      handleSuccess(data);
    }
  }
);

const { data: statusList, isLoading: statusLoading } = useQuery(
  ['status-list', currentEntityType],
  () => {
    return useEntityStatusList(
      currentEntityType?.value as EntityType,
      isPortalUser.value
    );
  }
);

const statusListOptions = computed<EntityStatus[]>(() => {
  if (statusList.value) {
    const sortedStatusList = [...(statusList.value as EntityStatus[])].sort(
      sortCompare({ compareProp: 'status' })
    );
    return props.projectId && props.isProjectCompleted
      ? sortedStatusList.filter((status: EntityStatus) => status.status === 3)
      : sortedStatusList;
  }
  else {
    return [];
  }
});

const initialStatusFilters = computed(() => {
  if (statusListOptions.value !== undefined && !props.hideStatusFilters) {
    return statusListOptions?.value?.filter((val: EntityStatus) =>
      props.isProjectCompleted ? val?.status === 3 : val?.status === 1
    )[0]?.id;
  }
});

const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  if (route.name === 'admin-tasks') {
    applyFilter('AssignedBy', undefined);
    applyFilter('Assigned To', currentUser.value ? [currentUser.value?.id] : []);
  }
  if (route.name === 'admin-tasks-assignments') {
    applyFilter('Assigned To', undefined);
    applyFilter('AssignedBy', currentUser.value ? [currentUser.value?.id] : []);
  }
  applyFilter(
    'Type',
    currentEntityType?.value ? [currentEntityType?.value] : ['TASK']
  );
  applyFilter('Client', props.clientId ? [props.clientId] : []);
  applyFilter('Project Name', props.projectId ? [props.projectId] : []);
  if (props.userId) {
    applyFilter('Assigned To', [props.userId]);
  }

  applyFilter(
    'Status',
    selectedStatus.value ? [selectedStatus.value] : undefined
  );
  const intialFiltersString = useEncodeFilterData(filterData);
  return intialFiltersString;
});

useQuery(
  ['task-details'],
  async () =>
    useTask(
      notifiedTaskId.value as string,
      currentEntityType?.value as EntityType,
      isPortalUser.value
    ),
  {
    enabled: !!notifiedTaskId.value,
    onSuccess: async (data) => {
      if (data) {
        selectedTask.value = data as unknown as Task;
        await nextTick(() => {
          useTimeoutFn(() => {
            handleRowDblClick();
          }, 500);
        });
      }
    }
  }
);

const { isFetching: loadingTasks, data: tasks } = useQuery(
  [
    'tasks-list',
    initialFilters,
    currentEntityType,
    selectedStatus,
    initialStatusFilters,
    ...queryKeys
  ],
  async () => {
    if (!props.projectId) {
      return useTasksListV2({
        // status: props.status,
        entityType: currentEntityType?.value as EntityType,
        isPortal: isPortalUser.value,
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value ? queryFilters.value : initialFilters.value,
        sortBy: querySortBy.value
      });
    }
    else if (props.projectId) {
      const project = await useProjectDetails(props.projectId as string);
      if (selectedStatus.value) {
        return project.entities.filter(
          (t: Task) => t.status?.id === selectedStatus.value
        );
      }
      return project?.entities;
    }
    else {
      const tasks = await useUserSingleTasksV2({
        id: props.userId as string,
        status: currentSelectedbtn.value as any,
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value ? queryFilters.value : initialFilters.value,
        sortBy: querySortBy.value
      });
      return tasks;
    }
  },
  {
    onSuccess: (data: any) => {
      const modifyTaskList = (task: Task) => ({
        ...task,
        title: metaFilter(task.meta as MetaObj[], 'title')
      });
      tableRecords.value
        = data.total !== undefined ? data : { results: data, total: data.length };
      tasksList.value = data.results
        ? data.results.map(modifyTaskList)
        : data.map(modifyTaskList);
      if (
        !notifiedTaskId.value
        && tasksList.value
        && tasksList.value.length > 0
        && selectedTask.value === undefined
      ) {
        selectedTask.value = tasksList.value[0];
        canCallTaskDetails.value = true;
      }
    }
  }
);

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
      const todoStatus = data.filter(
        (item: EntityStatus) => item.status === 1
      )[0];
      reopenStatus.value = todoStatus?.name;
      todoStatusId.value = todoStatus?.id;
    }
  }
);

async function updateTaskStatus(val: UpdateTask | any) {
  selectedTask.value = val;
  const selectedTaskIndex = tasksInSelectedStatus.value?.findIndex(
    (task: Task) => task.id === val.id
  );
  const payload: Partial<UpdateTask> = {
    type: val.type,
    data: {
      type: val.type,
      title: metaFilter(val?.meta, 'title'),
      entityStatus:
        currentSelectedbtn.value !== 'Closed' && val.status.status !== 3
          ? doneStatus.value
          : reopenStatus.value
    }
  };

  await updateTask({ id: val.id, payload });
  tasksInSelectedStatus.value?.splice(selectedTaskIndex as number, 1);
  /* if (currentSelectedbtn.value === 'Closed') {
    selectedStatus.value = todoStatusId.value;
  } */
  queryClient.invalidateQueries('status-list');
  queryClient.invalidateQueries('tasks-list');
}

function updateRowClass(data: Task) {
  return data.id === selectedTask.value?.id
    ? 'bg-blue-100 cursor-pointer'
    : 'cursor-pointer';
}

function handleRowClick(e: DataTableRowClickEvent) {
  selectedTask.value = e.data;
  canCallTaskDetails.value = true;
}

function canDoTaskAction(action: OperationType) {
  switch (currentEntityType?.value) {
    case 'TASK':
      return canDo('tasks', action) || isPortalUser.value;
    case 'SUPPORTTASK':
      return canDo('support_tasks', action) || isPortalUser.value;
    default:
      return true;
  }
}

async function handleRowDblClick() {
  await nextTick();
  if (
    isSelectedTasks.value
      .map(task => task.id)
      .includes(selectedTask.value?.id as string)
  )
    return;
  if (
    (selectedTask.value?.isActive && !selectedTask.value?.isActive)
    || !canDoTaskAction('single')
  )
    return;
  useTimeoutFn(() => {
    openTaskEditModal.value = true;
  }, 500);
}
function taskBulkAction() {
  (selectedTasks.value as Task[])?.map((task: Task) => {
    return task.id;
  });
}

function refetchTimerOnTaskUpdate(task: string | string[] | undefined) {
  if (task && isActiveTimer.value) {
    if (Array.isArray(task)) {
      if (
        task.includes(timerListData.value?.activeTimer?.entity?.id as string)
      ) {
        queryClient.invalidateQueries('timers-list');
      }
    }
    else if (task === timerListData.value?.activeTimer?.entity?.id) {
      queryClient.invalidateQueries('timers-list');
    }
  }
}

function handleBulkActionSuccess() {
  refetchTimerOnTaskUpdate(isSelectedTasks.value?.map(task => task.id));
  isSelectedTasks.value = [];
}

const dateValidationForBulkAction = computed(() => {
  const dueDatesArr = isSelectedTasks.value
    ?.map(task => dayjs(task.dueDate as string))
    .filter(e => e);
  const startDatesArr = isSelectedTasks.value
    ?.map(task => dayjs(task.startDate as string))
    .filter(e => e);
  const minDueDate = dueDatesArr.length
    ? dayjs.min(dueDatesArr)?.toDate()
    : undefined;
  const maxStartDate = startDatesArr.length
    ? dayjs.max(dayjs(dayjs.max(startDatesArr)), dayjs())?.toDate()
    : dayjs().toDate();
  return {
    minDueDate,
    maxStartDate
  };
});
function handleDetailClose(data?: Event | Task) {
  openTaskEditModal.value = false;
  if (data && (data as Task).id) {
    refetchTimerOnTaskUpdate((data as Task).id);
  }
  if (!isFalsy(notifiedTaskId.value)) {
    const { notificationId, ...queryParams } = route.query;
    router.push({
      query: {
        ...queryParams
      }
    });
  }
  else {
    queryClient.invalidateQueries('tasks-list');
  }
  emit('success');
}
function handleStartTimer(val: Task) {
  if (featureSubscribed('work', 'timer') === false) {
    subscribeDialog.value = true;
    return;
  }
  startTimerDialog.value = true;
  selectedTaskClientId.value = val.client?.id as string;
  selectedTaskProjectId.value = val.project?.id as string;
}

function handleStatus(status: EntityStatus) {
  if (status.id === selectedStatus.value)
    return;
  if (props.projectId) {
    selectedStatus.value = status.id;
    currentSelectedbtn.value = status.name;
    emit('taskStatusTitle', status.name as string);
    return;
  }
  selectedStatus.value = status.id;
  applyFilter('Status', [status.id]);
  if (route.name === 'admin-tasks') {
    applyFilter('AssignedBy', undefined);
    applyFilter('Assigned To', currentUser.value ? [currentUser.value?.id] : []);
  }
  if (route.name === 'admin-tasks-assignments') {
    applyFilter('Assigned To', undefined);
    applyFilter('AssignedBy', currentUser.value ? [currentUser.value?.id] : []);
  }
  currentSelectedbtn.value = status.name;
  const preparedFilters = useEncodeFilterData(filterData);
  const queryParams: any = {
    ...route.query,
    activeIndex: activeIndex.value ? activeIndex.value : undefined
  };
  if (props.projectId) {
    queryParams.entityStatusId = status.id;
  }
  else {
    queryParams.filters = preparedFilters;
  }
  router.push({
    query: {
      ...queryParams
    }
  });
}

watchEffect(async () => {
  if (doesFiltersHasValues.value) {
    isFiltersVisible.value = true;
  }
  if (
    allFilters.value
    && allFilters.value.Status.value
    && allFilters.value.Status.value[0]
  ) {
    selectedStatus.value = allFilters.value.Status.value[0];
  }
  if (!notifiedTaskId.value && tasksList.value && !openTaskEditModal.value) {
    if (selectedTask.value !== undefined) {
      const selectedTaskIndex = tasksList.value.findIndex(
        task => task.id === selectedTask.value?.id
      );
      if (selectedTaskIndex !== -1) {
        selectedTask.value = tasksList.value[selectedTaskIndex];
      }
      else {
        selectedTask.value = tasksList.value[0];
      }
      formKey.value++;
    }
    else {
      selectedTask.value = tasksList.value[0];
      formKey.value++;
    }
  }
  if (selectedTasks.value) {
    emit('tasksSelected', selectedTasks.value);
  }
  if (initialStatusFilters.value) {
    if (allFilters.value.Status.value && allFilters.value.Status.value[0]) {
      selectedStatus.value = allFilters.value.Status.value[0];
    }
    else {
      if ((props.projectId as string) && !selectedStatus.value) {
        selectedStatus.value = initialStatusFilters.value;
      }
      else {
        if (!selectedStatus.value) {
          selectedStatus.value = initialStatusFilters.value;
        }
      }
    }
  }

  if (statusListOptions.value && props.isProjectCompleted) {
    selectedStatus.value = initialStatusFilters.value;
  }

  if (selectedStatus.value) {
    const foundSelectedStatus = statusListOptions.value?.find(
      val => val.id === selectedStatus.value
    );
    currentSelectedbtn.value = foundSelectedStatus?.name as string;
    emit('taskStatusTitle', foundSelectedStatus?.name as string);
  }
});
</script>

<template>
  <div v-if="!hideStatusFilters" class="flex mb-3">
    <div class="flex-1 flex gap-3">
      <div v-for="status in statusListOptions" :key="status.id" class="flex">
        <input
          :id="status.id"
          v-model="selectedStatus"
          type="radio"
          :value="status.id"
          name="selectedStatus"
          class="hidden"
          @click="handleStatus(status)"
        >
        <label
          class="inline-block p-button p-component p-button-secondary p-button-outlined rounded-md select-status-btn"
          tabindex="0"
          :class="{ active: status.id === selectedStatus }"
          :for="status.id"
        >{{ status.name }}</label>
      </div>
    </div>
  </div>
  <div class="flex md:space-x-3.5 flex-column md:flex-row">
    <DataTable
      v-bind="{ ...tableAttrs, lazy: !projectId }"
      ref="datatableRef"
      v-model:filters="filters"
      v-model:selection="isSelectedTasks"
      data-key="id"
      :value="tasksList"
      :total-records="tableRecords?.total"
      :loading="loadingTasks"
      responsive-layout="scroll"
      breakpoint="768px"
      :global-filter-fields="['title']"
      filter-display="menu"
      class="p-datatable-customers flex-1"
      :row-class="updateRowClass"
      sort-mode="single"
      @row-dblclick="handleRowDblClick"
      @row-click="handleRowClick"
      @page="!projectId && handlePageOrLimitChange($event)"
      @sort="!projectId && handleSortChange($event)"
    >
      <template #empty>
        <div class="text-center">
          No tasks found.
        </div>
      </template>
      <template #header>
        <div class="flex justify-content-between">
          <div v-if="projectId" class="p-input-icon-left mr-auto">
            <i class="pi pi-search" />
            <InputText
              v-model="staticSearchText"
              aria-label="Search List"
              :placeholder="`Search ${
                entityType === 'SUPPORTTASK' ? 'Tickets' : 'Tasks'
              }`"
              type="search"
            />
          </div>
          <CommonListSearchInput
            v-else
            v-bind="{
              listProps: {
                ...props,
                statusId: selectedStatus ? selectedStatus : undefined,
              },

              placeholder: `Search ${
                entityType === 'SUPPORTTASK' ? 'Tickets' : 'Tasks'
              }`,
            }"
          />
          <div>
            <TasksBulkAction
              v-if="isSelectedTasks && isSelectedTasks.length > 0"
              :label="bulkActionLabel"
              :tasks="isSelectedTasks"
              :entity-type="entityType"
              :due-date="dateValidationForBulkAction.minDueDate"
              :start-date="dateValidationForBulkAction.maxStartDate"
              @success="handleBulkActionSuccess"
            />
            <Button
              v-if="!hideFilters"
              type="button"
              :icon="
                doesFiltersHasValues ? 'pi pi-filter-slash' : 'pi pi-filter'
              "
              class="p-button-icon-only p-button-rounded"
              :class="[{ 'p-button-danger': doesFiltersHasValues }]"
              @click="toggleFilters(!!doesFiltersHasValues)"
            />
            <a
              :href="
                entityType === 'SUPPORTTASK'
                  ? 'https://brightreturn.com/kb/email-inbox-management/'
                  : 'https://brightreturn.com/kb/tax-workflow-management-software'
              "
              target="_blank"
            >
              <Button
                v-if="!projectId"
                v-tooltip.top="'Need Help'"
                type="button"
                icon="pi pi-question-circle text-lg"
                class="p-button-icon-only p-button-rounded ml-2"
              />
            </a>
          </div>
        </div>
        <div v-if="isFiltersVisible && !hideFilters" class="my-2">
          <TasksFilter
            ref="filtersRef"
            :filters="queryFilters"
            :entity-type="currentEntityType || 'TASK'"
            :disabled-filters="disabledFilters"
            :status-id="selectedStatus"
            :client-id="clientId"
            :project-id="projectId"
            :user-id="userId"
            :show-status-filter="hideStatusFilters"
          />
        </div>
      </template>
      <Column
        v-if="isPortalUser || (canDoActions && canDoTaskAction('edit'))"
        selection-mode="multiple"
      />
      <Column header="Title" field="title" class="w-7">
        <template #body="{ data }">
          <div
            class="flex align-items-center cursor-pointer font-medium text-gray-900 hover:text-gray-600"
          >
            <div
              v-tooltip.bottom.focus="
                data.priority ? data.priority?.description : 'No Priority'
              "
              v-tooltip.bottom="
                data.priority ? data.priority?.description : 'No Priority'
              "
              :class="data.priority ? data.priority?.bgColor : 'bg-gray-500'"
              class="border-round status-color"
              tabindex="0"
            />
            <span
              class="client-name flex-1"
              :class="{ 'line-through': data.status.status === 3 }"
            >{{ metaFilter(data.meta, 'title') }}
            </span>
          </div>
        </template>
      </Column>

      <!-- <Column
        header="Start"
        :sortable="true"
        sortField="startDate"
        field="startDate"
      >
        <template #body="{ data }">
          {{ data.startDate ? dateToHumanShort(data.startDate) : 'None' }}
        </template>
      </Column> -->
      <Column header="Due Date" sortable sort-field="dueDate" field="dueDate">
        <template #body="{ data }">
          {{ data.dueDate ? dateToHumanShort(data.dueDate) : 'None' }}
        </template>
      </Column>
      <Column header="Assign To" class="text-center">
        <template #body="{ data }">
          <template v-if="data.assignees?.length > 0">
            <Avatar
              v-for="(user, index) in data.assignees"
              :key="index"
              v-tooltip.top="`${fullName(user as User)}`"
              class="mr-2"
              :class="{ 'bg-primary': (user as User).picture }"
              shape="circle"
            >
              <template v-if="(user as User).picture">
                <img
                  class="bg-primary text-sm"
                  :src="`${getAttachmentUrl(
                    ((user as User)?.picture as Attachment).path as string,
                  )}`"
                  :style="{ 'vertical-align': 'middle' }"
                  :alt="`${fullName(user as User)}`"
                >
              </template>
              <span v-else>
                {{
                  `${initials(
                    fullName(user as unknown as FullNameObj) as string,
                  )}`
                }}
              </span>
            </Avatar>
          </template>
          <Avatar
            v-else
            v-tooltip.top="`Unassigned`"
            icon="pi pi-user"
            class="mr-2"
            shape="circle"
          />
        </template>
      </Column>
      <Column field="attachments" class="w-2">
        <template #header>
          <i v-tooltip.top="'Attachments'" class="pi pi-paperclip text-xl" />
        </template>
        <template #body="{ data }">
          <span
            v-if="data.attachments?.length > 0"
            class="underline font-medium cursor-pointer hover:text-gray-600 text-blue-500"
            @click="
              selectedAttachments = data.attachments;
              attachmentsListDialog = true;
            "
          >View</span>
          <span v-else>0</span>
        </template>
      </Column>
      <Column v-if="canDoTaskAction('edit') || isPortalUser" header="Actions">
        <template #body="{ data }: { data: Task }">
          <span
            v-if="currentSelectedbtn !== 'Closed' && data.status?.status !== 3"
            v-tooltip.top="
              `${!canDoActions ? disabledTooltip : 'Mark as Complete'}`
            "
            class="inline-block"
            style=" width: 2.357rem;height: 2.357rem;"
          >
            <Button
              :disabled="
                !canDoActions || isSelectedTasks.includes(data) || updatingTask
              "
              icon="pi pi-check-circle"
              class="p-button-sm p-button-rounded p-button-icon-only bg-green-500 border-green-500 hover:bg-green-400 hover:border-green-400"
              @click="updateTaskStatus(data)"
            >
              <i v-if="updatingTask" class="pi pi-spin pi-spinner" />
            </Button>
          </span>
          <span
            v-else
            v-tooltip.top="`${!canDoActions ? disabledTooltip : 'Reopen'}`"
            class="inline-block"
            style=" width: 2.357rem;height: 2.357rem;"
          >
            <Button
              :disabled="
                !canDoActions || isSelectedTasks.includes(data) || updatingTask
              "
              icon="pi pi-undo"
              class="p-button-sm p-button-rounded bg-orange-500 border-orange-500 hover:bg-orange-400 hover:border-orange-400"
              @click="updateTaskStatus(data)"
            >
              <i v-if="updatingTask" class="pi pi-spin pi-spinner" />
            </Button>
          </span>
        </template>
      </Column>
    </DataTable>
    <div
      v-if="selectedTask"
      class="border-round-lg surface-overlay mt-4 md:mt-0 shadow-2 w-full md:w-4 fadeinright"
      :class="{ fadeoutright: !selectedTask }"
    >
      <div class="flex flex-column p-4">
        <div class="mb-4">
          <div class="flex justify-content-between">
            <div>
              <span class="text-900 text-xl font-medium">{{
                selectedTask
                  ? metaFilter(selectedTask.meta as MetaObj[], 'title')
                  : 'Task Details'
              }}
              </span>
              <div
                v-if="
                  (!isPortalUser && selectedTask.type !== 'SUPPORTTASK')
                    || ((isPortalUser || selectedTask.type === 'SUPPORTTASK')
                      && selectedTask.tags?.length)
                "
                class="w-full inline-flex align-items-center"
              >
                <span class="pr-2 border-gray-400 text-sm"> Tags:</span>

                <div class="flex flex-wrap gap-1">
                  <CommonTags
                    :current-id="selectedTask?.id"
                    :is-portal="isPortalUser"
                    :data="selectedTask"
                    :tag-type="selectedTask.type as unknown as TagType"
                    :task-entity-type="entityType"
                  />
                </div>
              </div>
              <CommonTimer
                v-if="isActiveTimerForSelectedTask && !isPortalUser"
                class="mt-2"
                :timer-data="timerListData?.activeTimer"
                units
              />
            </div>
            <div class="w-6rem text-right">
              <span
                v-if="
                  !isActiveTimerForSelectedTask
                    && !isPortalUser
                    && selectedTask.status?.status !== 3
                "
                v-tooltip.top.focus="
                  `${!canDoActions ? disabledTooltip : 'Start Timer'}`
                "
                v-tooltip.top="
                  `${!canDoActions ? disabledTooltip : 'Start Timer'}`
                "
                class="inline-block"
                tabindex="0"
                style=" width: 2.357rem;height: 2.357rem;"
              >
                <Button
                  icon="pi"
                  :disabled="!canDoActions || disabledTimerAndEdit"
                  class="p-button-rounded p-button-text"
                  :class="canStartTimer"
                  @click="handleStartTimer(selectedTask as Task)"
                >
                  <i
                    :class="{
                      'opacity-50': !canDoActions || disabledTimerAndEdit,
                    }"
                    class="pi pi-custom pi-stopwatch h-1.5rem w-1.5rem"
                  />
                </Button>
              </span>
              <span
                v-if="canDoTaskAction('edit') || isPortalUser"
                v-tooltip.top.focus="
                  `${!canDoActions ? disabledTooltip : 'Edit'}`
                "
                v-tooltip.top="`${!canDoActions ? disabledTooltip : 'Edit'}`"
                class="inline-block"
                tabindex="0"
                style=" width: 2.357rem;height: 2.357rem;"
              >
                <Button
                  :disabled="!canDoActions || disabledTimerAndEdit"
                  icon="pi pi-pencil"
                  class="p-button-rounded p-button-text"
                  @click="openTaskEditModal = true"
                />
              </span>
            </div>
          </div>
          <div class="space-y-0.5 flex-1">
            <div
              v-if="selectedTask?.project"
              class="flex flex-column md:flex-row text-base"
            >
              <span>
                Project Name:
                <strong>{{ selectedTask?.project?.name }}</strong>
              </span>
            </div>
            <div
              v-if="selectedTask?.client"
              class="flex flex-column md:flex-row text-base"
            >
              <span>
                {{ `${$tConfig('CLIENT')}` }}:
                <strong>{{ selectedTask?.client?.name }}</strong>
              </span>
            </div>
          </div>
        </div>
        <div>
          <TasksOverview
            :key="formKey"
            :task="selectedTask"
            :task-id="selectedTask.id"
            :can-call-task-details="canCallTaskDetails"
            @success="handleSelectedTags"
          />
        </div>
      </div>
    </div>
  </div>
  <Dialog
    ref="dailogRef"
    v-model:visible="openTaskEditModal"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '95vw', height: '90%' }"
    content-class="border-round-bottom-md relative"
    class="dailog-custom"
    @hide="handleDetailClose"
  >
    <template #header>
      <div class="flex space-x-2.5">
        <div
          class="p-3 h-4rem w-4rem bg-primary border-circle flex justify-content-center"
        >
          <i class="pi pi-check-square" style="font-size: 1.5rem;" />
        </div>
        <div class="flex flex-column justify-content-center">
          <div class="text-2xl font-medium mb-1 flex">
            {{ `${metaFilter(selectedTask?.meta as MetaObj[], 'title')}` }}
            <CommonTimer
              v-if="isActiveTimerForSelectedTask && !isPortalUser"
              class="ml-2"
              :timer-data="timerListData?.activeTimer"
              units
              day
            />
          </div>
          <div
            v-if="
              (!isPortalUser && selectedTask?.type !== 'SUPPORTTASK')
                || ((isPortalUser || selectedTask?.type === 'SUPPORTTASK')
                  && selectedTask?.tags?.length)
            "
            class="w-full inline-flex align-items-center"
          >
            <span class="pr-2 border-gray-400 text-sm"> Tags: </span>

            <div class="flex flex-wrap gap-1">
              <CommonTags
                :current-id="selectedTask?.id"
                :is-portal="isPortalUser"
                :data="selectedTask"
                :tag-type="selectedTask?.type as unknown as TagType"
                :task-entity-type="entityType"
              />
            </div>
          </div>
          <div v-if="selectedTask?.createdBy" class="text-sm">
            Created by:
            <strong> {{ fullName(selectedTask?.createdBy as User) }} - </strong>
            {{
              dateToHumanShort(selectedTask?.createdAt, 'D/MMM/YYYY HH:mm A')
            }}
          </div>
          <template v-if="isPortalUser">
            <div v-if="selectedTask?.assignees" class="text-sm">
              Assigned To:
              <strong>
                {{
                  fullName(
                    (selectedTask?.assignees as User[])[0] as FullNameObj,
                  )
                }}
              </strong>
            </div>
            <div v-if="selectedTask?.project" class="text-sm">
              Project: <strong>{{ selectedTask?.project.name }}</strong>
            </div>
          </template>
        </div>
      </div>
    </template>
    <TasksDetails
      :task="selectedTask"
      :entity-type="selectedTask?.type"
      :task-id="selectedTask?.id"
      :is-active-timer-for-selected-task="isActiveTimerForSelectedTask"
      :is-selected-task-for-current-user="isSelectedTaskForCurrentUser"
      :is-selected-task-completed="isSelectedTaskCompleted"
      :is-active-timer="isActiveTimer"
      :project-id="projectId"
      :client-id="selectedTask?.client?.id"
      @close="handleDetailClose"
      @task-delete-intiated="canCallTaskDetails = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="startTimerDialog"
    :modal="true"
    append-to="body"
    header="Start Timer"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="startTimerDialog = false"
  >
    <TimerStart
      :task-id-value="selectedTask?.id"
      :project="selectedTaskProjectId"
      :client="selectedTaskClientId"
      @modal-close="startTimerDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="attachmentsListDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="selectedAttachments = []"
  >
    <ol
      v-if="selectedAttachments.length"
      class="project-clients-list pl-3 p-0 m-0 formgrid"
    >
      <li
        v-for="(item, index) in selectedAttachments"
        :key="index"
        class="col py-1"
      >
        <div class="flex">
          <a
            target="_blank"
            class="flex flex-1 align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
            @click="downloadFileAs(getAttachmentUrl(item.path), item.name)"
          >
            {{ item.name }}
          </a>
        </div>
      </li>
    </ol>
    <template v-else>
      No attachments available
    </template>
  </Dialog>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="timer"
    @hide="subscribeDialog = false"
  />
  <CommonConfirmRemoveDialog
    v-if="tasksBulkActionDialog"
    :visible="tasksBulkActionDialog"
    :record-to-remove="selectedTasks as Record<string, any>"
    :title="`Confirm ${
      activeStatus === 'Open'
        ? 'Mark as Complete for selected'
        : 'Reopen selected'
    } Task(s)`"
    @confirm="taskBulkAction"
    @hide="tasksBulkActionDialog = false"
  >
    <div>
      <div>
        <strong>{{
          selectedTasks
            ?.map((task: Task) => metaFilter(task.meta as MetaObj[], 'title'))
            .toString()
        }}</strong>
        will be
        {{ activeStatus === 'Closed' ? 're-opened' : 'marked as completed' }}.
      </div>
      Are you sure you want to
      {{ activeStatus === 'Closed' ? 're-open' : 'mark as complete for all' }}
      <strong>{{
        selectedTasks
          ?.map((task: Task) => metaFilter(task.meta as MetaObj[], 'title'))
          .toString()
      }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped>
.status-color {
  width: 0.8rem !important;
  height: 0.8rem !important;
  margin-right: 4px;
}

.pi-custom::before {
  background-color: #69707a;
}

:deep(.p-datatable-wrapper) {
  .p-datatable-tbody > tr.p-highlight {
    color: #69707a;
    background-color: #eff6ff !important;
  }
}

.p-button.p-button-secondary,
.select-status-btn {
  &.active {
    border: 2px solid $primaryColor !important;
    // background-color: var(--blue-100);
  }
}

.select-status-btn {
  &:hover {
    color: #607d8b;
    background: rgb(96 125 139 / 4%);
    border: 1px solid;
  }
}
</style>
