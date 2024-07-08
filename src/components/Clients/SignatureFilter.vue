<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import dayjs from 'dayjs';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
}>();

const router = useRouter();
const activeIndex = useRouteQuery<string>('activeIndex');
const nestedActiveIndex = useRouteQuery<string>('nestedActiveIndex');
const { isPortalUser } = useCurrentUserData();
const { allFilters } = useDataTableUtils();
const { tagsList } = useTags();
const { signatureStatuses } = useDocumentSignature();

const selectedStatus = ref<string[]>();
const selectedRequestDate = ref<string[]>();

const searchText = ref('');

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedStatus.value = allFilters.value['Doc Sign Status'].value;
  selectedRequestDate.value = allFilters.value.CreatedAt?.value?.map(
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
    selectedStatus.value,
    searchText.value,
    selectedRequestDate.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined,
          nestedActiveIndex: nestedActiveIndex.value
            ? nestedActiveIndex.value
            : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
  applyFilter('SearchText', searchText.value);
  if (selectedRequestDate.value && selectedRequestDate.value[1] === null) {
    updateDateValue(selectedRequestDate as Ref<string[]>);
    applyFilter('CreatedAt', selectedRequestDate.value);
  }
  else {
    applyFilter('CreatedAt', selectedRequestDate.value);
  }
  applyFilter(
    'Doc Sign Status',
    selectedStatus.value ? [...(selectedStatus.value as string[])] : undefined
  );

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        nestedActiveIndex: nestedActiveIndex.value
          ? nestedActiveIndex.value
          : undefined,
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedStatus.value = [];
  selectedRequestDate.value = [];
  searchText.value = '';
  applyFilters();
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Doc Sign Status')">
      <CommonMultiSelector
        v-model="selectedStatus"
        placeholder="Status"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Status')"
        :options="signatureStatuses"
        option-value="value"
      />
    </div>
    <div v-if="hasFilter('CreatedAt')">
      <Calendar
        v-model="selectedRequestDate"
        class="w-full"
        placeholder="Request Date"
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
