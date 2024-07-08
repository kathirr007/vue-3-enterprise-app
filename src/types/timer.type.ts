import { object, string } from 'yup';
import type { Task } from './tasks.type';

export type TimerStatus = 'running' | 'paused' | 'stopped';

export interface TimerObj {
  id: string;
  entity: Task;
  isCompleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  activities: {
    id: string;
    title: string;
    timespent: number;
  }[];
}

export interface CreateEntityTimer {
  entityId: string;
  timeSpent?: number;
}

export const CreateEntityTimerPayloadSchema = object({
  clientId: string().optional().nullable().label('Client'),
  projectId: string().optional().nullable().label('Project'),
  taskId: string().required().nullable().label('Task')
});
