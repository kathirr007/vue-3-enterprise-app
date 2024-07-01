<script setup lang="ts">
import router from '@/router';
import { useReports } from '@/composables/reports';

import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const { tableAttrs } = useDataTableUtils();
const { isLarge } = useCommonBreakPoints();
const { getAllReports } = useReports();
const { canDo } = usePermissions();
const { replaceClient } = useVueFilters();

const { isLoading: loadingReports, data: reportsData } = useQuery(
  'reports-list',
  () => {
    return getAllReports();
  }
);

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.IN }
});
function goToReportDetail(routes: string) {
  if (canDo('reports', 'single')) {
    router.push({
      name: 'admin-reports-type',
      params: { type: routes }
    });
  }
}
</script>

<template>
  <div v-if="(reportsData?.length as number) > 0" class="display-grid">
    <!-- <div
      class="overview-box mb-0 col-12 md:col-4"

    >
  </div> -->
    <div
      v-for="(report, index) in reportsData"
      :key="index"
      class="card box-shadow reports-card h-full relative"
    >
      <h4 class="text-primary text-2xl">
        {{ replaceClient(report.name) }}
      </h4>

      <p>{{ replaceClient(report.description) }}</p>

      <Button
        icon="pi pi-arrow-right"
        class="p-button-sm p-button-outlined"
        aria-label="report"
        outlined
        type="button"
        @click="goToReportDetail(report.route)"
      />
      <div class="flex justify-content-end absolute" />
    </div>
  </div>

  <div v-else class="card">
    <template v-if="loadingReports">
      <CommonLoading />
    </template>
    <p v-else class="text-center font-medium text-xl">
      No Report Found.
    </p>
  </div>

  <!-- <DataTable
    :value="reportsData"
    :loading="loadingReports"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
    filterDisplay="menu"
    v-bind="{ ...tableAttrs, lazy: false }"
  >
    <template #empty>
      <div class="text-center">No report found.</div>
    </template>
    <Column
      header="Name"
      class="w-2"
      :sortable="true"
      sortField="name"
      :showFilterMatchModes="false"
      :filterMenuStyle="{ width: '14rem' }"
      style="min-width: 14rem"
      filterField="name"
    >
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-reports-type', params: { type: data.route } }"
          :class="{ 'pointer-events-none': !canDo('reports', 'single') }"
          class="flex align-items-center font-medium text-gray-900 cursor-pointer hover:text-gray-600"
        >
          <div class="flex flex-column flex-1">
            <span class="report-name">{{ data.name }}</span>
          </div>
        </router-link>
      </template>
    </Column>

    <Column header="Description">
      <template #body="{ data }">
        {{ data.description || 'No description available' }}
      </template>
    </Column>
  </DataTable> -->
</template>

<style lang="scss">
.display-grid {
  display: grid;
  grid-template-columns: repeat(1fr);
  grid-auto-rows: 1fr;
  gap: 30px;

  .reports-card {
    button {
      position: absolute;
      right: 20px;
      bottom: 20px;
    }
  }

  @media screen and (width >= 576px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (width >= 992px) {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
