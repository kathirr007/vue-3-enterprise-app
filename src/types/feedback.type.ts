import type { InferType } from 'yup';
import { array, boolean, number, object, string } from 'yup';
import type { EntityObj, MetaObj } from './common.type';
import type { User } from './teams.type';

export interface Feedback {
  id: string;
  title: string;
  name?: string;
  status?: keyof typeof FeedbackStatus;
  rating: string;
  ratedAt: string;
  org: { meta: MetaObj[] };
  client: {
    id: string;
    name: string;
    clientUsers: {
      id: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
  projects: Pick<EntityObj, 'id' | 'name'>[];
  raisedBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'isDeleted' | 'isActive'>;
  ratedBy: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'isDeleted' | 'isActive'>;
  [key: string]: any;
}

export enum FeedbackStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export const feedbackSettingPayloadSchema = object({
  googleReviewFeedback: string()
    .optional()
    .nullable()
    .label('Google review URL'),
  isClientFeedbackActive: boolean().optional().label('Enable Rating')
});

export const feedbackCreatePayloadSchema = object({
  clientId: string()
    .required()
    .nullable()
    .label(`${$tConfig('CLIENT')}`),
  projectIds: array().of(string()
    .optional()
    .nullable()
  ).label('Project'),
  feedbackTitle: string().required().label('Title')
});
export const feedbackSubmitPayloadSchema = object({
  rating: number()
    .required()
    .nullable()
    .label('Rating'),
  rateResponsiveness: number()
    .nullable()
    .when('rating', (rating, schema) =>
      rating < 5 ? schema.required() : schema.optional()
    )
    .label('Responsiveness Rating'),
  suggestions: string()
    .optional()
    .nullable()
    .label('Suggestions')
});

export type FeedbackCreatePayload = InferType<
  typeof feedbackCreatePayloadSchema
> & { title: string; status?: keyof typeof FeedbackStatus; rating?: number; meta?: { question: string; answer: any }[] };
