import type { InferType } from 'yup';
import { object, string } from 'yup';

export const OrgAISettingSchema = object().shape({
  enableExtraction: string()
    .optional()
    .nullable()
    .label('Enable Auto Extraction'),
  enableClassification: string().optional().nullable().label('Enable Auto Tag'),
});

export type OrgAISettingPayload = InferType<typeof OrgAISettingSchema>;
