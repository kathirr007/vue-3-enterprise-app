<script lang="ts" setup>
import type { CommonReport, ReportType } from '@/types/reports.type';
import { reportType } from '@/types/reports.type';

import CommonLoading from '@/components/Common/Loading/index.vue';
import ReportsTeam from '@/components/Reports/Team.vue';
import ReportsClient from '@/components/Reports/Client.vue';
import ReportsClientRoi from '@/components/Reports/ClientRoi.vue';
import ReportTeamUtilization from '@/components/Reports/TeamUtilisation.vue';
import ReportClientTrendLine from '@/components/Reports/ClientTrendLine.vue';
import ReportTeamTrendLine from '@/components/Reports/TeamTrendLine.vue';
import ReportsQuickBookInvoice from '@/components/Reports/QuickBookInvoice.vue';
import router from '@/router';
import { useQuery } from 'vue-query';

const route = useRoute();
const currentRreportType = ref<ReportType | undefined>(
  route.params.type as ReportType
);

const { updateBreadcrumb } = useBreadcrumbs();
const { getAllReports } = useReports();
const { replaceClient } = useVueFilters();

const { isLoading: loadingReports, data: reportsList } = useQuery(
  'reports-list',
  () => {
    return getAllReports();
  }
);

const currentReportDetails = computed(() => {
  return reportsList.value?.find(
    (item: CommonReport) => item.route === currentRreportType.value
  );
});

const currentReport = computed(() => {
  const descAndTitle = {
    description: replaceClient(currentReportDetails.value?.description as string),
    title: replaceClient(currentReportDetails.value?.name as string)
  };
  switch (currentRreportType.value) {
    case 'team':
      return {
        component: ReportsTeam,
        ...descAndTitle
      };
    case 'client':
      return {
        component: ReportsClient,
        ...descAndTitle
      };
    case 'clientRoi':
      return {
        component: ReportsClientRoi,
        ...descAndTitle
      };
    case 'teamUtilization':
      return {
        component: ReportTeamUtilization,
        ...descAndTitle
      };
    case 'clientTrendLine':
      return {
        component: ReportClientTrendLine,
        ...descAndTitle
      };
    case 'teamTrendLine':
      return {
        component: ReportTeamTrendLine,
        ...descAndTitle
      };
    case 'invoice':
      return {
        component: ReportsQuickBookInvoice,
        ...descAndTitle
      };
    default:
      return {
        component: CommonLoading,
        description: '',
        title: currentRreportType.value
      };
  }
});

const isValidReport = computed(() =>
  reportType.includes(currentRreportType.value as ReportType)
);

onMounted(() => {
  updateBreadcrumb({
    breadcrumbs: [
      { label: 'Reports', to: { name: 'admin-reports' } },
      { label: currentReport.value?.title }
    ]
  });
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonPage v-if="isValidReport" :title="`${currentReport?.title}`">
    <!-- <div class="card">
    </div> -->
    <component :is="currentReport?.component" />
    <div>
      <Button
        label="Back"
        class="p-button p-component font-medium p-button-text mt-4"
        icon="pi pi-chevron-left"
        @click="router.push({ name: 'admin-reports' })"
      />
    </div>
  </CommonPage>
  <Common404 v-else title="Report Not Found" class="border-round-lg" />
</template>
