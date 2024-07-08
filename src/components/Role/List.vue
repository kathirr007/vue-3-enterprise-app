<script setup lang="ts">
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
    v-model:filters="filters"
    data-key="id"
    :value="roles"
    :total-records="roles?.length"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    :paginator="true"
    :rows="15"
    :always-show-paginator="false"
    :page-link-size="isLarge ? 5 : 3"
    filter-display="menu"
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
      <div class="text-center">
        No Role record found.
      </div>
    </template>
    <Column field="name" header="Role" class="w-3" sortable />
    <Column field="description" header="Permissions" />
  </DataTable>
</template>
