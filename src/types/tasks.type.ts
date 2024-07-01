import type { ContentJSON, MetaObj } from '@/types/common.type';
import { type InferType, array, boolean, object, string } from 'yup';
import type { Attachment } from './attachment.type';
import type { Client } from './client.type';
import type { Conversation } from './inbox.type';
import type { EntityStatus } from './status-entity.type';
import type { User } from './teams.type';
import type { Tag } from './tags.type';

export type EntityType =
  | 'TASK'
  | 'CLIENTTASK'
  | 'SUPPORTTASK'
  | 'LEAD'
  | 'CANDIDATE';
export interface CreateTaskBase {
  type: EntityType;
  entityStatus?: string;
  entityPriority?: string;
  estimatedTime?: number;
  startDate?: string;
  dueDate?: string;
  clientId?: string;
  assignees?: User[];
  watchers?: User[];
  tags?: Tag[];
  parentEntityId?: string;
  actualStartDate?: string;
  actualCompletedDate?: string;
  clientUsers?: string[];
  projectId?: string;
  project?: {
    id: string;
    name: string;
    projectManagerId: string;
    isDeleted?: boolean;
  };
}

export interface description {
  content: string;
}
export interface CreateTask extends CreateTaskBase {
  type: EntityType;
  title: string;
  isNotificationEnabled?: string;
  isBillinngEnabled?: string;
  description?: description;
  name?: string;
}

export interface status {
  id: string;
  entityType: string;
  name: string;
  status?: number;
}
export interface priority {
  id: string;
  entityType: string;
  name: string;
}

export interface Task extends CreateTask {
  id: string;
  meta?: MetaObj[];
  status?: EntityStatus;
  priority?: priority;
  client?: Client;
  comments: TaskComments[];
  createdBy: User;
  conversations: Conversation[];
  billableQuantity: number;
  billableAmount: number;
  [key: string]: any;
}

export interface UpdateTask {
  id?: string;
  type?: EntityType;
  data: UpdateTaskPayload;
  [key: string]: unknown;
}

export interface TaskUserAddPayload {
  id: string;
  userId?: string;
  clientId?: string;
  userType: 'watcher' | 'assignee' | 'clientUser';
}

export interface TaskUserRemovePayload {
  id: string;
  watcherId?: string;
  assigneeId?: string;
  userId?: string;
  clientId?: string;
}

export interface UpdateTaskPayload {
  type?: EntityType;
  title?: string;
  isNotificationEnabled?: string;
  isBillingEnabled?: string;
  description?: description | string;
  entityStatus?: string;
  entityPriority?: string;
  estimatedTime?: number;
  startDate?: string;
  dueDate?: string;
  clientId?: string;
  assignees?: string | string[];
  watchers?: string[];
  assigneesData?: User[];
  watchersData?: User[];
  tags?: string[];
  parentEntityId?: string;
  actualStartDate?: string;
  actualCompletedDate?: string;
  meta?: MetaObj[];
  name?: string;
  clientUsers?: string[];
  projectId?: string;
  attachments?: Attachment[];
  conversations?: Conversation[];
  status?: EntityStatus;
  [key: string]: unknown;
  notesId?: string;
}

export interface TaskComments {
  id?: string;
  content: ContentJSON;
  title?: string;
  updatedAt?: string;
  createdBy?: User;
  attachments?: string[];
  isEditing?: boolean;
}

export const taskCreateUpdateSchemaPayload = object({
  entityStatus: string().nullable().optional(),
  entityPriority: string().nullable().optional(),
  estimatedTime: string().nullable().optional(),
  startDate: string().nullable().optional(),
  dueDate: string().nullable().optional(),
  clientId: string()
    .nullable()
    .when(['isClientTask', 'firmSupportTask'], {
      is: (isClientTask: boolean, firmSupportTask: boolean) => isClientTask || firmSupportTask,
      then: string().required()
    })
    .label($tConfig('CLIENT')),
  projectId: string().nullable().optional(),
  assignees: string().nullable().optional(),
  watchers: array().of(string()).optional(),
  clientUsers: array().of(string()).optional(),
  name: string().required().label('Title'),
  isNotificationEnabled: boolean().optional(),
  isBillingEnabled: boolean().optional(),
  description: string()
    .nullable()
    .when('firmSupportTask', {
      is: true,
      then: string().required().label('Message'),
      otherwise: string().optional().label('Description')
    }),
  isClientTask: boolean().optional(),
  firmSupportTask: boolean().optional(),
  notesId: string().nullable().optional()
});

export type TaskCreateUpdateSchemaPayload = InferType<
  typeof taskCreateUpdateSchemaPayload
>;
