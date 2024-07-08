import { object, string } from 'yup';

export interface CreateExtractionPayload {
  name: string;
  clientId?: string;
  fy?: string;
  fileIds: string[];
  creatorId?: string;
}

export interface GetFolderDetailsPayload {
  name: string;
  clientId?: string;
  creatorId?: string;
}

export interface ExtractionDocument {
  id: string;
  name: string;
  orgId: string;
  clientId: string;
  client: string;
  creatorId: string;
  creator: string;
  fy: string;
  files: File[];
  excelFilePath: string;
  pdfFilePath: string;
  isCompleted: boolean;
  status: 'SUCCESS' | 'FAIL';
  message: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    files: number;
  };
}

export const ExtractionPayloadSchema = object({
  name: string().min(3).required().label('Name'),
  financialYear: string().optional().nullable().label('Financial Year'),
  clientId: string().optional().nullable().label('Client')
});
