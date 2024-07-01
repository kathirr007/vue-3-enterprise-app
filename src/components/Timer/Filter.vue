<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import { useQuery } from 'vue-query';
import type { Task } from '@/types/tasks.type';
import type { MetaObj } from '@/types/common.type';
import type { Project } from '@/types/project.type';
import dayjs from 'dayjs';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
}>();

const router = useRouter();
const { pluralize } = useVueFilters();
const { metaFilter, isFalsy } = useUtilityFns();
const clientListFn = () => useClientList();
const usersListFn = () => useUsersListV2({ isUserNameMe: true });
const projectsListFn = () => useProjectListV2({});
function taskListFn() {
  return useTasksListV2({ entityType: 'TASK', status: 'CLOSED' });
}

const activeIndex = useRouteQuery<string>('activeIndex');
const { allFilters } = useDataTableUtils();

const selectedClients = ref<string[]>();
const selectedProjectId = ref<string[]>();
const selectedTaskId = ref<string[]>();
const selectedBilling = ref<string>();
const selectedUserId = ref<string[]>();
const selectedCreatedAt = ref<string[]>();
const filteringProjects = ref(false);

const isBillingOptions = ref([
  { name: 'Yes', value: 'true' },
  { name: 'No', value: 'false' }
]);

defineExpose({
  applyFilters,
  resetFilters
});

const { data: tasksList, isLoading: loadingTasks } = useQuery(
  ['tasks-list'],
  () => {
    return useTasksListV2({ entityType: 'TASK' });
  }
);

const { data: projectsList, isLoading: loadingProjects } = useQuery(
  ['projects-list'],
  () => {
    return useProjectListV2({});
  }
);

const projectsListOptions = computed(() => {
  let allProjects: any[] = [];
  if (projectsList.value) {
    allProjects = projectsList.value.results;
    if (!isFalsy(selectedClients.value)) {
      filteringProjects.value = true;
      allProjects = allProjects.filter(
        (project: Project) =>
          selectedClients.value?.includes(project.client?.id)
      );
      filteringProjects.value = false;
      return allProjects;
    }
    return allProjects;
  }
  return [];
});

const tasksListOptions = computed(() => {
  let allTasks: any[] = [];
  if (tasksList.value) {
    allTasks = tasksList.value.results.map((task: Task) => {
      return {
        ...task,
        id: task.id,
        title: metaFilter(task.meta as MetaObj[], 'title')
      };
    });
    if (!isFalsy(selectedClients.value)) {
      allTasks = allTasks.filter(
        (task: Task) =>
          selectedClients.value?.includes(task.client?.id as string)
      );
    }
    if (!isFalsy(selectedProjectId.value)) {
      allTasks = allTasks.filter(
        (task: Task) =>
          selectedProjectId.value?.includes(task.project?.id as string)
      );
    }
    return allTasks;
  }
  return [];
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function applyFilters() {
  const shouldApplyFilters = [
    selectedClients.value,
    selectedProjectId.value,
    selectedTaskId.value,
    selectedBilling.value,
    selectedUserId.value,
    selectedCreatedAt.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
  applyFilter(
    'Client',
    selectedClients.value ? [...(selectedClients.value as string[])] : undefined
  );
  applyFilter(
    'Project Name',
    selectedProjectId.value
      ? [...(selectedProjectId.value as string[])]
      : undefined
  );
  applyFilter(
    'Task',
    selectedTaskId.value ? [...(selectedTaskId.value as string[])] : undefined
  );
  applyFilter('Is Billing Enabled', selectedBilling.value);
  applyFilter(
    'Assigned To',
    selectedUserId.value ? [...(selectedUserId.value as string[])] : undefined
  );
  applyFilter('CreatedAt', selectedCreatedAt.value);
  if (selectedCreatedAt.value && selectedCreatedAt.value[1] === null) {
    updateDateValue(selectedCreatedAt as Ref<string[]>);
    applyFilter('CreatedAt', selectedCreatedAt.value);
  }
  else {
    applyFilter('CreatedAt', selectedCreatedAt.value);
  }
  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedClients.value = [];
  selectedProjectId.value = [];
  selectedTaskId.value = [];
  selectedUserId.value = [];
  selectedCreatedAt.value = [];
  selectedBilling.value = undefined;
  applyFilters();
}

watchEffect(() => {
  selectedClients.value = allFilters.value.Client.value;
  selectedProjectId.value = allFilters.value['Project Name']?.value;
  selectedTaskId.value = allFilters.value.Task.value;
  selectedBilling.value = allFilters.value['Is Billing Enabled']?.value;
  selectedUserId.value = allFilters.value['Assigned To']?.value;
  selectedCreatedAt.value = allFilters.value.CreatedAt?.value?.map(
    (date: string) => dayjs(date).toDate()
  );
});
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Client')">
      <CommonMultiSelector
        v-model="selectedClients"
        :max-selected-labels="1"
        :placeholder="`${pluralize($tConfig('CLIENT'))}`"
        :selected-items-label="getSelectedItemsLabel(`${pluralize($tConfig('CLIENT'))}`)"
        :query-fn="(clientListFn as unknown as () => any[])"
        query-key="clients-list"
      />
    </div>
    <div v-if="hasFilter('Project Name')">
      <CommonMultiSelector
        v-model="selectedProjectId"
        placeholder="Project Name"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Projects')"
        :options="projectsListOptions"
        :is-loading="loadingProjects || filteringProjects"
      />
    </div>
    <div v-if="hasFilter('Assigned To')">
      <CommonMultiSelector
        v-model="selectedUserId"
        placeholder="Assigned To"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Assignees')"
        :query-fn="usersListFn as unknown as () => any[]"
        query-key="users-list"
      />
    </div>
    <div v-if="hasFilter('Task')">
      <MultiSelect
        v-model="selectedTaskId"
        :options="tasksListOptions"
        option-label="title"
        option-value="id"
        data-key="id"
        :loading="loadingTasks"
        clearable
        filter
        placeholder="Task"
        :selected-items-label="getSelectedItemsLabel('Task')"
      />
    </div>
    <div v-if="hasFilter('Is Billing Enabled')">
      <Dropdown
        v-model="selectedBilling"
        placeholder="Billable"
        class="w-full"
        :options="isBillingOptions"
        option-label="name"
        option-value="value"
        show-clear
      />
    </div>
    <div v-if="hasFilter('CreatedAt')">
      <Calendar
        v-model="selectedCreatedAt"
        class="w-full"
        placeholder="Select Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        :manual-input="false"
        show-button-bar
      />
    </div>
    <Button
      label="Apply"
      class="w-full sm:w-auto"
      @click="applyFilters"
    />
  </div>
</template>
