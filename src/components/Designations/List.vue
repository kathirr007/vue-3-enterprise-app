<script setup lang="ts">
import type { PaginatedResponse } from '@/types/common.type';
import type { Designation } from '@/types/designation.type';
const props = defineProps<{
  designations: PaginatedResponse<Designation>;
  loadingDesignations: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:designation', data: Designation): void;
  (e: 'delete:designation', data: Designation): void;
}>();

const { filters } = useDatatableFilters();
const { handlePageOrLimitChange, handleSortChange, tableAttrs, tableRecords } =
  useDataTableUtils();
const { canDo } = usePermissions();

watchEffect(() => {
  if (props?.designations) {
    tableRecords.value = props?.designations;
  }
});
</script>

<template>
  <DataTable
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
    dataKey="id"
    v-bind="tableAttrs"
    :value="designations?.results"
    :totalRecords="designations?.total"
    :loading="loadingDesignations"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
  >
    <template #header>
      <CommonListSearchInput placeholder="Search Designations" />
    </template>
    <template #empty>
      <div class="text-center">No Designation record found.</div>
    </template>
    <Column field="name" header="Name" class="w-2" sortable />
    <Column field="description" header="Job Description" />
    <Column
      field="users"
      header="No of Team Members"
      class="w-8rem text-center"
    >
      <template #body="slotProps">
        <span>{{ slotProps.data._count.users }}</span>
      </template>
    </Column>

    <Column class="text-center w-2" v-if="canDo('designations', 'edit')">
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem" v-if="slotProps.data.org">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="emit('update:designation', slotProps.data)"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="emit('delete:designation', slotProps.data)"
          />
        </div>
        <div v-else class="text-orange-500 text-center">Predefined</div>
      </template>
    </Column>
  </DataTable>
</template>
