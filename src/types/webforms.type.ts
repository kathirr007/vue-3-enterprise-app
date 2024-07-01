import type { InferType } from 'yup';
import { number, object, string } from 'yup';
import type { FullNameObject, MetaObj } from './common.type';
import type { Attachment } from './attachment.type';

export type WebformCreateStep = 'template' | 'form' | 'addFields';
export type WebformType = 'ORGANIZER' | 'CONTRACT';

export enum WebformStatus {
  'Details Requested' = 'PENDING',
  'Draft' = 'DRAFT',
  'Rejected' = 'REJECTED',
  'Filled' = 'FILLED',
  'Approved' = 'APPROVED',
  'Update Requested' = 'UPDATE_REQUESTED',
  'Cancelled' = 'CANCELLED',
  'eSignature Requested' = 'ESIGN_REQUESTED',
  'Partially Signed' = 'PARTIALLY_SIGNED',
  'Signed' = 'SIGNED'
}

export enum InputAttrType {
  text = 'text',
  textarea = 'textarea',
  number = 'number',
  email = 'email',
  password = 'password',
  date = 'date',
  select = 'select',
  multiselect = 'multiselect',
  search = 'search',
  editor = 'editor',
  radio = 'radio',
  radiogroup = 'radiogroup',
  checkbox = 'checkbox',
  checkboxgroup = 'checkboxgroup',
  toggle = 'toggle',
  file = 'file',
  multifile = 'multifile',
  static = 'static',
  divider = 'divider'
}

export interface AutoMappingEntry {
  name: string;
}
export interface TemplateFieldProp {
  label: string;
  value?: string;
  name?: string;
  placeholder?: string;
  mappedValue?: string;
  options?: string[]; // For select
  multiple?: boolean;
  format?: string; // For date
  columns?: TemplateField[]; // For table
  autoMapping?: AutoMappingEntry[];
  hint?: string;
  description?: string;
  [key: string]: any;
}
export interface TemplateFieldAttr {
  disabled?: boolean;
  readOnly?: boolean;
  type?: InputAttrType;
  min?: number;
  max?: number;
  size?: number;
  step?: number;
  [key: string]: any;
}

export interface TemplateFieldRule {
  required?: boolean;
  type?: string;
  min?: number;
  max?: number;
  length?: number;
  format?: string;
  regex?: string;
  lowercase?: boolean;
  uppercase?: boolean;
  trim?: boolean;
}

export interface TemplateField {
  id?: string;
  fieldId?: string;
  refId?: string;
  name: string;
  is: string;
  predefinedType?: string | null;
  props: TemplateFieldProp;
  defaultValue?: string | number | null;
  attrs: TemplateFieldAttr;
  rules: TemplateFieldRule;
  suggestions?: string[] | number[] | null;
  value?: string | number | null;
  confidence?: string;
  oldValue?: string; // To toggle confidence highlighting once the value changes
  values?: Array<Array<string | number>>;
  rawValue?: string; // date utility
  displayFormat?: string | null;
  search?: boolean;
  isStatic?: boolean;
  native?: boolean;
  autocomplete?: string;
  valueFormat?: string | null;
  _meta?: any; // This is used for curation & is NOT A PART OF SCHEMA
  [key: string]: unknown | any;
}

export type TemplateBlock = TemplateField[];

export interface TemplateRow {
  blocks: TemplateBlock;
}

export interface TemplateSchema {
  rows?: TemplateRow[];
}

// Schema that ensures there is atlease an empty row
export interface RigidTemplateSchema {
  rows: TemplateRow[];
}

export interface TemplateResponse {
  id: string;
  modelId: string;
  schema: TemplateSchema;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ListTemplateResponse = TemplateResponse[];

export interface TemplateUpdatePayload {
  schema: TemplateSchema;
}

export interface FormCuratedField {
  fieldId: string;
  name: string;
  value: any;
  text?: string;
  bbox?: {
    x: number;
    y: number;
    w: number;
    h: number;
    type: string;
    page: number;
  };
}

export interface FormCurationPayload {
  data: FormCuratedField[];
}

export interface FieldType extends TemplateField {
  name: string;
  description?: string;
  icon?: string;
  updatedAt: string;
  createdAt: string;
}

export interface Webform {
  id: string;
  name: string;
  title?: string;
  type: WebformType;
  data?: RigidTemplateSchema;
  schema?: object;
  isLocked?: boolean;
  status?: WebformStatus;
  clientId?: string;
  client: {
    id: string;
    name: string;
    meta: MetaObj;
  };
  createdBy: FullNameObject;
  orgId: string;
  signatureRequestId?: string;
  signatureRequest?: {
    id: string;
    title: string;
    updatedAt: string;
  }[];
  attachments?: string[] | Attachment[];
  documentMeta?: Record<string, any>;
  description?: string;
  instructions?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  _count?: {
    forms: number;
  };
  values: Record<string, any>;
  [key: string]: any;
}

export const webformTemplateCreatePayloadSchema = object({
  name: string().required().min(3).label('Name'),
  description: string()
    .optional()
    .nullable()
    .max(255)
    .nullable()
    .label('Description'),
  instructions: string().optional().nullable().label('Instructions')
});

export type WebformTemplateCreatePayload = InferType<
  typeof webformTemplateCreatePayloadSchema
>;

export interface WebformCreatePayload {
  name: string;
  description?: string;
  clientId?: string;
  signatureRequestId?: string;
  schema?: object;
  data?: object;
  attachments?: string[];
}

export interface WebformSubmitPayload {
  schema: Record<string, any>;
  values: Record<string, any>;
  documentMeta?: Record<string, any>;
  attachments?: string[];
  isFromCPA?: boolean;
}

export const WebformSelectionSchema = object({
  clientId: string().required().nullable().label('Client'),
  webform: number().required().nullable().label('Webform')
});
