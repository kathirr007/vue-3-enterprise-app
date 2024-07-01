import { array, object, string } from 'yup';
import type { InferType } from 'yup';
import type { ContentJSON, EntityObj, MetaObj } from './common.type';
import type { User } from './teams.type';

export type ThreadType = 'Focused' | 'Archived' | 'Others';
export type ConversationActionType = 'reply' | 'forward';
export type ConversationType =
  | 'INCOMING'
  | 'OUTGOING'
  | 'ACTIVITY'
  | 'TEMPLATE';

/* export type Tone =
  | 'formal'
  | 'friendly'
  | 'affirmative'
  | 'non-affirmative'
  | 'neutral'
  | 'knowledgeable'
  | 'insightful'
  | 'thankful'
  | 'confident'
  | 'funny'; */

export enum Tone {
  Formal = 'formal',
  Friendly = 'friendly',
  Affirmative = 'affirmative',
  Knowledgeable = 'knowledgeable',
  Insightful = 'insightful',
  Thankful = 'thankful',
  Confident = 'confident',
  Funny = 'funny'
}

export enum AutoreplyTone {
  'Affirmative' = 'affirmative',
  'Non-affirmative' = 'non-affirmative',
  'Neutral' = 'neutral'
}

export type MailType = 'email' | 'comment' | 'email-reply';
export interface ConversationAction {
  message: Conversation;
  type: ConversationActionType;
}

export const InboxCreatePayloadSchema = object({
  agentId: array().of(string()).min(1).required().label('Agents'),
  name: string().required().label('Name'),
  description: string().optional().label('Description'),
  fromEmail: string().email().required().label('From Email')
  // fromEmail: array().of(string()).min(1).required().label('From Email'),
});

export type InboxCreatePayload = InferType<typeof InboxCreatePayloadSchema>;

export interface InboxData {
  entities: {
    id: string;
    type?: string;
    meta: MetaObj[];
  }[];
  projects: Pick<EntityObj, 'id' | 'name'>[];
  clients: Pick<EntityObj, 'id' | 'name'>[];
  assignedAgents: Pick<
    User,
    'id' | 'email' | 'firstName' | 'lastName' | 'picture'
  >[];
}
export interface Thread {
  id: string;
  sourceId: string;
  orgId: string;
  clientId: string | null;
  channel: string;
  status: string;
  inboxId: string;
  contactId: string;
  displayTitle: string;
  displayExcerpt: string;
  contactLastSeenAt: string | null;
  agentLastSeenAt: string | null;
  agentId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  conversations: Conversation[];
  inboxData?: InboxData;
  contact: Contact;
  isActive?: boolean;
}

export interface Inbox {
  id: string;
  orgId: string;
  creatorId: string;
  agentId: string[];
  name: string;
  description: string;
  fromEmail: string[];
  forwardingEmail: string;
  channel: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  type: string;
  status: string;
  threadId: string;
  externalIds: string | null;
  content: string | ContentJSON;
  contactId: string;
  agentId: string | null;
  templateId: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: MailsAttachmentResponse[];
  contact: Contact;
  template: string | null;
  isCollapsed: boolean;
}

export interface Contact {
  id: string;
  uid: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string;
  picture: string | null;
  company: {
    client: {
      id: string;
      name: string;
    };
  };
  settings: string | null;
  createdAt: string;
  updatedAt: string;
}
export const ThreadCreatePayloadSchema = object({
  // contact: array()
  //   .of(
  //     object({
  //       id: string(),
  //       email: string(),
  //     })
  //   )
  //   .min(1)
  //   .required()
  //   .label('Contact Addresses'),
  contact: object({
    uid: string(),
    email: string()
  })
    .required()
    .nullable()
    .label('Contact Addresses'),
  subject: string().required().label('Subject'),
  content: object({ content: string(), delta: object() })
    .nullable()
    .optional()
    .label('Description'),
  attachments: array().of(string()).nullable().optional().label('Attachments')
  // status: string().required().label('Status'),
  // clientId: string().optional().nullable().label('Clients'),
  // channel: string().required().label('Channel'),
});

export type ThreadCreatePayload = InferType<typeof ThreadCreatePayloadSchema>;

export interface ConversationCreatePayload {
  type: ConversationType;
  agent: User;
  contact?: User;
  content: { content: string };
  externalIds?: string[];
  attachments?: string[];
  templateId?: string;
  isPrivate?: boolean;
}

export const AttachTaskPayloadSchema = object({
  clientId: string().optional().nullable().label('Client'),
  projectId: string().optional().nullable().label('Project'),
  taskIds: array().of(string()).optional().label('Task')
});

export type AttachTaskPayload = InferType<typeof AttachTaskPayloadSchema>;

export interface DetachTask {
  clientId?: string;
  projectId?: string;
  taskIds: string[];
}

export interface MailsAttachmentResponse {
  id: string;
  orgId: string;
  name: string;
  path: string;
  mimeType: string;
  conversationId: string | null;
  isUploaded: boolean;
  createdAt: string;
  updatedAt: string;
  contentLength?: number;
  url?: number;
}

export interface GenerateSuggestionPayload {
  message: string;
  tone: Tone;
  type: MailType;
}
export const GenerateSuggestionPayloadSchema = object({
  tone: string().required().label('Tone')
});

export interface GeneratedResponse {
  text: string;
  html: string;
}
export interface GenerateSummaryPayload {
  thread: Conversation[];
}
export interface SuggestMessagePayload {
  content_orientation: Tone;
  thread: Conversation[];
}
