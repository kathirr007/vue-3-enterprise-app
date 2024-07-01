import $api from '@/plugins/api';
import type {
  ClientReport,
  ClientRoiReport,
  CommonReport,
  TeamReport,
  ProjectRoiReport,
  ReportType,
  TeamUtilization,
  TrendLine,
} from '@/types/reports.type';

export function useReports() {
  const reportsTableRef = ref();
  const getAllReports = async () => {
    const { data } = await $api.get<CommonReport[]>('reports');
    return data;
  };
  const getOneReportList = async (reportType: ReportType) => {
    const { data } = await $api.get<
      | TeamReport[]
      | ClientReport[]
      | ClientRoiReport[]
      | ProjectRoiReport[]
      | TeamUtilization[]
    >(`reports/${reportType}`);
    return data;
  };
  const getClientTrendReportList = async (id: string) => {
    const { data } = await $api.get<TrendLine[]>(`reports/client/${id}`);
    return data;
  };
  const getTeamTrendReportList = async (id: string) => {
    const { data } = await $api.get<TrendLine[]>(`reports/team/${id}`);
    return data;
  };

  const exportToCSV = (data: any, options?: any) => {
    reportsTableRef.value.exportCSV(
      options
        ? { ...options, exportSuppressFooterLine: true }
        : { exportSuppressFooterLine: true },
      data
    );
  };

  return {
    reportsTableRef,
    getAllReports,
    getOneReportList,
    getClientTrendReportList,
    getTeamTrendReportList,
    exportToCSV,
  };
}
