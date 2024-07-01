import $api from '@/plugins/api';
import type {
  CreateExtractionPayload,
  ExtractionDocument,
  GetFolderDetailsPayload,
} from '@/types/extraction.type';

export const useExtraction = () => {
  const getAll = async () => {
    const { data } = await $api.get<ExtractionDocument[]>('extraction');
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<ExtractionDocument>(`extraction/${id}`);
    return data;
  };

  const downloadFiles = async (id: string) => {
    const { data } = await $api.post(`extraction/${id}/download-files`);
    return data;
  };

  const createExtraction = async (
    createExtractionPayload: CreateExtractionPayload
  ) => {
    const { data } = await $api.post<ExtractionDocument>(
      'extraction',
      createExtractionPayload
    );
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete(`extraction/${id}`);
    return data;
  };

  const uploadFolderDetails = async (payload: GetFolderDetailsPayload) => {
    const { data } = await $api.post(
      'extraction/upload-folder-details',
      payload
    );
    return data;
  };

  return {
    getAll,
    getOne,
    createExtraction,
    remove,
    uploadFolderDetails,
    downloadFiles,
  };
};
