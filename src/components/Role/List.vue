<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';

// const filters = ref({
//   global: { value: null, matchMode: FilterMatchMode.CONTAINS },
// });

const { getRoles } = useCommonListQueries();
const { isLarge } = useCommonBreakPoints();
const { filters } = useDatatableFilters();
const { queryFilters } = useDataTableUtils();
const { data: roles } = getRoles(true, queryFilters.value);
</script>

<template>
  <DataTable
    ref="roleTableRef"
    dataKey="id"
    :value="roles"
    :totalRecords="roles?.length"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
    :paginator="true"
    :rows="15"
    :alwaysShowPaginator="false"
    :page-link-size="isLarge ? 5 : 3"
    filterDisplay="menu"
  >
    <template #header>
      <!-- <div class="flex justify-content-end space-x-2.5">
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            aria-label="Search Role"
            v-model="staticSearchText"
            placeholder="Search Role"
            type="search"
          />
        </div>
      </div> -->
      <CommonListSearchInput placeholder="Search Role" />
    </template>
    <template #empty>
      <div class="text-center">No Role record found.</div>
    </template>
    <Column field="name" header="Role" class="w-3" sortable />
    <Column field="description" header="Permissions" />
  </DataTable>
</template>
