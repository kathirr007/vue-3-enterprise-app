import $api from '@/plugins/api';
import type {
  BulkDocument,
  CreateFilePayload,
  CreateFolderPayload,
  DocumentFile,
  DocumentFolder,
  GetFolderDetails,
  SearchedReponse
} from '@/types/documents.type';

export function useDocuments() {
  const getUploadFolderDetails = async ({
    payload
  }: {
    payload: GetFolderDetails;
  }) => {
    const url = `extraction/upload-folder-details`;
    const { data } = await $api.post<DocumentFolder>(url, payload);
    return data;
  };

  const getFolders = async ({
    id,
    folderId,
    isPortal,
    term,
    isGallery
  }: {
    id: string;
    folderId?: string;
    isPortal?: boolean;
    term?: string;
    isGallery?: boolean;
  }) => {
    const url = isGallery
      ? `gallery/folders`
      : folderId
        ? `${
          isPortal
            ? `portal/clients/folders/${folderId}`
            : `clients/${id}/folders/${folderId}`
        }`
        : `${isPortal ? `portal/clients/folders` : `clients/${id}/folders`}`;
    const { data } = await $api.get<DocumentFolder | DocumentFolder[]>(url, {
      params: {
        term
      }
    });
    return data;
  };

  const getFolder = async ({
    id,
    folderId,
    isPortal,
    isGallery
  }: {
    id: string;
    folderId: string;
    isPortal?: boolean;
    isGallery?: boolean;
  }) => {
    const url = isGallery
      ? `gallery/folders/${folderId}`
      : `${
          isPortal
            ? `portal/clients/folders/${folderId}`
            : `clients/${id}/folders/${folderId}`
        }`;
    const { data } = await $api.get<DocumentFolder>(url);
    return data;
  };

  const createFolder = async (
    id: string,
    payload: CreateFolderPayload,
    isPortal?: boolean,
    isGallery?: boolean
  ) => {
    const url = isGallery
      ? `gallery/folders`
      : `${isPortal ? `portal/clients/folders` : `clients/${id}/folders`}`;
    const { data } = await $api.post<DocumentFolder>(url, payload);
    return data;
  };

  const updateFolder = async ({
    id,
    folderId,
    payload,
    isPortal,
    isGallery
  }: {
    id: string;
    folderId: string;
    payload: CreateFolderPayload;
    isPortal?: boolean;
    isGallery?: boolean;
  }) => {
    const url = isGallery
      ? `gallery/folders/${folderId}`
      : `${
          isPortal
            ? `portal/clients/folders/${folderId}`
            : `clients/${id}/folders/${folderId}`
        }`;
    const { data } = await $api.patch<DocumentFolder>(url, payload);
    return data;
  };

  const deleteFolder = async (
    id: string,
    folderId: string,
    isPortal?: boolean,
    isGallery?: boolean
  ) => {
    const url = isGallery
      ? `gallery/folders/${folderId}`
      : `${
          isPortal
            ? `portal/clients/folders/${folderId}`
            : `clients/${id}/folders/${folderId}`
        }`;
    const { data } = await $api.delete<DocumentFolder>(url);
    return data;
  };

  const getFiles = async ({
    id,
    folderId,
    isPortal,
    type,
    tag,
    term,
    filters,
    isGallery
  }: {
    id: string;
    folderId?: string;
    isPortal?: boolean;
    type?: string;
    tag?: string;
    term?: string;
    filters?: string;
    isGallery?: boolean;
  }) => {
    const url = isGallery
      ? `gallery/files${folderId ? `?folderId=${folderId}` : ''}`
      : `${isPortal ? `portal/clients/files?` : `clients/${id}/files?`}${
          folderId ? `folderId=${folderId}` : ''
        }`;
    const { data } = await $api.get<DocumentFile[]>(url, {
      params: {
        type,
        tag,
        term,
        filters
      }
    });
    return data;
  };

  const getFile = async (
    id: string,
    fileId: string,
    isPortal?: boolean,
    isGallery?: boolean
  ) => {
    const url = isGallery
      ? `gallery/files/${fileId}`
      : `${
          isPortal ? `portal/clients/files/` : `clients/${id}/files/`
        }${fileId}`;

    const { data } = await $api.get<DocumentFile>(url);
    return data;
  };

  const createFile = async (
    id: string,
    payload: CreateFilePayload,
    folderId?: string,
    isPortal?: boolean
  ) => {
    const { data } = await $api.post<DocumentFile>(
      `${isPortal ? `portal/clients/files?` : `clients/${id}/files?`}${
        folderId ? `${folderId}` : ''
      }`,
      payload
    );
    return data;
  };

  const updateFile = async ({
    id,
    payload,
    folderId,
    fileId,
    isPortal,
    isGallery
  }: {
    id: string;
    fileId: string;
    payload: Partial<CreateFilePayload>;
    folderId?: string;
    isPortal?: boolean;
    isGallery?: boolean;
  }) => {
    const url = isGallery
      ? `gallery/files/${fileId}${folderId ? `/${folderId}` : ''}`
      : `${
          isPortal ? `portal/clients/files/` : `clients/${id}/files/`
        }${fileId}${folderId ? `/${folderId}` : ''}`;
    const { data } = await $api.patch<DocumentFile>(url, payload);
    return data;
  };

  const deleteFile = async (
    id: string,
    fileId: string,
    isPortal?: boolean,
    isGallery?: boolean
  ) => {
    const url = isGallery
      ? `gallery/files/${fileId}`
      : `${
          isPortal ? `portal/clients/files/` : `clients/${id}/files/`
        }${fileId}`;
    const { data } = await $api.delete<DocumentFile>(url);
    return data;
  };

  const searchFilesAndFolders = async ({
    id,
    folderId,
    mode,
    q,
    isPortal,
    isGallery
  }: {
    id: string;
    folderId?: string;
    mode: 'all' | 'folder' | 'file';
    q: string;
    isPortal?: boolean;
    isGallery?: boolean;
  }) => {
    const url = isGallery
      ? `gallery/search`
      : `${isPortal ? `portal/clients/search` : `clients/${id}/search`}`;
    const { data } = await $api.get<SearchedReponse>(url, {
      params: {
        mode,
        folderId,
        q
      }
    });
    return data;
  };

  const downloadFolder = async (
    id: string,
    folder: DocumentFolder,
    isPortal?: boolean
  ) => {
    const { data } = await $api.post(
      `${isPortal ? `portal/clients/downloads` : `clients/${id}/downloads`}`,
      {
        uIds: [folder.id],
        name: 'download'
      }
    );
    return data;
  };

  const bulkUpdateDocuments = async (
    id: string,
    payload: BulkDocument,
    isPortal?: boolean
  ) => {
    const { data } = await $api.patch<void>(
      `${
        isPortal
          ? `portal/clients/files/bulk-update`
          : `clients/${id}/files/bulk-update`
      }`,
      payload
    );
    return data;
  };
  const fileTypeOptions = [
    { name: 'PDF', value: 'application/pdf' },
    { name: 'PNG', value: 'image/png' },
    { name: 'JPG', value: 'image/jpeg' },
    { name: 'JPEG', value: 'image/jpeg' },
    { name: 'GIF', value: 'image/gif' },
    { name: 'DOC', value: 'application/msword' },
    {
      name: 'DOCX',
      value:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    },

    { name: 'XLS', value: 'application/vnd.ms-excel' },
    {
      name: 'XLSX',
      value:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },

    { name: 'PPT', value: 'application/vnd.ms-powerpoint' },
    {
      name: 'PPTX',
      value:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    },
    { name: 'TXT', value: 'text/plain' },
    { name: 'CSV', value: 'text/csv' }
  ];

  return {
    createFolder,
    getFolders,
    getFolder,
    updateFolder,
    deleteFolder,
    createFile,
    getFiles,
    getFile,
    updateFile,
    deleteFile,
    downloadFolder,
    searchFilesAndFolders,
    bulkUpdateDocuments,
    fileTypeOptions,
    getUploadFolderDetails
  };
}
