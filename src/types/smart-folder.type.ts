import type { InferType } from 'yup';
import { object, string, boolean, array } from 'yup';
import type { Tag } from '@/types/tags.type';

export interface CreateSmartFolder {
  name: string;
  description?: string;
  clientReadable?: boolean;
}

export interface SmartFolder {
  id: string;
  name: string;
  paths?: object;
  parent?: {
    id: string;
    name: string;
  };
  isSmartFolder: boolean;
  isPredefined?: boolean;
  children: {
    id: string;
    name: string;
    clientExistingWritable: boolean;
    clientReadable: boolean;
    clientWritable: boolean;
    createdAt: string;
    updatedAt: string;
    isSmartFolder: boolean;
    children: {
      id: string;
      name: string;
      isSmartFolder: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  files: {
    id: string;
    name: string;
    tags: Tag[];
  };
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  clientExistingWritable: boolean;
  clientReadable: boolean;
  clientWritable: boolean;
  data: {
    key: string;
    condition: string;
    value: string;
  }[];
}

export type CreateSmartFolderPayload = {
  name: string;
  clientReadable?: boolean;
  data: [];
};

export const SmartFolderCreatePayloadSchema = object({
  name: string().required().min(3).label('Folder Name'),
  description: string().optional().max(255).nullable().label('Description'),
  clientReadable: boolean().optional().label('Client Readable'),
});

export const SmartFolderSettingPayloadSchema = object().shape({
  data: array().of(
    object().shape({
      key: string().required().nullable().label('Criteria'),
      condition: string().required().nullable().label('Condition'),
      value: array()
        .of(string())
        .required()
        .nullable()
        .min(1)
        .label('Condition Value'),
    })
  ),
});
