import type { EntityObj } from './common.type';

export interface CommonMail extends EntityObj {
  route: string;
  org: Pick<EntityObj, 'id' | 'name'>;
}

export const mailType = ['inbox', 'sent-items', 'archived'];

export type MailType = (typeof mailType)[number];

export interface Message {
  firstName: string;
  lastName: string;
  sentTo: string;
  receivedTo: string;
  img: string;
  content: { title: string; subContent: string };
  isCollapsed: boolean;
  date: string;
  [key: string]: unknown;
}
