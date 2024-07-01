import type { MetaObj } from './common.type';
import type { EntityType } from './tasks.type';

export interface Card {
  id?: string;
  color: string;
  icon?: string;
  title: string;
  value: string;
  valueClass?: string;
  clickable?: boolean;
  [key: string]: unknown;
  iconify?: boolean;
}

export interface CheckListItem {
  id: string;
  name: string;
  title: string;
  isChecked: boolean;
  type: EntityType;
  [key: string]: unknown;
}

interface CompletedTasks {
  completedEntities: number;
  clients: number;
}

interface TodaysTaskCount {
  count: number;
  budgetTime: number;
}

interface OverDueTasks {
  overDueEntities: number;
  clients: number;
}

interface ActiveTasks {
  activeEntities: number;
  clients: number;
}

interface ScheduledTasks {
  scheduledEntities: number;
  clients: number;
}

interface TopActiveProjectsData {
  id: string;
  name: string;
  entities: {
    id: string;
  };
  _count: {
    entities: number;
  };
  dueDate: Date;
}

interface TodaysTaskData {
  id: string;
  client: {
    id: string;
    name: string;
  };
  meta: MetaObj[];
  dueDate: Date;
}

export interface ClientDistribution {
  id: string;
  name: string;
  _count: {
    clients: number;
  };
}
export interface FirmProductivity {
  day: number;
  timeSpent: number;
  projects: number;
  teamMembers: number;
  effectiveBillable: number;
}

export interface TeamMemberProductivityData {
  teamMemberId: string;
  name: string;
  todoEntities: number;
  inProgressEntities: number;
  overDueEntities: number;
  completedEntities: number;
}
export interface UtilizationProjection {
  teamMemberId: string;
  name: string;
  todoEntities: number;
  inProgressEntities: number;
  overDueEntities: number;
  completedEntities: number;
  availableTimeInHours: string;
  currentMonthtimeSpent: string;
  projectedTimeInHours: string;
  workingHours: number;
  overTime: number;
}

export interface DashboardHome {
  completedTasks: CompletedTasks;
  overDueTasks: OverDueTasks;
  activeTasks: ActiveTasks;
  scheduledTasks: ScheduledTasks;
  totalBillable: number;
  totalBillAmount: number;
  todaysTasks: TodaysTaskData;
  firmProductivity: FirmProductivity[];
  topActiveProjects: TopActiveProjectsData;
  clientTypes: ClientDistribution[];
  productivityStatus: TeamMemberProductivityData[];
  utilizationProjection: UtilizationProjection[];
  todaysTaskData: TodaysTaskCount;
  feedbackCount: number;
  feedbackRating: number;
}
