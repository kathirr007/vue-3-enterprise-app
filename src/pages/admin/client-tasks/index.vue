<script setup lang="ts">
import { useQuery, useQueryClient } from 'vue-query';
import TasksList from '@/components/Tasks/List.vue';
import dayjs from 'dayjs';
import type { Card } from '@/types/dashboard.type';
import router from '@/router';

const { defaultBreakpoints, isLarge } = useCommonBreakPoints();

const queryClient = useQueryClient();
const { activeTabIndex, tabRef, handleTabChange }
  = useSteps('admin-client-tasks');
const { currentUser, isPortalUser } = useCurrentUserData();
const { canDo } = usePermissions();
const { overDue } = useOverDueColor();

const openTaskCreate = ref(false);
const formKey = ref(0);
const tasksListRef = ref<InstanceType<typeof TasksList> | null>(null);
const filterIndex = ref(0);

const cards = ref<Card[]>([
  {
    id: 'tasksDueTodayFilter',
    title: `Today's Tasks`,
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'tasksDueThisWeekFilter',
    title: `Week's Tasks`,
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'tasksDueNextWeekFilter',
    title: `Next Week's Tasks`,
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
const encodedFilters: string[] = [];

const { applyFilter } = useFilterColumns();
applyFilter('Type', ['CLIENTTASK']);
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
  ['tasks-list-card-data', filterIndex],
  async () => {
    return useTasksListV2({
      // status: 'OPEN',
      entityType: 'CLIENTTASK',
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
      filters: card.filterString as string
    }
  });
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
    <TabPanel header="Active">
      <CommonPage title="Active Tasks">
        <template v-if="canDo('tasks', 'create')" #actions>
          <Button
            v-tooltip.left="'Add Task'"
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="handleCreate"
          />
        </template>
        <TasksList
          v-if="isLarge && canDo('tasks', 'list')"
          ref="tasksListRef"
          status="OPEN"
          entity-type="CLIENTTASK"
          :disabled-filters="['Start Date']"
          @success="refreshCardData()"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Active Tasks list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Completed">
      <CommonPage title="Completed Tasks">
        <TasksList
          v-if="isLarge && canDo('tasks', 'list')"
          ref="tasksListRef"
          entity-type="CLIENTTASK"
          status="CLOSED"
          :disabled-filters="['Status', 'Start Date']"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Completed Tasks list.
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
      entity-type="CLIENTTASK"
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
    header="Create Task"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <TasksCreateUpdate
      v-if="isLarge"
      :key="formKey"
      entity-type="CLIENTTASK"
      @close="handleClose"
    />
    <TasksMobileCreateUpdate
      v-else
      entity-type="CLIENTTASK"
      @close="handleClose"
    />
  </Dialog>
</template>
