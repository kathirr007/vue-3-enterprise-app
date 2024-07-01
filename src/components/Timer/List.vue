<script setup lang="ts">
import type { Attachment } from '@/types/attachment.type';
import type { APIActions, MetaObj } from '@/types/common.type';
import type { Task } from '@/types/tasks.type';
import type { Timelog } from '@/types/timelog.type';
import type { TimerObj } from '@/types/timer.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    hideFilters?: boolean;
    disabledFilters?: string[];
  }>(),
  {
    disabledFilters: () => [],
    hideFilters: false
  }
);

const {
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  currentLimit,
  filtersRef,
  currentPage,
  queryFilters,
  querySortBy,
  queryKeys,
  isFiltersVisible,
  toggleFilters
} = useDataTableUtils();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { isLarge } = useCommonBreakPoints();
const { metaFilter } = useUtilityFns();
const { timeSpentReadable, convertMinsToHrsMins } = useVueFilters();
const { getCompletedTimersList } = useCommonListQueries();
const { dateToDateTime, dateToHumanShort } = useVueFilters();
const { canDo, canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();
const { getAttachmentUrl } = useAttachments();
const { fullName, initials } = useVueFilters();
const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
const router = useRouter();
const route = useRoute();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const { remove: removeTimelog } = useTimelog();

const {
  isLoading: loadingTimerList,
  isFetching: fetchingTimerList,
  data: timerListData
} = getCompletedTimersList({
  page: currentPage.value,
  limit: currentLimit.value,
  filters: queryFilters.value
});
const closeDialog = ref(false);
const taskId = ref<string>('');
const stopDialog = ref(false);
const isCreateUpdateTimelog = ref(false);
const removeTimelogDialog = ref(false);
const selectedTimelog = ref();

// const timerlistModified = computed(() => {
//   return timerListData.value?.data?.results.map((timer: TimerObj) => ({
//     ...timer,
//     title: metaFilter(timer.entity.meta as MetaObj[], 'title'),
//   }));
// });

function showToast(data: Timelog,
  title: string,
  actionType: APIActions,
  detail?: string) {
  initToast({
    actionType,
    title,
    actionObj: { ...data },
    detail
  });
}

const { mutateAsync: handleRemove } = useMutation((id: string) => removeTimelog(id),
  {
    onSuccess: (data) => {
      showToast(data as Timelog, 'Time Log', 'Remove');
      selectedTimelog.value = undefined;
      queryClient.invalidateQueries('completed-timers-list');
    }
  });

function startTimer(entityId: string) {
  closeDialog.value = true;
  taskId.value = entityId;
}
function stopTimer() {
  stopDialog.value = true;
}

function canNavigate(timer: TimerObj) {
  return !(timer.entity.isDeleted || timer.entity.project?.isDeleted);
}

function gotoTask(task: Task) {
  // applyFilter('Status', [task.status?.id]);
  applyFilter('Type', [task.type]);
  applyFilter('SearchText', metaFilter(task.meta as MetaObj[], 'title'));
  const preparedFilters = useEncodeFilterData(filterData);
  let routeName: string;
  switch (task.type) {
    case 'CLIENTTASK':
    case 'TASK':
      routeName = 'admin-tasks-alltasks';
      break;
    case 'SUPPORTTASK':
      routeName = 'admin-support';
      break;
    default:
      routeName = '';
  }
  router.push({
    name: routeName,
    query: {
      notificationId: task.id,
      filters: preparedFilters,
      activeIndex: task.type === 'CLIENTTASK' ? 1 : 0
    }
  });
}

function handleTimelogActions(data: { data: any;action: APIActions }) {
  selectedTimelog.value = data.data;
  if (data.action === 'Update')
    isCreateUpdateTimelog.value = true;
  if (data.action === 'Remove')
    removeTimelogDialog.value = true;
}

function handleRemoveClose() {
  removeTimelogDialog.value = false;
  selectedTimelog.value = undefined;
}

function handleCloseCreateDialog() {
  selectedTimelog.value = undefined;
  isCreateUpdateTimelog.value = false;
}
</script>

<template>
  <DataTable
    data-key="id"
    :value="timerListData?.data.results"
    :loading="loadingTimerList || fetchingTimerList"
    :total-records="timerListData?.data.total"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #empty>
      <div class="text-center">
        No record found.
      </div>
    </template>
    <template #header>
      <div class="flex justify-content-end">
        <!-- <CommonListSearchInput
          v-bind="{
            listProps: {
              ...props,
            },
            placeholder: `Search Log`,
          }"
        /> -->
        <div>
          <Button
            v-tooltip.left="'Create Time Log'"
            type="button"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="isCreateUpdateTimelog = true"
          />
          <Button
            v-if="!hideFilters"
            type="button"
            :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
            class="p-button-icon-only p-button-rounded ml-2"
            :class="{ 'p-button-danger': queryFilters }"
            @click="toggleFilters(!!queryFilters)"
          />
          <a
            href="https://brightreturn.com/kb/cpa-time-tracking"
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
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <TimerFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
        />
      </div>
    </template>
    <Column header="Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.createdAt) }}
      </template>
    </Column>
    <Column :header="`${$tConfig('CLIENT')} Name`">
      <template #body="{ data }: { data: TimerObj }">
        <router-link
          v-if="data.entity.client?.id"
          :to="{
            name: 'admin-clients-id',
            params: {
              id: data.entity.client?.id,
            },
          }"
          class="flex align-items-center font-medium text-gray-900"
          :class="
            canDo('clients', 'single')
              ? 'cursor-pointer hover:text-gray-600'
              : 'pointer-events-none'
          "
        >
          <span class="user-name">{{ data.entity.client?.name }}</span>
        </router-link>
        <span
          v-else
          class="user-name flex align-items-center font-medium text-gray-900"
        >{{ 'None' }}</span>
      </template>
    </Column>
    <Column header="Project Name">
      <template #body="{ data }: { data: TimerObj }">
        <template v-if="data.entity.project?.id">
          <router-link
            v-if="canNavigate(data)"
            :to="{
              name: 'admin-projects-id',
              params: { id: data.entity.project?.id },
            }"
            class="flex align-items-center font-medium text-gray-900"
            :class="
              canDo('projects', 'single')
                ? 'cursor-pointer hover:text-gray-600'
                : 'pointer-events-none'
            "
          >
            <span class="user-name">{{ data.entity.project?.name }}</span>
          </router-link>
          <span v-else class="user-name">{{ data.entity.project?.name }}</span>
        </template>
        <span v-else class="user-name flex align-items-center">{{
          'None'
        }}</span>
      </template>
    </Column>
    <Column header="Task Name">
      <template #body="{ data }: { data: TimerObj }">
        <template v-if="data.entity?.id">
          <router-link
            v-if="canNavigate(data)"
            to=""
            class="flex align-items-center font-medium text-gray-900"
            :class="
              canDo('tasks', 'single')
                ? 'cursor-pointer hover:text-gray-600'
                : 'pointer-events-none'
            "
            @click.prevent="gotoTask(data.entity)"
          >
            <span class="user-name">
              {{ metaFilter(data.entity.meta as MetaObj[], 'title') }}
            </span>
          </router-link>
          <span v-else class="user-name">
            {{ metaFilter(data.entity.meta as MetaObj[], 'title') }}
          </span>
        </template>
        <span v-else class="user-name flex align-items-center">{{
          'None'
        }}</span>
      </template>
    </Column>
    <Column header="Billable">
      <template #body="{ data }">
        <div
          v-if="metaFilter(data.entity.meta as MetaObj[], 'isBillingEnabled')"
        >
          {{ data.entity.meta[0].metaValue === 'true' ? 'Yes' : 'No' }}
        </div>
        <div v-else>
          {{ '-' }}
        </div>
      </template>
    </Column>
    <Column header="Assigned To" class="text-center white-space-nowrap">
      <template #body="{ data }: { data: TimerObj }">
        <router-link
          v-if="data.entity.assignees?.length"
          :to="{
            name: 'admin-teams-id',
            params: { id: `${data.entity.assignees[0]?.id}` },
          }"
          :class="{
            'pointer-events-none':
              (!canAccessAllMenu && data.id !== currentUser.id)
              || !canDo('users', 'single'),
          }"
          class="text-gray-900 cursor-pointer"
        >
          <Avatar
            v-tooltip="`${fullName(data.entity.assignees[0])}`"
            class="mr-2 relative text-sm"
            :class="{ 'bg-primary': data.entity.assignees[0]?.picture }"
            shape="circle"
          >
            <img
              v-if="data.entity.assignees[0]?.picture"
              class="text-sm"
              :src="
                getAttachmentUrl(
                  (data.entity.assignees[0]?.picture as Attachment)?.path,
                )
              "
              style="vertical-align: middle;"
              alt="Profile Picture"
            >
            <template v-else>
              {{ initials(fullName(data.entity.assignees[0]) as string) }}
            </template>
          </Avatar>
          <!-- <div class="flex flex-column flex-1">
            <span class="user-name-not-active text-primary font-medium"
              >{{ fullName(data.entity.assignees[0]) }}
            </span>
          </div> -->
        </router-link>
        <Avatar
          v-else
          v-tooltip.top="`Unassigned`"
          icon="pi pi-user"
          class="mr-2"
          shape="circle"
        />
      </template>
    </Column>
    <!-- <Column header="Task Status">
      <template #body="{ data }: { data: TimerObj }">
        {{ `${canNavigate(data) ? `${data.entity.status?.name}` : 'Deleted'}` }}
      </template>
    </Column> -->
    <!-- <Column header="Start Time">
      <template #body="{ data }">
        {{
          `${dateToDateTime(data.createdAt).date} ${
            dateToDateTime(data.createdAt).time
          }`
        }}
      </template>
    </Column> -->
    <!-- <Column header="End Time">
      <template #body="{ data }">
        {{
          `${dateToDateTime(data.updatedAt).date} ${
            dateToDateTime(data.updatedAt).time
          }`
        }}
      </template>
    </Column> -->

    <Column header="Duration">
      <!-- <template #header>
        <div>Duration</div>
        <div>(days:hrs:mins:sec)</div>
      </template> -->
      <template #body="{ data }: { data: TimerObj }">
        <div v-if="data.isCompleted" class="font-medium">
          {{ convertMinsToHrsMins(data.activities[0]?.timespent) }}
        </div>
        <span v-else class="font-medium">{{ '00h:00m' }}</span>
        <!-- <CommonTimer
          v-else
          :timerData="data"
          :hideControls="true"
          units
          :ref="data.id"
          class="font-medium"
        /> -->
      </template>
    </Column>

    <!-- <Column class="text-center w-0.5">
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="{ data }: { data: TimerObj }">
        <i
          v-if="data.isCompleted"
          v-tooltip.top="'Start Timer'"
          @click="startTimer(data.entity.id)"
        >
          <span
            class="pi pi-custom pi-stopwatch cursor-pointer w-1.5rem h-1.5rem"
            :class="{
              'pointer-events-none opacity-50': timerListData?.isActiveTimer,
            }"
          />
        </i>
        <i v-else v-tooltip.top="'Stop Timer'" @click="stopTimer">
          <Icon
            class="transition-all text-2xl w-2rem cursor-pointer text-red-500"
            icon="fa6-regular:circle-stop"
          />
        </i>
      </template>
    </Column> -->
    <Column class="w-2 text-center">
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div class="white-space-nowrap">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="handleTimelogActions({ data: slotProps.data, action: 'Update' })"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="
              handleTimelogActions({
                data: slotProps.data,
                action: 'Remove',
              })
            "
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <Dialog
    v-model:visible="closeDialog"
    :modal="true"
    append-to="body"
    header="Start Timer"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="closeDialog = false"
  >
    <TimerStart :task-id-value="taskId" @modal-close="closeDialog = false" />
  </Dialog>
  <Dialog
    v-model:visible="stopDialog"
    :modal="true"
    append-to="body"
    header="Stop Timer"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="stopDialog = false"
  >
    <TimerStop
      :timer-data="timerListData?.activeTimer as TimerObj"
      @modal-close="stopDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isCreateUpdateTimelog"
    :modal="true"
    append-to="body"
    :header="selectedTimelog ? 'Update Time Log' : 'Create Time Log'"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="handleCloseCreateDialog"
  >
    <TimelogCreateUpdate
      :timelog="selectedTimelog"
      @success="isCreateUpdateTimelog = false"
      @modal-close="handleCloseCreateDialog"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="removeTimelogDialog"
    :visible="removeTimelogDialog"
    header="Remove Time Log"
    @confirm="handleRemove(selectedTimelog?.id as string)"
    @hide="handleRemoveClose"
  >
    <div>Are you sure you want to remove the selected Time Log?</div>
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped>
:deep(.time-spent) {
  .p-column-header-content {
    display: block;
  }
}

.pi-custom::before {
  background-color: #69707a;
}
</style>
