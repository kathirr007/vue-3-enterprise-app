// dashbroad
import $api from '@/plugins/api';
import type { DashboardHome } from '@/types/dashboard.type';
import type { DashboardClient } from '@/types/client.type';
import type { DashboardProject, Project } from '@/types/project.type';
import type { DashboardTeam } from '@/types/teams.type';
import type { PaginatedResponse } from '@/types/common.type';

export function useDashboardMatrix() {
  const getHomeDashboard = async (fromDate?: string, toDate?: string) => {
    const { data } = await $api.get<DashboardHome>(
      `dashboards/home${
        fromDate && toDate ? `?fromDate=${fromDate}&&toDate=${toDate}` : ''
      }`
    );
    return data;
  };
  const getClientDashboard = async (id: string) => {
    const { data } = await $api.get<DashboardClient>(`dashboards/client/${id}`);
    return data;
  };
  const getProjectDashboard = async (id: string) => {
    const { data } = await $api.get<DashboardProject>(
      `dashboards/project/${id}`
    );
    return data;
  };
  const getTeamDashboard = async (id: string) => {
    const { data } = await $api.get<DashboardTeam>(`dashboards/team/${id}`);
    return data;
  };
  const getPortalDashboard = async (status: string, filters: string) => {
    const { data } = await $api.get<PaginatedResponse<Project>>(
      `portal/dashboards/projects?status=${status}&filters=${filters}`
    );
    return data.results;
  };
  return {
    getHomeDashboard,
    getClientDashboard,
    getProjectDashboard,
    getTeamDashboard,
    getPortalDashboard,
  };
}
