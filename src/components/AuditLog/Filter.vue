<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import { useQuery } from 'vue-query';
import dayjs from 'dayjs';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  activeIndex?: number;
}>();
const router = useRouter();
const { getOne } = useAuditLog();

const queryActiveIndex = useRouteQuery('activeIndex');
const { allFilters } = useDataTableUtils();

const selectedCreatedBy = ref<string[]>();
const selectedResource = ref<string[]>();
const selectedEvent = ref<string[]>();

defineExpose({
  applyFilters,
  resetFilters
});

const { data: auditLogData, isLoading } = useQuery(
  ['audit-log-filter-list'],
  () => {
    return getOne();
  }
);
const resourceData = computed(() => {
  if (auditLogData.value?.resource) {
    const result = auditLogData.value?.resource.map((name: string) => ({
      name,
      value: name
    }));
    return result;
  }
});

const eventData = computed(() => {
  if (auditLogData.value?.event) {
    const result = auditLogData.value?.event.map((name: string) => ({
      name,
      value: name
    }));
    return result;
  }
});

watchEffect(() => {
  selectedResource.value = allFilters.value.resource.value;
  selectedEvent.value = allFilters.value.Event.value;
  selectedCreatedBy.value = allFilters.value.CreatedAt?.value?.map(
    (date: string) => dayjs(date).toDate()
  );
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}
function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function applyFilters() {
  const shouldApplyFilters = [
    selectedResource.value,
    selectedEvent.value,
    selectedCreatedBy.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: queryActiveIndex.value
            ? queryActiveIndex.value
            : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
  applyFilter(
    'resource',
    selectedResource.value
      ? [...(selectedResource.value as string[])]
      : undefined
  );
  applyFilter(
    'Event',
    selectedEvent.value ? [...(selectedEvent.value as string[])] : undefined
  );
  applyFilter('CreatedAt', selectedCreatedBy.value);
  if (selectedCreatedBy.value && selectedCreatedBy.value[1] === null) {
    updateDateValue(selectedCreatedBy as Ref<string[]>);
    applyFilter('CreatedAt', selectedCreatedBy.value);
  }
  else {
    applyFilter('CreatedAt', selectedCreatedBy.value);
  }

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: queryActiveIndex.value
          ? queryActiveIndex.value
          : undefined,
        filters: preparedFilters
      }
    });
  }
}
function resetFilters() {
  selectedResource.value = [];
  selectedEvent.value = [];
  selectedCreatedBy.value = [];
  applyFilters();
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('CreatedAt')">
      <Calendar
        v-model="selectedCreatedBy"
        class="w-full"
        placeholder="Select Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        :manual-input="false"
        show-button-bar
      />
    </div>
    <div v-if="hasFilter('resource')">
      <MultiSelect
        v-model="selectedResource"
        :options="resourceData"
        option-label="name"
        option-value="value"
        placeholder="Select Resource"
        :max-selected-labels="1"
        clearable
        :loading="isLoading"
        filter
        data-key="id"
        :selected-items-label="getSelectedItemsLabel('resource')"
      />
    </div>
    <div v-if="hasFilter('Event')">
      <MultiSelect
        v-model="selectedEvent"
        :options="eventData"
        option-label="name"
        option-value="value"
        placeholder="Select Event"
        :max-selected-labels="1"
        clearable
        :loading="isLoading"
        filter
        data-key="id"
        :selected-items-label="getSelectedItemsLabel('Event')"
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
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior: contain auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
</style>
