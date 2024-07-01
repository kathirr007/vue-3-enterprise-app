import { array, boolean, mixed, number, object, string } from 'yup';
import type { InferType } from 'yup';
import type { Task } from './tasks.type';
import type { Tag } from './tags.type';
import type { MetaObj } from '@/types/common.type';
import type { Org } from './myaccount.type';
import type { ProjectStage } from './service.type';

export type AccountingPeriod =
  | 'ONETIME'
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'HALFYEARLY'
  | 'YEARLY';

export type ProjectScheduleType = 'Extend' | 'Schedule' | '' | undefined;
export interface UpdateTitle {
  step: ScheduleProjectStep;
  typeofSchedule: ProjectScheduleType;
  serviceToSchedule: UnPlannedProject | undefined;
}

export interface ProjectStatus {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  status: number;
  orgId: string;
  org?: Org;
  createdAt: string;
  updatedAt: string;
  projects: Project[];
}
export type BillingType = 'NONE' | 'FIXED' | 'HOURLY';
export type ScheduleProjectStep =
  | 'select clients'
  | 'update project details'
  | 'pipeline'
  | 'update tasks';
export type ProjectCreateStep = 'template' | 'form' | 'pipeline' | 'tasks';

export interface UnScheduledProjectEntity {
  clientId: string;
  name: string;
  unScheduledProjectId: string;
  projectManagerId: string;
}
export interface UnPlannedProject {
  serviceId: string;
  service: string;
  isFederal: string;
  state: string;
  stateId: string;
  accountingPeriod: AccountingPeriod;
  estimatedTime: string;
  unscheduledClients: UnScheduledProjectEntity[];
  scheduledClients: UnScheduledProjectEntity[];
  extendedClients: UnScheduledProjectEntity[];

  projectMeta: ProjectMeta[];
}

export interface ProjectMeta {
  clientId: string;
  unScheduledProjectId: string;
  client: string;
  projectManagerId: string;
  isExtended: boolean;
  projectId: string;
  dueDate: string;
  reminderDate: string;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  client: {
    id: string;
    isActive: boolean;
    isDeleted: boolean;
    name: string;
    meta: MetaObj[];
    clientBillingProfile: {
      id: string;
      billingProfileId: string;
    }[];
  };
  status: ProjectStatus;
  feedback: {
    id: string;
    rating: number;
    title: string;
  };
  projectManager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    isDeleted: boolean;
  };
  isSetupCompleted?: boolean;
  isDeleted?: boolean;
  startDate?: string;
  completedDate?: string;
  extensionDate?: string;
  state?: {
    id: string;
    stateId: string;
    clientId: string;
  };
  dueDate?: string;
  dueInDays?: number;
  entities: Task[];
  _count: {
    entities: number;
  };
  isFederal?: boolean;
  billingType?: BillingType;
  billingRate?: number | null | undefined;
  billableAmount?: number;
  billableQuantity?: number;
  tags?: Tag[];
  pipelineStage: ProjectStage;
  [key: string]: any;
}

export type CreateProject = Omit<
  Project,
  'id' | 'projectManager' | 'client'
> & {
  description?: string;
  billingType: BillingType;
  projectManagerId: string;
  billingRate?: number;
  stateId?: string;
  completedDate?: string;
  extensionDate?: string;
  dueInDays?: number;
  reviewerId?: string;
  clientId?: string;
  id?: string;
  isFederal?: boolean;
  serviceId?: string;
  pipelineStageId?: string;
  [key: string]: any;
};

export interface ExtendUnScheduledProjectPayload {
  unscheduledProjectIds: string[];
  reminderDate: string;
  dueDate?: string;
}
export interface ScheduleProjectPayload {
  name: string;
  status: ProjectStatus;
  billingType: BillingType;
  unScheduledProjects: UnScheduledProjectPayload[];
  entities: UnScheduledProjectEntityPayload[];
  startDate?: string;
  description?: string;
  billingRate?: number;
  stateId?: string;
}
export interface UnScheduledProjectPayload {
  clientId: string;
  unScheduledProjectId: string;
}

export const ProjectCreatePayloadSchema = object({
  name: string().required().min(3).label('Name'),
  projectManagerId: string().required().nullable().label('Project Manager'),
  startDate: string().required().nullable().label('Start Date'),
  dueDate: string().required().nullable().label('Due Date'),
  clientId: string().optional().nullable().label('Client'),
  description: string()
    .optional()
    .nullable()
    .when('isBrightAssist', (isBrightAssist, schema) => {
      if (isBrightAssist) {
        return schema.required().label('Description');
      }
      else {
        return schema.label('Description');
      }
    })
    .label('Description'),
  billingType: string().nullable()
    .when(['clientId'], {
      is: (clientId: string) => !!clientId,
      then: string().nullable().required(),
      otherwise: string().nullable().optional()
    })
    .label('Billing Type'),
  billingRate: number()
    .nullable()
    .when(['billingType', 'clientId'], {
      is: (billingType: string, clientId: string) => !!clientId && billingType !== 'NONE',
      then: number().nullable().required(),
      otherwise: number().nullable().optional()
    })
    .label('Billing Amount'),
  stateId: string().optional().nullable(),
  completedDate: string().optional().nullable().label('Completed Date'),
  extensionDate: string().optional().nullable().label('Extension Date'),
  dueInDays: number().optional().nullable().label('dueInDays'),
  reviewerId: string().optional().nullable().label('Reviewer'),
  isBrightAssist: boolean().optional().nullable().label('Bright Assist'),
  pipelineStageId: string().optional().nullable().label('Project Stage')
});

export const UnScheduledProjectClientSelectSchema = object({
  clientSelection: string().required().label('Client Selection Mode'),
  clientsSelected: mixed().when('clientSelection', {
    is: 'multiple',
    then: array()
      .min(1, 'Please select at least one client')
      .of(
        object({
          clientId: string(),
          unplannedProjectId: string(),
          projectManagerId: string()
        }).required()
      )
      .label('Client Selection'),
    otherwise: object({
      clientId: string(),
      unplannedProjectId: string(),
      projectManagerId: string()
    })
      .nullable()
      .required()
      .label('Client Selection')
  })
});

export const ScheduleProjectSchema = object({
  name: string().required().label('Project Title'),
  billingType: string().nullable().required().label('Billing Type'),
  startDate: string().required().label('Start Date'),
  description: string().optional().max(255).label('Description'),
  billingRate: number().nullable().optional().label('Billing Amount')
});

export const UnScheduledProjectEntityPayloadSchema = object({
  name: string().required().label('Task Title'),
  type: string().required().label('Task Type'),
  isNotificationEnabled: boolean().optional().label('Enable Notification'),
  isBillingEnabled: boolean().optional().label('Enable Billing'),
  description: string().optional().max(255).nullable().label('Description'),
  entityStatus: string().required().label('Task Status'),
  entityPriority: string().required().label('Task Priority'),
  estimatedTime: number().optional().nullable().label('Budget Time'),
  startDate: string().required().label('Start Date'),
  dueDate: string().required().label('Due Date'),
  assignees: array()
    .required('Assignees is required field')
    .of(string().required().label('Assignees')),
  clientId: string().optional().label('Client')
});

export const ExtendUnScheduledProjectPayloadSchema = object({
  reminderDate: string().required().label('Reminder Date'),
  dueDate: string().optional().label('Due Date')
});

export const ProjectTaskUpdateSchema = object().shape({
  users: array().of(
    object().shape({
      title: string(),
      assignees: string().nullable().optional(),
      entityStatus: string().required().label('Entity Status')
    })
  )
});
export type ProjectTaskUpdateSchemaPayload = InferType<
  typeof ProjectTaskUpdateSchema
>;

export type UnScheduledProjectEntityPayload = InferType<
  typeof UnScheduledProjectEntityPayloadSchema
> & { id: string; attachmentIds?: string[] };

interface AssignedTeamData {
  id: string;
  firstName: string;
  lastName: string;
  picture: {
    path: string;
  };
  email: string;
  isActive: boolean;
}
export interface DashboardProject {
  totalCompletedTasks: number;
  overDueTasks: number;
  totalTasks: number;
  incompleteTasks: number;
  estimatedTime: any;
  assignedTeam: AssignedTeamData;
}

export const ProjectUnScheduledSchemaPayload = object({
  clients: array().of(string()).required().label('Client(s)')
});

export interface DeleteUnscheduledProject {
  unScheduledProjectIds: string[];
}

export interface GenerateTasksPayload {
  title: string;
  description: string;
}

export interface GeneratedTask {
  title: string;
  description: string;
  type: string;
}

export interface CreateProjectStatusPayload {
  name: string;
  description?: string;
  sortOrder?: number;
  status?: number;
}
