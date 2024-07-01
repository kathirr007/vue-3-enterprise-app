import { type InferType, number, object, string } from 'yup';

export interface Timelog {
  id: string;
  title?: string;
  clientId?: string;
  projectId?: string;
  entityId?: string;
  timeSpent: number;
  createdAt?: string;
  updatedAt?: string;
}

export const TimelogCreateInputSchema = object({
  clientId: string().optional().nullable().label($tConfig('CLIENT')),
  entityId: string().nullable().label('Task')
    .when('type', (type, schema) => {
      if (type === 'manual') {
        return schema.optional();
      }
      return schema.required();
    }),
  taskTitle: string().nullable().label('Task Title')
    .when('type', (type, schema) => {
      if (type === 'existing') {
        return schema.optional();
      }
      return schema.required();
    }),
  timeSpent: number().required().nullable().label('Duration'),
  type: string().required().label('Task Type')
});

export const TimelogUpdateInputSchema = object({
  clientId: string().optional().nullable().label($tConfig('CLIENT')),
  timeSpent: number().required().nullable().label('Duration')
});

export type TimelogCreateInput = InferType<typeof TimelogCreateInputSchema>;
export type TimelogUpdateInput = InferType<typeof TimelogUpdateInputSchema>;
