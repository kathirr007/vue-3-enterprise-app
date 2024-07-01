import type { InferType } from 'yup';
import type { ContentJSON } from '@/types/common.type';
import type { FullNameObj } from './teams.type';
import { array, object, string, boolean, number } from 'yup';
import type { Attachment } from './attachment.type';

export const broadcastType = ['client', 'team'] as const;

export type BroadcastType = (typeof broadcastType)[number];

export type BroadcastStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export interface CreateBroadcast {
  name: string;
  description: string;
  broadcastTemplateId?: string;
  subject?: string;
  body?: string | ContentJSON;
  isInternal?: boolean;
  type?: string;
  clientsPayload?: string[];
  teamMembersPayload?: string[];
  clients: clientSchemaPayload;
  teamMembers: teamSchemaPayload;
  isEnabled?: boolean;
  scheduleDate?: string | null;
  id?: string;
  scheduleBroadcast?: string;
  clientType?: string;
  teamMemberType?: string;
  attachmentIds?: string[];
  attachments?: Attachment[];
  [key: string]: any;
}

export interface clientSchemaPayload {
  clients?: string[];
  businessEntities?: string[];
  services?: string[];
  [key: string]: any;
}
export interface teamSchemaPayload {
  teamMembers?: string[];
  designations?: string[];
  [key: string]: any;
}
export interface BroadcastTemplateMessage {
  type: string;
  subject: string;
  body: string;
}

export interface BroadcastTemplate {
  id: string;
  name: string;
  description: string;
  messages?: BroadcastTemplateMessage[];
  isEnabled?: boolean;
  isInternal?: boolean;
  attachments?: Attachment[];
  attachmentIds?: string[];
}

export interface Broadcast {
  id?: string;
  name: string;
  description: string;
  isEnabled: boolean;
  isInternal: boolean;
  template: BroadcastTemplate;
  status: BroadcastStatus;
  subject: string;
  body: string | { body: string };
  type: string;
  scheduleDate: string;
  clients: clientSchemaPayload;
  teamMembers: teamSchemaPayload;
  createdBy: FullNameObj;
  clientsPayload?: string[];
  teamMembersPayload?: string[];
  isRecurring?: boolean | string;
  recurringBroadcast?: Recurring;
  attachmentIds?: string[];
  attachments?: Attachment[];
  [key: string]: any;
}
export const BroadcastTypeSchema = object({
  name: string().required().label('Name'),
  description: string().optional().nullable().label('Description'),
  type: string().required().label('Type'),
  channel: string().required().label('CHannel'),
  templates: string()
    .when('type', {
      is: 'template',
      then: string().required().label('Templates'),
    })
    .optional()
    .label('Templates'),
  subject: string().required().label('Subject'),
  body: string().required().label('Message'),
  attachmentIds: array().of(string()).optional().label('Attachments'),
});

export type BroadcastTypePayload = InferType<typeof BroadcastTypeSchema>;

export interface CreateBroadcastTemplate {
  name: string;
  description: string;
  isEnabled?: boolean;
  isInternal?: boolean;
  id?: string;
  attachmentIds?: string[];
}

export interface TemplateMessagePayload {
  id?: string;
  type: string;
  subject: string;
  body: ContentJSON | string;
  isEditor?: boolean;
  isSubjectEditor?: boolean;
}

export const BroadcastTemplateSchema = object({
  name: string().required().label('Name'),
  description: string().required().label('Description'),
});
export const TemplateAddMessageSchema = object({
  type: string().required().label('Type'),
  body: string().required().label('Message'),
  subject: string().required().label('Subject'),
});

export const teamBroadcastCreateSchema = object({
  name: string()
    .optional()
    .when('currentOp', {
      is: 'clone',
      then: string().required().label('Name'),
    })
    .label('Name'),
  subject: string()
    .label('Subject')
    .when('isCreate', (isCreate, schema) =>
      isCreate ? schema.optional() : schema.required()
    ),
  body: string()
    .label('Body')
    .when('isCreate', (isCreate, schema) =>
      isCreate ? schema.optional() : schema.required()
    ),
  teamMembersPayload: array()
    .min(1)
    .when('teamMemberType', (teamMemberType, schema) => {
      if (teamMemberType === 'designations') {
        return schema.label('Designations');
      }
      if (teamMemberType === 'teams') {
        return schema.label('Teams');
      }
    })
    .of(string().required())
    .required()
    .label('Team Members'),
  scheduleDate: string()
    .optional()
    .when('isRecurring', {
      is: 'once',
      then: string().required().label('Schedule Date').nullable(),
    })
    .label('Schedule Date')
    .nullable(),
  interval: string()
    .optional()
    .when('isRecurring', {
      is: 'repeat',
      then: string().required().label('Interval'),
    })
    .label('Schedule Date'),
  teamMemberType: string().required().label('Team Type'),
  scheduleBroadcast: string().required().label('Schedule Broadcast'),
  isRecurring: string()
    .label('Repeat or Once')
    .when('scheduleBroadcast', (scheduleBroadcast, schema) => {
      if (scheduleBroadcast === 'later') {
        return schema.required();
      }
      return schema.optional();
    }),
  day: array()
    .of(number())
    .label('Day')
    .when('interval', (interval: any, schema: any) => {
      if (interval && interval !== 'DAILY') {
        return schema.required().min(1);
      }
      return schema.optional();
    }),
  month: array()
    .of(number())
    .label('Month')
    .when('interval', (interval: any, schema: any) => {
      if (interval && interval === 'MONTHLY') {
        return schema.required().min(1);
      }
      return schema.optional();
    }),
  hours: number()
    .when('interval', (interval, schema) => {
      if (interval) return schema.required();
      return schema.optional();
    })
    .nullable(),
  minutes: number()
    .when('interval', (interval: any, schema: any) => {
      if (interval) {
        return schema.required();
      }
      return schema.optional();
    })
    .nullable(),
  currentOp: string().optional(),
  isCreate: boolean().optional(),
});
export const clientBroadcastCreateSchema = object({
  name: string()
    .optional()
    .when('currentOp', {
      is: 'clone',
      then: string().required().label('Name'),
    })
    .label('Name'),
  subject: string()
    .label('Subject')
    .when('isCreate', (isCreate, schema) =>
      isCreate ? schema.optional() : schema.required()
    ),
  body: string()
    .label('Body')
    .when('isCreate', (isCreate, schema) =>
      isCreate ? schema.optional() : schema.required()
    ),
  clientsPayload: array()
    .min(1)
    .when('clientType', (clientType, schema) => {
      if (clientType === 'businessEntities') {
        return schema.label('Business Entities');
      }
      if (clientType === 'clientGroups') {
        return schema.label('Client Groups');
      }
      if (clientType === 'clients') {
        return schema.label('Clients');
      }
    })

    .of(string().required())
    .required()
    .label('Clients'),

  scheduleDate: string()
    .optional()
    .when('isRecurring', {
      is: 'once',
      then: string().required().label('Schedule Date').nullable(),
    })
    .label('Schedule Date')
    .nullable(),
  interval: string()
    .optional()
    .when('isRecurring', {
      is: 'repeat',
      then: string().required().label('Interval'),
    })
    .label('Schedule Date'),
  clientType: string().required().label('Client Type'),
  scheduleBroadcast: string().required().label('Schedule Broadcast'),
  isRecurring: string()
    .label('Repeat or Once')
    .when('scheduleBroadcast', (scheduleBroadcast, schema) => {
      if (scheduleBroadcast === 'later') {
        return schema.required();
      }
      return schema.optional();
    }),
  day: array()
    .of(number())
    .label('Day')
    .when('interval', (interval: any, schema: any) => {
      if (interval && interval !== 'DAILY') {
        return schema.required().min(1);
      }
      return schema.optional();
    }),
  month: array()
    .of(number())
    .label('Month')
    .when('interval', (interval: any, schema: any) => {
      if (interval && interval === 'MONTHLY') {
        return schema.required().min(1);
      }
      return schema.optional();
    }),
  hours: number()
    .when('interval', (interval, schema) => {
      if (interval) return schema.required();
      return schema.optional();
    })
    .nullable(),
  minutes: number()
    .when('interval', (interval: any, schema: any) => {
      if (interval) {
        return schema.required();
      }
      return schema.optional();
    })
    .nullable(),

  currentOp: string().optional(),
  isCreate: boolean().optional(),
});

export const CreateTemplateMessageSchema = object().shape({
  messages: array().of(
    object().shape({
      type: string().required().nullable().label('Type'),
      subject: string().required().nullable().label('Subject'),
      body: string().required().nullable().label('Body'),
    })
  ),
});

export const AddMessageSchema = object({
  message: string().required().nullable().label('Message'),
});
export const AddSubjectSchema = object({
  message: string().required().nullable().label('Subject'),
});

export type Interval = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface BroadcastRecurring {
  daily: {
    selectedTime: string | Date;
  };
  weekly: {
    weeks: number[];
    selectedTime: string | Date;
  };
  monthly: {
    months: number[];
    days: number[];
    selectedTime: string | Date;
  };
}

export interface Month {
  value: number;
  label: string;
  maxDays: number;
}
export interface Week {
  value: number;
  label: string;
}

export interface Recurring {
  id: string;
  interval: Interval;
  month: number[];
  day: number[];
  hours: number;
  minutes: number;
  broadcastId: string;
  createdAt: string;
  updatedAt: string;
}
