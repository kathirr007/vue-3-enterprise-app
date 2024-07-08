import type {
  AttachmentContentType,
  AttachmentExtension
} from './attachment.type';
import type { EntityObj } from './common.type';
import type { InferType } from 'yup';
import { boolean, object, string } from 'yup';
import type { Tag } from './tags.type';

export interface DocumentFile {
  id: string;
  contentLength: number;
  contentType: string;
  createdAt: string;
  creatorId: string;
  data: any;
  name: string;
  filename: string;
  link: string;
  url: string;
  summary: { field: string; order: number; value: string }[];
  tags?: Tag[];
  path: string;
  size: number;
  updatedAt: string;
  documentTemplate: string;
  isUploaded: boolean;
  isDeleted: boolean;
  description: string;
  mime?: string;
  folder?: {
    clientReadable?: boolean;
    clientWritable?: boolean;
  };
}
export interface DocumentFolder {
  id: string;
  name: string;
  clientExistingWritable?: boolean;
  clientReadable?: boolean;
  clientWritable?: boolean;
  isHidden?: boolean;
  isExtractionFolder?: boolean;
  createdAt?: string;
  updatedAt?: string;
  creatorId?: string;
  clientId?: string;
  children?: DocumentFolder[];
  files?: DocumentFile[];
  parent?: Pick<EntityObj, 'id' | 'name'>;
  paths?: Pick<EntityObj, 'id' | 'name'>[];
  isSmartFolder?: boolean;
}

export interface CreateFolderPayload {
  name: string;
  parentId?: string;
  clientExistingWritable?: boolean;
  clientReadable?: boolean;
  clientWritable?: boolean;
  securedFolder?: boolean;
}

export interface CreateFilePayload {
  name: string;
  filename: string;
  creatorId: string;
  contentType: AttachmentContentType;
  extension: AttachmentExtension;
  contentLength: number;
  folderId?: string;
  isisUploaded?: boolean;
}

export interface DriveSearch {
  folders: DocumentFolder[];
  files: DocumentFile & { folder: Pick<EntityObj, 'id' | 'name'> }[];
}

export interface DocOrDirUpdateParams {
  id: string;
  payload: CreateFilePayload | CreateFolderPayload;
  folderId?: string;
  fileId?: string;
}

export const DocumentCreatePayloadSchema = object({
  name: string().required().min(3).label('Folder Name'),
  parentId: string().optional().nullable(),
  clientExistingWritable: boolean().optional(),
  clientReadable: boolean().optional(),
  clientWritable: boolean().optional(),
  securedFolder: boolean().optional()
});

export type DocumentCreatePayload = InferType<
  typeof DocumentCreatePayloadSchema
>;

export interface SearchedReponse {
  files: DocumentFile[];
  folders: DocumentFolder[];
}

export interface BulkDocument {
  fileIds?: string[];
  folderIds?: string[];
  field: string;
  newFolderId?: string;
}

export interface GetFolderDetails {
  name: string;
  clientId?: string;
  creatorId?: string;
}
