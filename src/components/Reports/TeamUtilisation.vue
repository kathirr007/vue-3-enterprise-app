<script setup lang="ts">
import { useReports } from '@/composables/reports';

import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const { featureSubscribed } = usePermissions();
const { tableAttrs } = useDataTableUtils();
const { isLarge } = useCommonBreakPoints();
const { getOneReportList, exportToCSV, reportsTableRef } = useReports();

const { isLoading: loadingReports, data: reportsData } = useQuery(
  'client-reports-list',
  () => {
    return getOneReportList('teamUtilization');
  }
);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
</script>

<template>
  <Common426
    v-if="featureSubscribed('reports', 'utilization') === false"
    feature="team utilization"
  />
  <DataTable
    v-else
    ref="reportsTableRef"
    v-model:filters="filters"
    export-filename="Team Utilization Reports"
    :value="reportsData"
    :loading="loadingReports"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['teamMemberName']"
    v-bind="{ ...tableAttrs, lazy: false }"
    filter-display="menu"
  >
    <template #header>
      <div class="flex justify-content-end space-x-2.5">
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            v-model="filters.global.value"
            aria-label="Search Member Name"
            placeholder="Search Member Names"
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
      <div class="flex justify-content-end" />
    </template>
    <template #empty>
      <div class="text-center">
        No report found.
      </div>
    </template>
    <Column
      header="Team Member Name "
      class="w-2"
      :sortable="true"
      sort-field="teamMemberName"
      :show-filter-match-modes="false"
      :filter-menu-style="{ width: '14rem' }"
      style="min-width: 14rem;"
      column="teamMemberName"
      filter-field="teamMemberName"
      field="teamMemberName"
    >
      <template #body="{ data }">
        <span class="team-name">{{ data.teamMemberName }}</span>
      </template>
    </Column>

    <!-- <Column header="Total Working Days" field="totalDays" /> -->
    <Column
      class="text-center"
      field="totalDays"
      export-header="Total Working Days"
    >
      <template #header>
        <div
          class="w-full text-center flex align-items-center justify-content-center"
        >
          <span>Total Working Days</span>
          <span
            v-tooltip.top="'Working week (Mon-Fri)'"
            class="pi pi-info-circle ml-1 cursor-pointer"
          />
        </div>
      </template>
      <template #body="slotProps">
        {{ slotProps.data.totalDays }}
      </template>
    </Column>
    <!-- <Column
      header="Total Available Monthly Work hours"
      field="monthlyManHours"
    /> -->
    <Column
      class="text-center"
      field="monthlyManHours"
      export-header="Total Available Monthly Work hours"
    >
      <template #header>
        <div
          class="w-full text-center flex align-items-center justify-content-center"
        >
          <span>Total Available Monthly Work hours</span>
          <span
            v-tooltip.top="
              'Calculated on 8 hr. Workday x No. Of total working days in a month.'
            "
            class="pi pi-info-circle ml-1 cursor-pointer"
          />
        </div>
      </template>
      <template #body="slotProps">
        {{ slotProps.data.monthlyManHours }}
      </template>
    </Column>
    <Column header="Time Spent (hh:mm)" class="text-center" field="timeSpent" />
    <Column
      header="Utilization (%)"
      class="text-center"
      field="totalUtilisation"
    />
  </DataTable>
</template>
