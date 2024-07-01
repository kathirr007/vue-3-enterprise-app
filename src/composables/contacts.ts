import $api from '@/plugins/api';
import type {
  ClientGroup,
  ClientGroupAddClientsPayload,
  ClientGroupCreatePayload,
  ClientGroupRemovePayload,
} from '@/types/client-group';
import type { MetaObj, PaginatedResponse } from '@/types/common.type';
import type {
  ContactCreatePayload,
  UserContact,
  ContactAddClientsPayload,
} from '@/types/contacts.type';

export const useContacts = () => {
  const baseUrl = 'contact';
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
    clientId,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    clientId?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<UserContact>>(
      `${baseUrl}`,
      {
        params: {
          page,
          limit,
          filters,
          sortBy,
          clientId,
        },
      }
    );
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<UserContact>(`${baseUrl}/${id}`);
    if (data.meta && data.meta.length > 0) {
      data.meta.forEach((meta: MetaObj) => {
        data[meta.metaKey] = meta.metaValue;
      });
    }
    return data;
  };

  const createOne = async (payload: ContactCreatePayload) => {
    const { data } = await $api.post<UserContact>(`${baseUrl}`, payload);
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<UserContact>(`${baseUrl}/${id}`);
    return data;
  };

  const attachClients = async (
    id: string,
    payload: ContactAddClientsPayload
  ) => {
    const { data } = await $api.post(
      `${baseUrl}/${id}/attach-clients`,
      payload
    );
    return data;
  };

  const detachClients = async ({
    id,
    payload,
  }: {
    id: string;
    payload: ContactAddClientsPayload;
  }) => {
    const { data } = await $api.post(
      `${baseUrl}/${id}/detach-clients`,
      payload
    );
    return data;
  };

  const removeClient = async (
    id: string,
    payload?: ClientGroupRemovePayload
  ) => {
    const { data } = await $api.delete(`${baseUrl}/${id}/remove-client`, {
      data: payload,
    });
    return data;
  };

  const update = async (id: string, payload: Partial<ContactCreatePayload>) => {
    const { data } = await $api.patch<UserContact>(`${baseUrl}/${id}`, payload);
    return data;
  };

  const addPicture = async (id: string, pictureId: string) => {
    const { data } = await $api.patch<UserContact>(
      `${baseUrl}/${id}/picture/${pictureId}`
    );
    return data;
  };

  const removePicture = async (id: string, pictureId: string) => {
    const { data } = await $api.delete<UserContact>(
      `${baseUrl}/${id}/picture/${pictureId}`
    );
    return data;
  };

  return {
    getAll,
    getOne,
    createOne,
    attachClients,
    detachClients,
    remove,
    removeClient,
    update,
    addPicture,
    removePicture,
  };
};
