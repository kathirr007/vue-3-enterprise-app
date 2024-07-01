import type { EntityObj } from './common.type';

export interface CommonReport extends EntityObj {
  route: string;
  org: Pick<EntityObj, 'id' | 'name'>;
}

export const reportType = [
  'team',
  'client',
  'teamTrendLine',
  'clientTrendLine',
  'teamRoi',
  'teamUtilization',
  'projectEfficiency',
  'clientRoi',
  'projectRoi',
  'invoice',
];

export type ReportType = (typeof reportType)[number];

export interface TeamReport {
  userId: string;
  userName: string;
  designation: string;
  assignedTasks: number;
  completedTasks: number;
  projectedTasks: number;
  totalTimeSpent: number;
  numberOfClients: number;
}

export interface ClientReport {
  clientId: string;
  clientName: string;
  businessEntity: string;
  plannedProjects: number;
  activeProjects: number;
  completedProjects: number;
  completedTasks: number;
  timeSpent: number;
}

export interface ClientRoiReport {
  clientId: string;
  clientName: string;
  totalNoOfProjects: number;
  totalTimeSpent: number;
  totalSalaryCost: number;
  totalBillable: number;
}

export interface ProjectRoiReport {
  projectId: string;
  projectName: string;
  totalNoOfTasks: number;
  totalTimeSpent: number;
  totalSalaryCost: number;
  totalBillable: number;
}

export interface TeamUtilization {
  teamMemberId: string;
  teamMemberName: string;
  totalDays: number;
  monthlyManHours: number;
  timeSpent: number;
  totalUtilisation: number;
}

export interface TrendLine {
  month: string;
  totalNoOfProjects: number;
  totalNoOfTasks: number;
  totalTimeSpent: number;
}
