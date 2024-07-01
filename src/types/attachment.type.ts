export interface Attachment {
  id: string;
  name: string;
  filename: string;
  path: string;
  isDeleted: boolean;
  isUploaded: boolean;
  description: string;
  size: number;
  mime: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  link: string;
}

export interface AttachmentContentType {
  PDF: 'application/pdf';
  PNG: 'image/png';
  JPG: 'image/jpeg';
  JPEG: 'image/jpeg';
  GIF: 'image/gif';
  DOC: 'application/msword';
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  XLS: 'application/vnd.ms-excel';
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  PPT: 'application/vnd.ms-powerpoint';
  PPTX: 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  TXT: 'text/plain';
  CSV: 'text/csv';
}

export interface AttachmentExtension {
  PDF: 'pdf';
  PNG: 'png';
  JPG: 'jpg';
  JPEG: 'jpeg';
  GIF: 'gif';
  DOC: 'doc';
  DOCX: 'docx';
  XLS: 'xls';
  XLSX: 'xlsx';
  PPT: 'ppt';
  PPTX: 'pptx';
  TXT: 'txt';
  CSV: 'csv';
}
export interface CreateAttachment {
  name?: string;
  filename: string;
  contentType: AttachmentContentType;
  extension: AttachmentExtension;
  contentLength: number;
  clientId?: string;
  orgId?: string;
  userId?: string;
}
export interface AttachmentResponse {
  url: string;
  id: string;
}

export interface SaveAttachment {
  path: string;
  folderId?: string;
  name?: string;
  filename: string;
  contentType: AttachmentContentType;
  extension: AttachmentExtension;
  contentLength?: number;
  clientId?: string;
}

export interface DownloadFilesAndFolders {
  folderIds?: string[];
  fileIds?: string[];
  name?: string;
}
