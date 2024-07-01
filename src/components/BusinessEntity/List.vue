<script setup lang="ts">
import type { BusinessEntity } from '@/types/business-entity.type';
import { useQuery } from 'vue-query';

const emit = defineEmits<{
  (e: 'update:business-entities', data: BusinessEntity): void;
}>();

const { pluralize } = useVueFilters();
const { filters } = useDatatableFilters();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  queryKeys,
  queryFilters,
  querySortBy,
  tableRecords
} = useDataTableUtils();
const { canDo } = usePermissions();

const { isLoading, data: businessEntity } = useQuery(
  ['business-list', ...queryKeys],
  () => {
    return useBusinessEntityListV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value
    });
  },
  {
    onSuccess: (data) => {
      tableRecords.value = data;
    }
  }
);
</script>

<template>
  <DataTable
    v-bind="tableAttrs"
    v-model:filters="filters"
    :value="businessEntity?.results"
    :total-records="businessEntity?.total"
    data-key="id"
    responsive-layout="scroll"
    :loading="isLoading"
    :global-filter-fields="['name']"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-between">
        <CommonListSearchInput :placeholder="`Search ${pluralize($tConfig('BUSINESS_ENTITY'))}`" />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No record found.
      </div>
    </template>
    <template #loading>
      Loading data. Please wait.
    </template>
    <Column field="name" header="Name" class="w-2" sortable />
    <Column field="description" header="Description" />
    <Column header="Category" class="w-2">
      <template #body="slotProps">
        <span>{{
          slotProps.data.businessType === 'NON_INDIVIDUAL'
            ? 'Business'
            : 'Personal'
        }}</span>
      </template>
    </Column>
    <Column field="clients" :header="`No of ${pluralize($tConfig('CLIENT'))}`" class="w-8rem">
      <template #body="slotProps">
        <div class="text-center">
          {{ slotProps.data._count.clients }}
        </div>
      </template>
    </Column>
    <Column v-if="canDo('business_entities', 'edit')" class="text-center w-2">
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div v-if="slotProps.data.org" class="flex justify-content-center">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded mr-2"
            @click="emit('update:business-entities', slotProps.data)"
          />
          <!--
          <Button
            type="button"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="handleDelete(slotProps.data)"
          ></Button>
          -->
        </div>
        <div v-else class="text-orange-500 text-center">
          Predefined
        </div>
      </template>
    </Column>
  </DataTable>
</template>
