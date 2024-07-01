<script setup lang="ts">
import { useRouter } from 'vue-router';
import dayjs from 'dayjs';
import { useQuery } from 'vue-query';
import type { EntityType } from '@/types/tasks.type';

const props = defineProps<{
  todaysTaskCount?: any;
}>();

const router = useRouter();

const { currentUser, isPortalUser } = useCurrentUserData();
const { data: filterData, applyFilter } = useFilterColumns();
const selectedStatus = ref();
const { data: statusList } = useQuery(
  ['status-list'],
  () => {
    return useEntityStatusList('TASK' as EntityType, isPortalUser.value);
  },
  {
    onSuccess: (data) => {
      selectedStatus.value = data.find(task => task.name === 'To Do');
    }
  }
);

function handleClick() {
  applyFilter('Due Date', [dayjs().toDate(), dayjs().toDate()]);
  applyFilter('Assigned To', currentUser.value ? [currentUser.value?.id] : []);
  applyFilter('Type', ['TASK']);
  applyFilter('Status', [selectedStatus.value.id]);
  const tasksDueTodayFilter = useEncodeFilterData(filterData);
  router.push({
    name: 'admin-tasks',
    query: { filters: tasksDueTodayFilter }
  });
}

function formatBudgetTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours !== 1 ? ` ${hours} hrs` : `${hours} hr`} ${
    remainingMinutes > 0 ? ` ${remainingMinutes} mins` : ''
  }`;
}
</script>

<template>
  <div
    class="card overview-box text-primary p-3 widget-radius mb-0 box-shadow w-full clickable hover:shadow-5"
  >
    <div class="flex flex-column w-full gap-2">
      <div class="overview-info flex align-items-center">
        <span class="text-lg font-semibold">Tasks for Today -</span>
        <span class="text-xl font-semibold pl-2">{{ todaysTaskCount.count }} Tasks</span>
      </div>

      <div
        class="overview-info flex align-items-center justify-content-between w-full"
      >
        <div>
          <span class="text-lg font-semibold">Budget Time -</span>
          <span class="text-xl pl-2 font-semibold">{{
            formatBudgetTime(todaysTaskCount.budgetTime)
          }}</span>
        </div>
        <span
          class="text-md cursor-pointer hover:underline w- font-semibold"
          @click="handleClick"
        >See more...</span>
      </div>
    </div>
  </div>
</template>
