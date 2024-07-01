<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { EntityStatus } from '@/types/status-entity.type';
import type { EntityType, Task, UpdateTask } from '@/types/tasks.type';
import type { MetaObj, PaginatedResponse } from '@/types/common.type';
import Dialog from 'primevue/dialog';
import type { FullNameObj, User } from '@/types/teams.type';
import DataTable from 'primevue/datatable';
import { useRouteQuery } from '@vueuse/router';
import type { OperationType } from '@/types/permissions.type';
import type { TagType } from '@/types/tags.type';

const props = defineProps<{
  userId?: string;
  projectId?: string;
  clientId?: string;
  entityType?: EntityType;
  isPortal?: boolean;
  hideFilters?: boolean;
  disabledFilters?: string[];
  filterType?: string;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const { entityType: currentEntityType } = toRefs(props);
const route = useRoute();
const router = useRouter();
const { getTimersList } = useCommonListQueries();
const { fullName, dateToHumanShort } = useVueFilters();
const { defaultBreakpoints } = useCommonBreakPoints();
const { isLarge } = useCommonBreakPoints();
const { metaFilter, filterObjByKeys, isFalsy } = useUtilityFns();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { currentUser, isPortalUser } = useCurrentUserData();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,

  tableAttrs,
  queryKeys,
  filtersRef,
  queryFilters,
  querySortBy,
  tableRecords
} = useDataTableUtils();

const isFiltersVisible = ref(false);
const keysToExclude = ref(['AssignedBy', 'Status', 'Type']);

if (route.name === 'admin-tasks') {
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

function toggleFilters(reset: boolean) {
  if (reset && filtersRef.value) {
    filtersRef.value.resetFilters();
  }
  else {
    isFiltersVisible.value = !isFiltersVisible.value;
  }
}

const { data: filterData, applyFilter } = useFilterColumns();
const { canDo } = usePermissions();

applyFilter('Type', props.entityType ? [props.entityType] : ['TASK']);
if (props.isPortal) {
  applyFilter('Client', [props.clientId]);
}
const initialFilters = useEncodeFilterData(filterData);
const notifiedtaskId = useRouteQuery<string>('notificationId');

const selectedTaskId = ref<string>('');
const openActionDailog = ref<boolean>(false);
const actionKey = ref<string>('Delete');
const doneStatus = ref('');
const reopenStatus = ref('');
const tasksList = ref<Task[]>();
const dailogRef = ref<InstanceType<typeof Dialog> | null>(null);
const datatableRef = ref<InstanceType<typeof DataTable> | null>(null);
const openTaskEditModal = ref(false);
const startTimerDialog = ref(false);
const formKey = ref(0);

const canMakeAPICall = computed(() => !isPortalUser.value);
const { isLoading: loadingTimerList, data: timerListData } = getTimersList(
  {},
  canMakeAPICall
);
/* const isSelectedTaskForCurrentUser = computed(
  () => selectedTask.value?.assignees === currentUser.value?.id
); */

const isSelectedTaskForCurrentUser = computed(() =>
  Array.isArray(selectedTask.value?.assignees)
    ? selectedTask.value?.assignees?.some(
      (assignee: User) => assignee.id === currentUser.value?.id
    )
    : false
);

const isActiveTimer = computed(() => timerListData.value?.isActiveTimer);
const isActiveTimerForSelectedTask = computed(
  () =>
    isActiveTimer.value
    && selectedTask.value?.id === timerListData.value?.activeTimer?.entity.id
);

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

function handleAction() {
  if (actionKey.value === 'Delete') {
    deleteTask();
  }
}

function handleAfterAction(data?: Task) {
  if (data?.status?.status === 3) {
    refetchTimerOnTaskUpdate(data?.id);
  }
  emit('success');
  openTaskEditModal.value = false;
  queryClient.invalidateQueries('tasks-list');
  selectedTaskId.value = '';
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
      </strong> re-opened successfully.`
    });
  }
  emit('success');
  queryClient.invalidateQueries('tasks-list');
}

const { mutateAsync: updateTask } = useMutation(
  ({ id, payload }: { id: string; payload: Partial<UpdateTask> }) => {
    return useTaskUpdate({
      id,
      payload,
      isPortal: isPortalUser.value,
      entityType: props.entityType as EntityType
    });
  },
  {
    onSuccess: (data: Task) => {
      handleSuccess(data);
    }
  }
);

const { data: selectedTask } = useQuery(
  ['task-details', selectedTaskId],
  async () => {
    if (!selectedTaskId.value)
      return;
    return useTask(
      selectedTaskId.value,
      props.entityType as EntityType,
      isPortalUser.value
    );
  },
  {
    onSuccess: (data: Task) => {
      if (data)
        openTaskEditModal.value = true;
    }
  }
);

const { isLoading: loadingtasks, data: tasks } = useQuery(
  ['tasks-list', ...queryKeys],
  async () => {
    if (!props.userId && !props.projectId)
      return useTasksListV2({
        entityType: props.entityType as EntityType,
        isPortal: isPortalUser.value,
        clientId: isPortalUser.value ? currentUser.value?.client?.id : '',
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value ? queryFilters.value : initialFilters,
        sortBy: querySortBy.value
      });
    else if (props.projectId) {
      const project = await useProjectDetails(props.projectId as string);
      return project?.entities;
    }
    else
      return useUserSingleTasksV2({
        id: props.userId as string,
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value ? queryFilters.value : initialFilters,
        sortBy: querySortBy.value
      });
  },

  {
    onSuccess: (data: PaginatedResponse<Task> | Task[]) => {
      tableRecords.value = data as PaginatedResponse<Task>;
      tasksList.value = (data as PaginatedResponse<Task>)?.results
        ? [...((data as PaginatedResponse<Task>)?.results as Task[])]
        : [...(data as Task[])];
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
      reopenStatus.value = data.filter(
        (item: EntityStatus) => item.status === 1
      )[0]?.name;
    }
  }
);

async function updateTaskStatus(isChecked: boolean, val: UpdateTask | any) {
  const payload: Partial<UpdateTask> = {
    type: val.type,
    data: {
      type: val.type,
      title: metaFilter(val?.meta, 'title'),
      entityStatus: isChecked ? doneStatus.value : reopenStatus.value
    }
  };

  await updateTask({ id: val.id, payload });
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const { mutateAsync: deleteTask } = useMutation(
  'deleteTask',
  async () => {
    return useEntityDelete(
      selectedTask.value?.id as string,
      props.entityType as EntityType,
      isPortalUser.value
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
      handleAfterAction();
      // router.go(0);
    }
  }
);

watchEffect(() => {
  if (doesFiltersHasValues.value) {
    isFiltersVisible.value = true;
  }
});

onMounted(() => {
  if (notifiedtaskId.value) {
    selectedTaskId.value = notifiedtaskId.value as string;
  }
});
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
</script>

<template>
  <div v-bind="$attrs" class="md:space-x-3.5 flex-column md:flex-row">
    <DataTable
      ref="datatableRef"
      v-bind="tableAttrs"
      v-model:filters="filters"
      :value="tasksList"
      :total-records="
        (tasks as PaginatedResponse<Task>)?.results
          ? (tasks as PaginatedResponse<Task>)?.total
          : tasksList?.length
      "
      :loading="loadingtasks"
      responsive-layout="scroll"
      breakpoint="768px"
      class="p-datatable-customers flex-1"
      @page="handlePageOrLimitChange($event)"
      @sort="handleSortChange"
    >
      <template #empty>
        <div class="text-center">
          No tasks found
        </div>
      </template>
      <template #header>
        <div class="flex justify-content-between">
          <CommonListSearchInput
            v-bind="{ listProps: props, placeholder: 'Search Tasks' }"
          />

          <div>
            <Button
              v-if="!hideFilters"
              type="button"
              :icon="
                doesFiltersHasValues ? 'pi pi-filter-slash' : 'pi pi-filter'
              "
              class="p-button-icon-only p-button-rounded"
              :class="{ 'p-button-danger': doesFiltersHasValues }"
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
            :entity-type="props.entityType || 'TASK'"
            :disabled-filters="disabledFilters"
          />
        </div>
      </template>
      <Column v-if="canDoTaskAction('edit')" class="w-1rem">
        <template #body="slotProps">
          <Checkbox
            input-id="binary"
            :model-value="slotProps.data.status.status === 3"
            :binary="true"
            @input="updateTaskStatus($event, slotProps.data)"
          />
        </template>
      </Column>
      <Column header="Title" field="title" class="w-7">
        <template #body="{ data }">
          <div
            class="flex align-items-center cursor-pointer font-medium text-gray-900 hover:text-gray-600"
            @click="selectedTaskId = data.id"
          >
            <div
              v-tooltip.bottom="
                data.priority ? data.priority?.description : 'No Priority'
              "
              :class="data.priority ? data.priority?.bgColor : 'bg-gray-500'"
              class="border-round status-color"
            />
            <span
              class="flex-1"
              :class="{ 'line-through': data.status.status === 3 }"
            >{{ metaFilter(data.meta, 'title') }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Due Date" sortable sort-field="dueDate" field="dueDate">
        <template #body="{ data }">
          {{
            data.dueDate ? dateToHumanShort(data.dueDate, 'DD MMM, YY') : 'None'
          }}
        </template>
      </Column>
    </DataTable>
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
    @hide="selectedTaskId = ''"
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
            <span class="flex-1">{{
              `${metaFilter(selectedTask?.meta as MetaObj[], 'title')}`
            }}</span>
            <CommonTimer
              v-if="isLarge && isActiveTimerForSelectedTask && !isPortalUser"
              class="mr-auto mt-2"
              :timer-data="timerListData?.activeTimer"
              units
            />

            <Button
              v-if="
                (!isLarge && !isPortalUser && canDoTaskAction('delete'))
                  || (isPortalUser && selectedTask?.type === 'SUPPORTTASK')
              "
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
          <div v-if="selectedTask?.createdBy" class="text-sm pr-4">
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
                    (selectedTask?.assigneesData as User[])[0] as FullNameObj,
                  )
                }}
              </strong>
            </div>
            <div v-if="selectedTask?.project" class="text-sm">
              Project: <strong>{{ selectedTask?.project.name }}</strong>
            </div>
          </template>
          <CommonTimer
            v-if="!isLarge && isActiveTimerForSelectedTask && !isPortalUser"
            class="mr-auto mt-2"
            :timer-data="timerListData?.activeTimer"
            units
          />
        </div>
      </div>
    </template>
    <TasksDetails
      v-if="openTaskEditModal"
      :task="selectedTask"
      :entity-type="selectedTask?.type"
      :task-id="selectedTaskId"
      :is-active-timer-for-selected-task="isActiveTimerForSelectedTask"
      :is-selected-task-for-current-user="isSelectedTaskForCurrentUser"
      :is-active-timer="isActiveTimer"
      :project-id="projectId"
      @close="handleAfterAction"
    />
  </Dialog>

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
      :task-id-value="selectedTask?.id"
      @modal-close="startTimerDialog = false"
    />
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

<style lang="scss" scoped>
.status-color {
  width: 0.8rem !important;
  height: 0.8rem !important;
  margin-right: 4px;
}

.pi-custom::before {
  background-color: #69707a;
}
</style>
