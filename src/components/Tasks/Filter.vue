<script setup lang="ts">
import type { TagType } from '@/types/tags.type';
import type { EntityType } from '@/types/tasks.type';
import { useRouteQuery } from '@vueuse/router';
import dayjs from 'dayjs';
import type { Ref } from 'vue';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  entityType?: EntityType;
  statusId?: string;
  clientId?: string;
  projectId?: string;
  userId?: string;
  showStatusFilter?: boolean;
}>();
const router = useRouter();
const route = useRoute();

const { isPortalUser } = useCurrentUserData();
const clientListFn = () => useClientList();
const { tagsList } = useTags();
function tagListFn() {
  return tagsList(props.entityType as TagType, isPortalUser.value);
}
function statusListFn() {
  return useEntityStatusList(props.entityType as EntityType, isPortalUser.value);
}
function priorityListFn() {
  return useEntityPriorityList(props.entityType as EntityType, isPortalUser.value);
}
const usersListFn = () => useUsersListV2({ isUserNameMe: true });
const projectsListFn = () => useProjectListV2({});
const activeIndex = useRouteQuery<string>('activeIndex');
const { allFilters } = useDataTableUtils();
const { isLarge } = useCommonBreakPoints();
const { removeDuplicatesFromArray } = useUtilityFns();
const { pluralize } = useVueFilters();

const selectedClients = ref<string[]>();
const selectedPriority = ref<string[]>();
const selectedCreatedBy = ref<string[]>();
const selectedAssignedTo = ref<string[]>();
const selectedDueDate = ref<string[]>();
const selectedService = ref<string[]>();
const selectedProjectId = ref<string[]>();
const selectedTags = ref<string[]>();
const selectedStatusId = ref<string[]>();

const searchText = ref('');

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedClients.value = allFilters.value.Client.value;
  selectedPriority.value = allFilters.value.Priority.value;
  selectedCreatedBy.value = allFilters.value['Reported By']?.value;
  selectedAssignedTo.value = allFilters.value['Assigned To']?.value;
  selectedProjectId.value = allFilters.value['Project Name']?.value;
  selectedTags.value = allFilters.value.Tags?.value;
  selectedStatusId.value = allFilters.value.Status.value;
  selectedDueDate.value = allFilters.value['Due Date']?.value?.map(
    (date: string) => dayjs(date).toDate()
  );
  if (allFilters.value['LessThan Date'].value) {
    selectedDueDate.value = allFilters.value['LessThan Date']?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  selectedService.value = allFilters.value.Services.value;
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
    selectedPriority.value,
    selectedAssignedTo.value,
    selectedDueDate.value,
    searchText.value,
    selectedProjectId.value,
    selectedTags.value,
    selectedStatusId.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    const { filters, ...queryParams } = route.query;
    if (props.filters) {
      router.push({
        query: {
          filters:
            !props.showStatusFilter && isLarge.value ? filters : undefined,
          ...queryParams,
          activeIndex: activeIndex.value ? activeIndex.value : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
  applyFilter('Type', props.entityType ? [props.entityType] : ['TASK']);

  if (props.clientId) {
    applyFilter('Client', props.clientId ? [props.clientId] : undefined);
  }
  else {
    applyFilter(
      'Client',
      selectedClients.value
        ? [...(selectedClients.value as string[])]
        : undefined
    );
  }
  applyFilter('SearchText', searchText.value);

  applyFilter(
    'Priority',
    selectedPriority.value
      ? [...(selectedPriority.value as string[])]
      : undefined
  );
  applyFilter(
    'Status',
    selectedStatusId.value
      ? [...(selectedStatusId.value as string[])]
      : undefined
  );
  applyFilter(
    'Reported By',
    selectedCreatedBy.value
      ? [...(selectedCreatedBy.value as string[])]
      : undefined
  );
  if (props.userId) {
    applyFilter('Assigned To', props.userId ? [props.userId] : undefined);
  }
  else {
    if (route.name === 'admin-tasks') {
      applyFilter('AssignedBy', undefined);
      applyFilter(
        'Assigned To',
        currentUser.value
          ? selectedAssignedTo.value
            ? removeDuplicatesFromArray([
              ...(selectedAssignedTo.value as string[]),
              currentUser.value?.id
            ])
            : [currentUser.value?.id]
          : []
      );
    }
    else if (route.name === 'admin-tasks-assignments') {
      applyFilter(
        'Assigned To',
        selectedAssignedTo.value
          ? [...(selectedAssignedTo.value as string[])]
          : undefined
      );
      applyFilter(
        'AssignedBy',
        currentUser.value ? [currentUser.value?.id] : []
      );
    }
    else {
      applyFilter(
        'Assigned To',
        selectedAssignedTo.value
          ? [...(selectedAssignedTo.value as string[])]
          : undefined
      );
    }
  }

  applyFilter(
    'Tags',
    selectedTags.value ? [...(selectedTags.value as string[])] : undefined
  );
  if (selectedDueDate.value && selectedDueDate.value[1] === null) {
    updateDateValue(selectedDueDate as Ref<string[]>);
    applyFilter('Due Date', selectedDueDate.value);
  }
  else {
    applyFilter('Due Date', selectedDueDate.value);
  }
  applyFilter(
    'Services',
    selectedService.value ? [...(selectedService.value as string[])] : undefined
  );
  if (props.projectId) {
    applyFilter(
      'Project Name',
      props.projectId ? [props.projectId] : undefined
    );
  }
  else {
    applyFilter(
      'Project Name',
      selectedProjectId.value
        ? [...(selectedProjectId.value as string[])]
        : undefined
    );
  }

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        ...route.query,
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedClients.value = [];
  selectedPriority.value = [];
  selectedCreatedBy.value = [];
  selectedDueDate.value = [];
  selectedService.value = [];
  selectedProjectId.value = [];
  selectedTags.value = [];
  searchText.value = '';
  if (route.name !== 'admin-tasks') {
    selectedAssignedTo.value = [];
    // keysToExclude.value.push('Assigned To');
  }
  if (props.showStatusFilter) {
    selectedStatusId.value = [];
  }

  applyFilters();
}
watchEffect(() => {
  if (props.statusId && !props.showStatusFilter) {
    selectedStatusId.value = [props.statusId as any];
  }
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
        :query-fn="clientListFn as unknown as () => any[]"
        query-key="clients-list"
      />
    </div>
    <div v-if="hasFilter('Project Name')">
      <CommonMultiSelector
        v-model="selectedProjectId"
        placeholder="Project Name"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Projects')"
        :query-fn="projectsListFn as unknown as () => any[]"
        query-key="projects-list"
      />
    </div>
    <div v-if="showStatusFilter">
      <CommonMultiSelector
        v-model="selectedStatusId"
        placeholder="Status"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Status')"
        :query-fn="statusListFn as unknown as () => any[]"
        query-key="status-list"
      />
    </div>
    <div v-if="hasFilter('Priority')">
      <CommonMultiSelector
        v-model="selectedPriority"
        placeholder="Priority"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Priority')"
        :query-fn="priorityListFn as unknown as () => any[]"
        query-key="priority-list"
      />
    </div>
    <div v-if="hasFilter('Assigned To')">
      <CommonMultiSelector
        v-model="selectedAssignedTo"
        placeholder="Assigned To"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Assignees')"
        :query-fn="usersListFn as unknown as () => any[]"
        query-key="users-list"
      />
    </div>
    <div v-if="hasFilter('Tag')">
      <CommonMultiSelector
        v-model="selectedTags"
        placeholder="Tag"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Tag')"
        :query-fn="tagListFn as unknown as () => any[]"
        query-key="tags-list"
      />
    </div>
    <div v-if="hasFilter('Due Date')">
      <Calendar
        v-model="selectedDueDate"
        class="w-full"
        placeholder="Due Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
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

<style lang="scss" scoped>
.scroll-wrapper {
  overflow: auto hidden;
  overscroll-behavior: contain auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
</style>
