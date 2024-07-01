<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const router = useRouter();

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  activeIndex?: number;
  isContractualTeams?: boolean;
}>();

const designationsListFn = () => useDesignationListV2({});
const { data: filterData, applyFilter } = useFilterColumns();
/* if (props.isContractualTeams) {
  applyFilter('Type', ['OUTSOURCED_ORG_USER']);
} else {
} */
applyFilter('Type', ['ORG_USER']);

const preparedFilters = useEncodeFilterData(filterData);
const usersListFn = () =>
  useUsersListV2({ isUserNameMe: true, filters: preparedFilters });
const activeIndex = useRouteQuery<string>('activeIndex');
const { allFilters } = useDataTableUtils();

const selectedDesignation = ref<string[]>();
const selectedReportingManager = ref<string[]>();
const searchText = ref('');

defineExpose({
  searchText,
  applyFilters,
  resetFilters,
});

watchEffect(() => {
  selectedDesignation.value = allFilters.value.Designation.value;
  selectedReportingManager.value = allFilters.value['Reporting Manager']?.value;
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return '{0} ' + itemName + ' selected';
}

function applyFilters() {
  const shouldApplyFilters = [
    selectedDesignation.value,
    selectedReportingManager.value,
    searchText.value,
  ].some((filter) => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined,
        },
      });
    }
    return;
  }

  const { data: filterData, applyFilter } = useFilterColumns();
  applyFilter(
    'Designation',
    selectedDesignation.value
      ? [...(selectedDesignation.value as string[])]
      : []
  );
  applyFilter('SearchText', searchText.value);
  applyFilter(
    'Reporting Manager',
    selectedReportingManager.value
      ? [...(selectedReportingManager.value as string[])]
      : undefined
  );

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters,
      },
    });
  }
}

function resetFilters() {
  selectedDesignation.value = [];
  selectedReportingManager.value = [];
  searchText.value = '';
  applyFilters();
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Client')">
      <CommonMultiSelector
        v-model="selectedDesignation"
        :maxSelectedLabels="1"
        placeholder="Designations"
        :selectedItemsLabel="getSelectedItemsLabel('Designations')"
        :queryFn="designationsListFn as unknown as () => any[]"
        :queryKey="'designations-list'"
      ></CommonMultiSelector>
    </div>
    <div v-if="hasFilter('Reporting Manager')">
      <CommonMultiSelector
        v-model="selectedReportingManager"
        placeholder="Reporting Manager"
        :maxSelectedLabels="1"
        :selectedItemsLabel="getSelectedItemsLabel('Reporting Managers')"
        :queryFn="usersListFn as unknown as () => any[]"
        :queryKey="'users-list'"
      ></CommonMultiSelector>
    </div>

    <Button
      label="Apply"
      class="w-full sm:w-auto"
      @click="applyFilters"
    ></Button>
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
