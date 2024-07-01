<script setup lang="ts">
import { useReports } from '@/composables/reports';

import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const { tableAttrs } = useDataTableUtils();
const { isLarge } = useCommonBreakPoints();
const { featureSubscribed } = usePermissions();
const { pluralize } = useVueFilters();
const { getOneReportList, exportToCSV, reportsTableRef } = useReports();

const { isLoading: loadingReports, data: reportsData } = useQuery(
  'team-reports-list',
  () => {
    return getOneReportList('team');
  }
);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
</script>

<template>
  <Common426
    v-if="featureSubscribed('reports', 'team_productivity') === false"
    feature="team productivity report"
  />
  <DataTable
    v-else
    ref="reportsTableRef"
    v-model:filters="filters"
    export-filename="Team Reports"
    :value="reportsData"
    :loading="loadingReports"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['userName']"
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
            placeholder="Search Team Members"
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
      header="Team Member"
      class="w-2"
      :sortable="true"
      sort-field="userName"
      :show-filter-match-modes="false"
      :filter-menu-style="{ width: '14rem' }"
      style="min-width: 14rem;"
      filter-field="userName"
      field="userName"
    >
      <template #body="{ data }">
        <span class="team-name">{{ data.userName }}</span>
      </template>
    </Column>

    <Column header="Designation" field="designation" />
    <Column header="Total Tasks" class="text-center" field="assignedTasks" />
    <Column
      header="Completed Tasks"
      class="text-center"
      field="completedTasks"
    />
    <Column
      header="Scheduled Tasks"
      class="text-center"
      field="projectedTasks"
    />
    <Column :header="`${pluralize($tConfig('CLIENT'))}`" class="text-center" field="numberOfClients" />
    <Column
      class="text-center"
      field="totalTimeSpent"
      export-header="Time Spent (hh:mm)"
    >
      <template #header>
        <div
          class="w-full text-center flex align-items-center justify-content-center"
        >
          <span>Time Spent (hh:mm)</span>
          <span
            v-tooltip.top="'Total Time Spent for Active & Completed Tasks'"
            class="pi pi-info-circle ml-1 cursor-pointer"
          />
        </div>
      </template>
      <template #body="slotProps">
        {{ slotProps.data.totalTimeSpent }}
      </template>
    </Column>
  </DataTable>
</template>
