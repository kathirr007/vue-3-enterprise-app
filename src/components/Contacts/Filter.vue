<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  activeIndex?: number;
}>();
const emit = defineEmits<{
  (e: 'apply-filter', clientId: string): void;
}>();
const router = useRouter();
const route = useRoute();

const clientListFn = () => useClientList();
const activeIndexQuery = useRouteQuery<string>('activeIndex');
const { allFilters } = useDataTableUtils();
const clientIdQuery = ref(route.query.clientId);

const selectedClients = ref<string[]>();
const searchText = ref('');

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedClients.value = allFilters.value.Client.value;
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function applyFilters() {
  const shouldApplyFilters = [selectedClients.value, searchText.value].some(
    filter => filter?.length
  );

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndexQuery.value
            ? activeIndexQuery.value
            : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter } = useFilterColumns();
  applyFilter(
    'Client',
    selectedClients.value ? [...(selectedClients.value as string[])] : undefined
  );
  applyFilter('SearchText', searchText.value);

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedClients.value = [];
  searchText.value = '';
  applyFilters();
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Client')">
      <CommonMultiSelector
        v-model="selectedClients"
        :max-selected-labels="1"
        :placeholder="`${$tConfig('CLIENT')}s`"
        :selected-items-label="getSelectedItemsLabel(`${$tConfig('CLIENT')}s`)"
        :selection-limit="1"
        :query-fn="(clientListFn as unknown as () => any[])"
        query-key="clients-list"
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
