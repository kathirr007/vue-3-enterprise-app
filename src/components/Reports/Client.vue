<script setup lang="ts">
import { useReports } from '@/composables/reports';

import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

const { pluralize } = useVueFilters();
const { tableAttrs } = useDataTableUtils();
const { featureSubscribed } = usePermissions();
const { isLarge } = useCommonBreakPoints();
const { getOneReportList, exportToCSV, reportsTableRef } = useReports();

const { isLoading: loadingReports, data: reportsData } = useQuery(
  'client-reports-list',
  () => {
    return getOneReportList('client');
  }
);
</script>

<template>
  <Common426
    v-if="featureSubscribed('reports', 'client_working') === false"
    :feature="`${$tConfig('CLIENT')} working report`"
  />
  <DataTable
    v-else
    ref="reportsTableRef"
    v-model:filters="filters"
    :export-filename="`${$tConfig('CLIENT')} Reports`"
    :value="reportsData"
    :loading="loadingReports"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['clientName']"
    v-bind="{ ...tableAttrs, lazy: false }"
    filter-display="menu"
  >
    <template #header>
      <div class="flex justify-content-end space-x-2.5">
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            v-model="filters.global.value"
            aria-label="Search List"
            :placeholder="`Search ${pluralize($tConfig('CLIENT'))}`"
            type="search"
          />
        </div>

        <Button
          v-if="reportsData?.length"
          v-tooltip.top="'Download'"
          icon="pi pi-download"
          class="p-button-rounded"
          @click="exportToCSV(reportsData)"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No report found.
      </div>
    </template>
    <Column
      :header="`${$tConfig('CLIENT')} Name`"
      class="w-2"
      :sortable="true"
      sort-field="clientName"
      :show-filter-match-modes="false"
      :filter-menu-style="{ width: '14rem' }"
      style="min-width: 14rem;"
      filter-field="clientName"
      field="clientName"
    >
      <template #body="{ data }">
        <span class="team-name">{{ data.clientName }}</span>
      </template>
    </Column>

    <Column :header="`${$tConfig('BUSINESS_ENTITY')}`" field="businessEntity" />
    <Column
      header="Planned Projects"
      class="text-center"
      field="plannedProjects"
    />
    <Column
      header="Active Projects"
      class="text-center"
      field="activeProjects"
    />
    <Column
      header="Completed Projects"
      class="text-center"
      field="completedProjects"
    />
    <Column
      header="Completed Tasks"
      class="text-center"
      field="completedTasks"
    />
    <!-- <Column header="Time Spent (hh:mm)" field="timeSpent" /> -->
    <Column
      class="text-center"
      field="timeSpent"
      export-header="Time Spent (hh:mm)"
    >
      <template #header>
        <div
          class="w-full text-center flex align-items-center justify-content-center"
        >
          <span>Time Spent (hh:mm)</span>
          <span
            v-tooltip.top="
              'Total Time Spent for Completed Projects &/or Tasks.'
            "
            class="pi pi-info-circle ml-1 cursor-pointer"
          />
        </div>
      </template>
      <template #body="slotProps">
        {{ slotProps.data.timeSpent }}
      </template>
    </Column>
  </DataTable>
</template>
