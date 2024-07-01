<script setup lang="ts">
import { useReports } from '@/composables/reports';
import type { User } from '@/types/teams.type';

import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const selectedTeam = ref<User>();
const { featureSubscribed } = usePermissions();
const { tableAttrs } = useDataTableUtils();
const { getTeamTrendReportList, exportToCSV, reportsTableRef } = useReports();
const { getUsers } = useCommonListQueries();
const { fullName } = useVueFilters();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);

const { isLoading: loadingReports, data: reportsTrendData } = useQuery(
  ['team-trend-reports-list', selectedTeam],
  () => {
    if (selectedTeam.value)
      return getTeamTrendReportList(selectedTeam.value.id as string);
  }
);

const { data: usersList } = getUsers(true, true, initialFilters);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
</script>

<template>
  <Common426
    v-if="featureSubscribed('reports', 'trendline') === false"
    feature="team trendline"
  />
  <div v-else>
    <div class="flex mb-2 px-2 py-3">
      <Dropdown
        v-model="selectedTeam"
        class="w-20rem"
        option-label="name"
        :options="usersList"
        placeholder="Select a user"
        filter
        show-clear
      >
        <template #value="slotProps">
          <div v-if="slotProps.value" class="country-item country-item-value">
            <div>{{ slotProps.value.name }}</div>
          </div>
          <span v-else>
            {{ slotProps.placeholder }}
          </span>
        </template>
      </Dropdown>
    </div>
    <div v-if="selectedTeam">
      <DataTable
        ref="reportsTableRef"
        v-model:filters="filters"
        :export-filename="`Team Trend Line Report - ${fullName(selectedTeam)}`"
        :value="reportsTrendData"
        :loading="loadingReports"
        responsive-layout="scroll"
        breakpoint="768px"
        :global-filter-fields="['']"
        v-bind="{ ...tableAttrs, lazy: false }"
        filter-display="menu"
      >
        <!-- <template #header>
        <div class="flex justify-content-end">
          <div class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText
              aria-label="Search"
              v-model="filters['global'].value"
              placeholder="Search "
              type="search"
            />
          </div>
        </div>
      </template> -->
        <template #header>
          <div class="flex justify-content-end space-x-2.5">
            <div style="text-align: left;">
              <Button
                v-if="reportsTrendData?.length"
                v-tooltip.top="'Download'"
                icon="pi pi-download"
                class="p-button-rounded"
                @click="exportToCSV(reportsTrendData)"
              />
            </div>
          </div>
        </template>
        <template #empty>
          <div class="text-center">
            No report found.
          </div>
        </template>
        <!-- <Column
        header="Month "
        class="w-2"
        :sortable="true"
        sortField="month"
        :showFilterMatchModes="false"
        :filterMenuStyle="{ width: '14rem' }"
        style="min-width: 14rem"
        filterField="month"
      >
        <template #body="{ data }">
          <span class="client-month">{{ data.month }}</span>
        </template>
      </Column> -->
        <Column header="Month" field="month" />
        <Column
          header="Total No Project"
          class="text-center"
          field="totalNoOfProjects"
        />
        <Column
          header="Total Task"
          class="text-center"
          field="totalNoOfTasks"
        />
        <!-- <Column header="Total Time Spent (hh:mm)" field="totalTimeSpent" /> -->
        <Column
          export-header="Time Spent (hh:mm)"
          field="totalTimeSpent"
          class="text-center"
        >
          <template #header>
            <div
              class="w-full text-center flex align-items-center justify-content-center"
            >
              <span>Time Spent (hh:mm)</span>
              <span
                v-tooltip.top="'Total Time Spent for Total Tasks'"
                class="pi pi-info-circle ml-1 cursor-pointer"
              />
            </div>
          </template>
          <template #body="slotProps">
            {{ slotProps.data.totalTimeSpent }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
