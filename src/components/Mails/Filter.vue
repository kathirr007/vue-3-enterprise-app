<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const props = defineProps<{
  mailsToFilter?: string;
  disabledFilters?: string[];
  filters?: string;
  activeIndex?: number;
  hideFilters?: boolean;
  preSelectClients?: string[];
}>();
const emits = defineEmits<{
  (e: 'toggle', data: any): void;
  (e: 'current-selectedId', data: string[]): void;
}>();

const router = useRouter();
const { pluralize } = useVueFilters();
const clientListFn = () => useClientList();
const activeIndex = useRouteQuery<string>('activeIndex');
const type = useRouteQuery<string>('type');
const { allFilters } = useDataTableUtils();

const selectedClients = ref<string[]>();
defineExpose({
  handleFilters,
  resetFilters
});

onMounted(() => {
  selectedClients.value
    = allFilters.value.Clients.value !== 'null'
      ? allFilters.value.Clients.value
      : [];
});
function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function handleFilters() {
  const shouldApplyFilters = [selectedClients.value].some(
    filter => filter?.length
  );

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          type: props.mailsToFilter || type.value,
          activeIndex: activeIndex.value ? activeIndex.value : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter } = useFilterColumns();

  if (type.value === 'Others') {
    applyFilter('Clients', 'null');
  }
  else applyFilter('Clients', selectedClients.value);
  if (type.value === 'Archived') {
    applyFilter('Is Active', 'false');
  }
  else {
    applyFilter('Is Active', 'true');
  }

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        type: props.mailsToFilter || type.value,
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedClients.value = [];
  handleFilters();
}
watchEffect(() => {
  if (!selectedClients.value) {
    selectedClients.value = props.preSelectClients;
  }
  emits('current-selectedId', selectedClients.value as string[]);
});
watch(
  () => props.preSelectClients,
  (value) => {
    selectedClients.value = props.preSelectClients;
    emits('current-selectedId', selectedClients.value as string[]);
  }
);
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <div v-if="hasFilter('Clients')">
      <CommonMultiSelector
        v-model="selectedClients"
        :max-selected-labels="1"
        :placeholder="`Select ${pluralize($tConfig('CLIENT'))}`"
        :selected-items-label="getSelectedItemsLabel(`${pluralize($tConfig('CLIENT'))}`)"
        :query-fn="(clientListFn as unknown as () => any[])"
        query-key="clients-list"
      />
    </div>

    <Button
      icon="pi pi-check"
      class="w-full sm:w-auto p-2"
      aria-label="apply"
      @click="handleFilters"
    />
    <Button
      v-if="selectedClients?.length && filters"
      style=" width: 2.5rem;height: 2.5rem;"
      :icon="filters ? 'pi pi-filter-slash' : 'pi pi-filter'"
      class="p-button-sm myStyle p-button-rounded"
      aria-label="Filter"
      :class="[{ 'p-button-danger': filters && selectedClients.length }]"
      @click="$emit('toggle', !!filters)"
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
