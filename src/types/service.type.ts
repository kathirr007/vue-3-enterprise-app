import type { InferType } from 'yup';
import { boolean, number, object, string } from 'yup';
import type { MetaObj } from './common.type';
import type { Org } from './myaccount.type';
import type { TaskTemplate } from './task-template.type';
import type { Project, ProjectStatus } from './project.type';

type BillingType = 'NONE' | 'FIXED' | 'HOURLY';

export interface OrderedPipelineStages {
  id: string;
  order: number;
  pipelineStageId: string;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  isSetupCompleted?: boolean;
  description?: string;
  billingType: BillingType;
  billingRate?: string;
  estimatedTime?: string;
  meta?: MetaObj[];
  org?: Org;
  taskTemplates: TaskTemplate[];
  OrderedPipelineStages: OrderedPipelineStages[];
}

export const CreateServiceSchema = object({
  name: string().required().min(3).label('Name'),
  billingType: string().required().label('Billing Type'),
  billingRate: number()
    .nullable()
    .when('billingType', (billingType, schema) => {
      if (billingType && billingType !== 'NONE') {
        return schema.min(1).required().label('Billing Amount');
      }
    })
    .label('Billing Amount'),
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
  // description: string().optional().label('Description'),
  // estimatedTime: number().optional().label('Budget Time'),
  isBrightAssist: boolean().optional().nullable().label('App Assist')
});

export interface CreatePipelineStage {
  pipelineStageId: string;
  order: number;
}

export type CreateServicePayload = InferType<typeof CreateServiceSchema> & {
  entityTemplates?: TaskTemplate[];
  pipelineStage?: CreatePipelineStage[];
};

export const TemplateSchema = object({
  template: string().required().nullable().label('Template')
});

export type TemplatePayload = InferType<typeof TemplateSchema>;

export const AddDescriptionSchema = object({
  description: string().required().nullable().label('Description')
});

export const ProjectStageCreateUpdateSchema = object({
  name: string().required().nullable().label('Name'),
  projectStatusId: string().required().nullable().label('Project Status')
});

export type ProjectStageCreateUpdatePayload = InferType<
  typeof ProjectStageCreateUpdateSchema
>;

export interface ProjectStage {
  id: string;
  name: string;
  projectStatus: ProjectStatus;
  projects: Project[];
  orgId: string | null;
  isDefault?: boolean;
  statusName: string;
}
