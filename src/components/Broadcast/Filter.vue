<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import dayjs from 'dayjs';
import type { Ref } from 'vue';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  activeIndex?: number;
}>();

const router = useRouter();

const activeIndex = useRouteQuery<string>('activeIndex');
const { allFilters } = useDataTableUtils();
const broadcastTo = inject('broadcastTo');
const selectedDateRange = ref<string[]>();

const searchText = ref('');

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedDateRange.value = allFilters.value['Date Range'].value?.map(
    (date: string) => dayjs(date).toDate()
  );
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function applyFilters() {
  const shouldApplyFilters = [selectedDateRange.value, searchText.value].some(
    filter => filter?.length
  );

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
  applyFilter('Broadcast To', broadcastTo === 'team' ? [true] : [false]);
  applyFilter('SearchText', searchText.value);
  if (selectedDateRange.value && selectedDateRange.value[1] === null) {
    updateDateValue(selectedDateRange as Ref<string[]>);
    applyFilter('Date Range', selectedDateRange.value);
  }
  else {
    applyFilter('Date Range', selectedDateRange.value);
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
  selectedDateRange.value = [];
  searchText.value = '';
  applyFilters();
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Date Range')">
      <Calendar
        v-model="selectedDateRange"
        class="w-full"
        placeholder="Date Range"
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
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior: contain auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
</style>
