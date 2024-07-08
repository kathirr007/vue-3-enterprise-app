import type { InferType } from 'yup';
import { boolean, object, string } from 'yup';

export type TagType =
  | 'TASK'
  | 'CLIENTTASK'
  | 'SUPPORTTASK'
  | 'PROJECT'
  | 'CLIENT'
  | 'DOCUMENT';

export interface Tag {
  id?: string;
  orgId?: string;
  name: string;
  type: TagType;
  description?: string;
  bgColor?: string;
  bgColorClass?: string;
  textColor?: string;
}

export const TagCreatePayloadSchema = object({
  tagId: string()
    .required()
    .label('Tag')
    .nullable()
    .when('isDocument', (isDocument, schema) => {
      if (isDocument) {
        return schema.notRequired();
      }
      return schema.required();
    }),
  isDocument: boolean().optional().label('Is Document')
});

export type TagCreatePayload = InferType<typeof TagCreatePayloadSchema>;
