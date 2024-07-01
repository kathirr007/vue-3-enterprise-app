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
  'client-reports-list',
  () => {
    return getOneReportList('clientRoi');
  }
);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
</script>

<template>
  <Common426 v-if="featureSubscribed('reports', 'roi') === false" :feature="`${$tConfig('CLIENT').toLowerCase()} roi`" />
  <DataTable
    v-else
    ref="reportsTableRef"
    v-model:filters="filters"
    :export-filename="`${$tConfig('CLIENT')} ROI Reports`"
    :value="reportsData"
    :loading="loadingReports"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['clientName']"
    v-bind="{ ...tableAttrs, lazy: false }"
    filter-display="menu"
    :virtual-scroller-options="{ itemSize: 30 }"
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
      :header="`${$tConfig('CLIENT')}`"
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

    <Column
      header="Total No Project"
      class="text-center"
      field="totalNoOfProjects"
    />
    <Column
      header="Total Time Spent (hh:mm)"
      class="text-center"
      field="totalTimeSpent"
    />
    <!-- <Column header="Total Salary Cost ($)" field="totalSalaryCost" /> -->
    <Column
      class="text-center"
      export-header="Total Salary Cost ($)"
      field="totalSalaryCost"
    >
      <template #header>
        <div
          class="w-full text-center flex align-items-center justify-content-center"
        >
          <span>Total Salary Cost ($)</span>
          <span
            v-tooltip.top="
              `Prorated salaries of all Team Members involved in the ${$tConfig('CLIENT')}'s Projects`
            "
            class="pi pi-info-circle ml-1 cursor-pointer"
          />
        </div>
      </template>
      <template #body="slotProps">
        {{
          slotProps.data.totalSalaryCost
            ? slotProps.data.totalSalaryCost
            : '0.00'
        }}
      </template>
    </Column>
    <Column
      header="Effective Billable ($)"
      class="text-center"
      field="totalBillable"
    />
  </DataTable>
</template>
