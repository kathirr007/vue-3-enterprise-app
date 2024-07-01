import type { Attachment } from './attachment.type';
import type { ContentJSON } from './common.type';
import type { User } from '@/types/teams.type';

export type NoteResourceType = 'TEAM_MEMBER' | 'CLIENT' | 'PROJECT';

export interface CreateUpdateNote {
  type: NoteResourceType;
  resourceId: string;
  title?: string;
  content: string;
  attachments?: string[];
}

export interface Note {
  id: string;
  type: NoteResourceType;
  title?: string;
  content: ContentJSON;
  resourceId: string;
  attachments?: Attachment[];
  addedBy: User;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}
