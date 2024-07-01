import { boolean, object, string } from 'yup';
import type { Attachment } from './attachment.type';
import type { Project } from './project.type';
import type { Client } from './client.type';
import type { StandaloneConfiguration } from 'pspdfkit';
import type { EntityObj, ExtractedType } from './common.type';
import type { User } from './teams.type';

export type SignatureStatuses =
  | 'SIGNED'
  | 'PARTIALLY_SIGNED'
  | 'PENDING'
  | 'CANCELLED';

export interface ESignature {
  title: string;
  status: string;
  requestDate: string;
  eSignDate: string;
  uploadDate: string;
}

export interface PSPDFKey {
  data: {
    licenseKey: string;
  };
}

export type InstantJSON = ExtractedType<StandaloneConfiguration, 'instantJSON'>;

export interface NewSignature {
  id: string;
  fileId: string;
  requestedToId: string;
  referenceId: string;
  rules?: object;
  signatureMeta: ExtractedType<StandaloneConfiguration, 'instantJSON'>;
  data?: object;
  entityId?: string;
  entity?: object;
  requestedTo?: Partial<User>;
  createdAt?: string;
  updatedAt?: string;
  webform?: {
    id: string;
    name: string;
  };
}
export interface SignatureRequest {
  id: string;
  title: string;
  name?: string;
  dueDate: Date;
  description: string;
  fileId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    picture: Attachment;
  };
  documentMeta?: {
    instantJSON: ExtractedType<StandaloneConfiguration, 'instantJSON'>;
  };
  project: Project;
  client: Client;
  webform?: EntityObj;
  signatures: NewSignature[];
}

export interface CreateDocumentSignatureReqPayload {
  title: string;
  dueDate?: string;
  description?: string;
  fileId: string;
  status?: string;
  projectId?: string;
  clientId?: string;
  WebformId?: string;
  documentMeta?: object;
  signatures?: NewSignature[];
}

export interface CreateDocumentSignaturePayload {
  id?: string;
  referenceId?: string;
  fileId: string;
  requestedToId: string;
  rules?: object;
  signatureMeta?: object | null;
  data?: object;
  entityId?: string;
}

export const SignatureRequestPayloadSchema = object({
  title: string().min(3).optional().label('Title'),
  // dueDate: string().required().nullable().label('Due Date'),
  dueDate: string()
    .nullable()
    .when('isWebform', (isWebform, schema) => {
      return isWebform ? schema.optional() : schema.required();
    })
    .label('Due Date'),
  requestedTo: object().nullable().label('Signer'),
  isWebform: boolean().optional()
});
