import { array, boolean, number, object, string } from 'yup';
import type { InferType } from 'yup';

export interface TaskAttachment { id: string; name: string; path: string }
export interface TaskTemplate {
  id: string;
  description: string;
  estimatedTime: number;
  service: {
    id: string;
    name: string;
  };
  attachments: TaskAttachment[];
  attachmentIds?: string[];
  title: string;
  enableNotifications: boolean;
  enableBilling: boolean;
  entityType?: string;
  order?: number;
}

export const entityType = ['TASK', 'CLIENTTASK', 'LEAD', 'CANDIDATE'];

export const TaskTemplateSchema = object().shape(
  {
    title: string()
      .optional()
      .when('title', {
        is: (value: string) => value?.length,
        then: () => string().min(3).label('Task Title')
      }),
    entityType: string().oneOf(entityType).required().label('Entity Type'),
    description: string().optional().nullable().label('Description'),
    estimatedTime: number().nullable().optional().label('Budget Time'),
    enableNotifications: boolean().optional().label('Enable Notification'),
    enableBilling: boolean().optional().label('Enable Billing'),
    attachmentIds: array().of(string()).optional().label('Attachments'),
    // dueInDays: number().optional().label('Due In Days'),
    order: number().optional().nullable().label('Order')
  },
  [['title', 'title']]
);

export const TeamTaskTemplatesSchema = array().of(
  TaskTemplateSchema.shape(
    {
      title: string()
        .required()
        .label('Task Title')
        .when('title', {
          is: (value: string) => value?.length,
          then: () => string().min(3).label('Task Title')
        })
    },
    [['title', 'title']]
  )
);
export const clientTaskSchema = array().of(TaskTemplateSchema);

export const CreateTaskTemplateSchema = object().shape(
  {
    teamTasks: TeamTaskTemplatesSchema.when('teamTasks', {
      is: (value: TaskTemplate[]) =>
        value && value.length > 1 && value.some(task => task.title),
      then: () => array().of(TaskTemplateSchema)
    }),
    clientTasks: clientTaskSchema
  },
  [['teamTasks', 'teamTasks']]
);

export type TaskTemplatePayload = InferType<typeof TaskTemplateSchema>;

export type CreateTaskTemplatePayload = InferType<
  typeof CreateTaskTemplateSchema
>;
