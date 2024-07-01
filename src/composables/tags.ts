import $api from '@/plugins/api';
import type { TagType, Tag } from '@/types/tags.type';

export function useTags() {
  const tagsList = async (type: TagType, isPortal?: boolean) => {
    const { data } = await $api.get<Tag[]>(
      `${isPortal ? 'portal/' : ''}tags?type=${type}`
    );
    return data;
  };
  const createTag = async (payload: Tag) => {
    const { data } = await $api.post<Tag>(`tags`, payload);
    return data;
  };

  const deleteDocumentTag = async ({
    clientId,
    fileId,
    tagId,
  }: {
    clientId: string;
    fileId: string;
    tagId: string;
  }) => {
    const { data } = await $api.delete<void>(
      `clients/${clientId}/files/${fileId}/tags/${tagId}`
    );
    return data;
  };
  const addDocumentTag = async ({
    clientId,
    fileId,
    tagId,
    isPortal,
  }: {
    clientId: string;
    fileId: string;
    tagId: string;
    isPortal?: boolean;
  }) => {
    const { data } = await $api.post<void>(
      `${isPortal ? 'portal/' : ''}clients/${
        isPortal ? '' : clientId + '/'
      }files/${fileId}/tags`,
      { tagId }
    );
    return data;
  };
  return {
    tagsList,
    createTag,
    deleteDocumentTag,
    addDocumentTag,
  };
}
