import type { InferType } from 'yup';
import { object, string } from 'yup';

export const ClientPortalSettingSchema = object().shape({
  enablePortal: string().optional().nullable().label('Portal'),
  enablePortalProjectTracking: string().optional().nullable().label('Project'),
  enablePortalTaskTracking: string().optional().nullable().label('Task'),
  enablePortalBrightDesk: string().optional().nullable().label('BrightDesk'),
  enablePortalDocuments: string().optional().nullable().label('Documents')
});

export type ClientPortalSettingPayload = InferType<
  typeof ClientPortalSettingSchema
>;
