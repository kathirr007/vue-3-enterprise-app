<script setup lang="ts">
import type { Webform, WebformType } from '@/types/webforms.type';
import { useQuery } from 'vue-query';

const props = withDefaults(
  defineProps<{
    webformType: WebformType;
    // webformsList: PaginatedResponse<Webform>;
    // loadingWebforms: boolean;
  }>(),
  {
    // webformsList: () => ({ results: [], total: 0 }),
  }
);

const emit = defineEmits<{
  (e: 'update:webform', data: Webform): void;
  (e: 'delete:webform', data: Webform): void;
}>();

const route = useRoute();
const { webformType: webformTypeProp } = toRefs(props);
const { filters } = useDatatableFilters();
const { canDo, canDoSome } = usePermissions();
const {
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  tableRecords,
  queryFilters,
  queryKeys,
  querySortBy,
  currentLimit,
  currentPage
} = useDataTableUtils();
const { getAll } = useWebformTemplates();

const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  applyFilter('Type', [webformTypeProp.value]);

  const initialFiltersString = useEncodeFilterData(filterData);
  return initialFiltersString;
});

const {
  isLoading: loadingWebforms,
  isFetching: fetchingWebforms,
  data: webformsList
} = useQuery(['webforms-templates-list', ...queryKeys, webformTypeProp], () => {
  return getAll({
    page: currentPage.value,
    limit: currentLimit.value,
    filters: queryFilters.value ? queryFilters.value : initialFilters.value,
    sortBy: querySortBy.value
  });
});

/* watchEffect(() => {
  if (props.webformsList) {
    tableRecords.value = props.webformsList;
  }
}); */
</script>

<template>
  <DataTable
    v-bind="tableAttrs"
    v-model:filters="filters"
    :value="webformsList?.results"
    :total-records="webformsList?.total"
    :loading="loadingWebforms || fetchingWebforms"
    data-key="id"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-between">
        <CommonListSearchInput placeholder="Search Templates" />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No template found.
      </div>
    </template>
    <Column field="name" header="Name" class="w-3">
      <template #body="{ data }">
        <router-link
          data-if="!canDo('webforms', 'single')"
          :to="{
            name: 'admin-webform-templates-id',
            params: { id: data.id },
            query: { ...route.query, webformType },
          }"
          class="flex align-items-center font-medium text-gray-900 cursor-pointer hover:text-gray-600"
        >
          <span class="user-name">{{ data.name }}</span>
        </router-link>
      </template>
    </Column>
    <!-- <Column field="name" header="Name" class="w-2" :sortable="true" /> -->
    <Column field="description" header="Description" />
    <Column
      class="text-center w-2"
      data-v-if="canDoSome('webforms', ['delete', 'edit'])"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem">
          <Button
            data-v-if="canDo('webforms', 'edit')"
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="emit('update:webform', slotProps.data)"
          />
          <Button
            data-v-if="canDo('webforms', 'delete')"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="emit('delete:webform', slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
