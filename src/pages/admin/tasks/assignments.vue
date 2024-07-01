<script setup lang="ts">
import { useQuery, useQueryClient } from 'vue-query';
import TasksList from '@/components/Tasks/List.vue';
import dayjs from 'dayjs';
import type { Card } from '@/types/dashboard.type';
import type { EntityType } from '@/types/tasks.type';

const { defaultBreakpoints, isLarge } = useCommonBreakPoints();
const { overDue } = useOverDueColor();
const queryClient = useQueryClient();
const { activeTabIndex, activeTab, tabRef, handleTabChange } = useSteps(
  'admin-tasks-assignments'
);
const { currentUser, isPortalUser } = useCurrentUserData();
const { canDo } = usePermissions();
const router = useRouter();
const route = useRoute();

const openTaskCreate = ref(false);
const formKey = ref(0);
const tasksListRef = ref<InstanceType<typeof TasksList> | null>(null);
const filterIndex = ref(0);
const currentStatus = ref<string>();
const cards = ref<Card[]>([
  {
    id: 'tasksDueTodayFilter',
    title: 'Today\'s Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'tasksDueThisWeekFilter',
    title: 'Week\'s Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'tasksDueNextWeekFilter',
    title: 'Next Week\'s Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'overDueTasksFilter',
    title: 'Overdue Tasks',
    value: '',
    color: '',
    clickable: true
  }
]);

const entityTypeValue = computed(() => {
  if (activeTabIndex.value)
    return activeTabIndex.value === 0 ? 'TASK' : 'CLIENTTASK';
});

const encodedFilters: string[] = [];

const { applyFilter } = useFilterColumns();

applyFilter('Type', [activeTabIndex.value === 0 ? 'TASK' : 'CLIENTTASK']);
applyFilter('AssignedBy', currentUser.value ? [currentUser.value?.id] : []);

const tasksDueTodayFilter = useEncodeFilterData(
  applyFilter('Due Date', [dayjs().toDate(), dayjs().toDate()])
);
encodedFilters.push(tasksDueTodayFilter);
const tasksDueThisWeekFilter = useEncodeFilterData(
  applyFilter('Due Date', [dayjs().toDate(), dayjs().endOf('week').toDate()])
);
encodedFilters.push(tasksDueThisWeekFilter);

const tasksDueNextWeekFilter = useEncodeFilterData(
  applyFilter('Due Date', [
    dayjs().startOf('week').add(1, 'week').toDate(),
    dayjs().endOf('week').add(1, 'week').toDate()
  ])
);
encodedFilters.push(tasksDueNextWeekFilter);
applyFilter('Due Date', undefined);
const overDueTasksFilter = useEncodeFilterData(
  applyFilter('LessThan Date', [dayjs().toDate()])
);
encodedFilters.push(overDueTasksFilter);

const { isFetching } = useQuery(
  ['tasks-list-card-data', filterIndex, entityTypeValue],
  async () => {
    return useTasksListV2({
      // status: 'OPEN',
      entityType: entityTypeValue.value as unknown as EntityType,
      isPortal: isPortalUser.value,
      clientId: isPortalUser.value ? currentUser.value?.client?.id : '',
      filters: encodedFilters[filterIndex.value]
    });
  },
  {
    onSuccess: (value) => {
      cards.value[filterIndex.value].value = value?.total?.toString() || '0';
      cards.value[filterIndex.value].filterString
        = encodedFilters[filterIndex.value];
      if (filterIndex.value < encodedFilters.length - 1) {
        filterIndex.value++;
      }
    }
  }
);

const isOverDue = ref();
watchEffect(() => {
  isOverDue.value = overDue(cards.value);
});

const cardData = computed(() => {
  return cards.value
    .map((e) => {
      switch (e.id) {
        case 'tasksDueTodayFilter':
          return {
            ...e,
            value: e.value
          };

        case 'tasksDueThisWeekFilter':
          return {
            ...e,
            value: e.value
          };

        case 'tasksDueNextWeekFilter':
          return {
            ...e,
            value: e.value
          };
        case 'overDueTasksFilter':
          return {
            ...e,
            value: e.value,
            color: `${isOverDue.value}`
          };

        default: {
          return { ...e };
        }
      }
    })
    .filter(e => e) as Card[];
});

function handleCreate() {
  openTaskCreate.value = true;
  formKey.value++;
}
function handleClose() {
  openTaskCreate.value = false;
  refreshCardData();
}

function refreshCardData() {
  filterIndex.value = 0;
  queryClient.invalidateQueries('tasks-list-card-data');
}

function handleCardClick(card: Card) {
  router.push({
    query: {
      ...route.query,
      filters: card.filterString as string
    }
  });
}

function handleStatusName(val: string) {
  if (val) {
    currentStatus.value = val;
  }
}
</script>

<template>
  <div class="mb-4">
    <WidgetCards
      :loading="isFetching"
      :cards="cardData"
      :cards-in-row="4"
      @card-click="handleCardClick"
    />
  </div>
  <TabView
    v-if="isLarge"
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
  >
    <TabPanel header="Team">
      <CommonPage :title="`Team ( ${currentStatus ? currentStatus : ''} )`">
        <template v-if="canDo('tasks', 'create')" #actions>
          <Button
            v-tooltip.left="'Add Team Task'"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="handleCreate"
          />
        </template>
        <TasksList
          v-if="isLarge && canDo('tasks', 'list')"
          ref="tasksListRef"
          entity-type="TASK"
          :disabled-filters="['Start Date']"
          @success="refreshCardData()"
          @task-status-title="handleStatusName"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Active Tasks list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <!-- <TabPanel header="Completed">
      <CommonPage title="Completed Tasks">
        <TasksList
          ref="tasksListRef"
          :entityType="'TASK'"
          :status="'CLOSED'"
          :disabledFilters="['Status', 'Start Date']"
          v-if="isLarge && canDo('tasks', 'list')"
        ></TasksList>
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Completed Tasks list.
          </p>
        </div>
      </CommonPage>
    </TabPanel> -->
    <TabPanel header="Client Request">
      <CommonPage
        :title="`Client Request ( ${currentStatus ? currentStatus : ''} )`"
      >
        <template v-if="canDo('tasks', 'create')" #actions>
          <Button
            v-tooltip.left="'Add Client Request'"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="handleCreate"
          />
        </template>
        <TasksList
          v-if="isLarge && canDo('tasks', 'list')"
          ref="tasksListRef"
          entity-type="CLIENTTASK"
          :disabled-filters="['Start Date']"
          @success="refreshCardData()"
          @task-status-title="handleStatusName"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Active Tasks list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
  </TabView>
  <CommonPage v-else title="Tasks">
    <template v-if="canDo('tasks', 'create')" #actions>
      <Button
        v-tooltip.left="'Add Task'"
        icon="pi pi-plus"
        class="p-button-rounded"
        @click="handleCreate"
      />
    </template>
    <TasksMobileList
      v-if="canDo('tasks', 'list')"
      ref="tasksListRef"
      entity-type="TASK"
      :disabled-filters="['Start Date', 'Project Manager']"
      @success="refreshCardData()"
    />
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the Tasks list.
      </p>
    </div>
  </CommonPage>
  <Dialog
    v-model:visible="openTaskCreate"
    :modal="true"
    append-to="body"
    :header="`Create ${
      tasksListRef?.props?.entityType === 'TASK'
        ? 'Team Task'
        : 'Client Request'
    }`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <TasksCreateUpdate
      v-if="isLarge"
      :key="formKey"
      :entity-type="tasksListRef?.props?.entityType"
      @close="handleClose"
    />
    <TasksMobileCreateUpdate v-else @close="handleClose" />
  </Dialog>
</template>
