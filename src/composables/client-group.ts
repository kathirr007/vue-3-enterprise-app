import $api from '@/plugins/api';
import type {
  ClientGroup,
  ClientGroupAddClientsPayload,
  ClientGroupCreatePayload,
  ClientGroupRemovePayload,
} from '@/types/client-group';
import type { PaginatedResponse } from '@/types/common.type';

export const useClientGroups = () => {
  const getAll = async () => {
    const { data } = await $api.get<ClientGroup[]>('client-groups');
    return data;
  };

  const getAllV2 = async ({
    page,
    limit,
    filters,
    sortBy,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<ClientGroup>>(
      'client-groups',
      {
        params: {
          page,
          limit,
          filters,
          sortBy,
        },
      }
    );
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<ClientGroup>(`client-groups/${id}`);
    return data;
  };

  const createOne = async (payload: ClientGroupCreatePayload) => {
    const { data } = await $api.post<ClientGroup>('client-groups', payload);
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<ClientGroup>(`client-groups/${id}`);
    return data;
  };

  const addClients = async (
    id: string,
    payload: ClientGroupAddClientsPayload
  ) => {
    const { data } = await $api.post<ClientGroup>(
      `client-groups/${id}/add-clients/bulk`,
      payload
    );
    return data;
  };

  const removeClients = async (
    id: string,
    payload: ClientGroupAddClientsPayload
  ) => {
    const { data } = await $api.delete<ClientGroup>(
      `client-groups/${id}/remove-clients/bulk`,
      { data: payload }
    );
    return data;
  };

  const removeClient = async (
    id: string,
    payload?: ClientGroupRemovePayload
  ) => {
    const { data } = await $api.delete(`client-groups/${id}/remove-client`, {
      data: payload,
    });
    return data;
  };

  const update = async (
    id: string,
    payload: Partial<ClientGroupCreatePayload>
  ) => {
    const { data } = await $api.patch<ClientGroup>(
      `client-groups/${id}`,
      payload
    );
    return data;
  };

  return {
    getAll,
    getAllV2,
    getOne,
    createOne,
    addClients,
    remove,
    removeClient,
    removeClients,
    update,
  };
};

export async function useClientGroupList() {
  const { data } = await $api.get<ClientGroup[]>('client-groups');
  return data;
}

export async function useClientGroupCreate(payload: ClientGroupCreatePayload) {
  const { data } = await $api.post<ClientGroup>('client-groups', payload);
  return data;
}

export async function useClientGroupRemove(
  id: string,
  payload?: ClientGroupRemovePayload
) {
  const { data } = await $api.delete<void>(`client-groups/${id}`, {
    data: payload,
  });
  return data;
}

export async function useClientGroupUpdate(
  id: string,
  payload: Partial<ClientGroupCreatePayload>
) {
  const { data } = await $api.patch<ClientGroup>(
    `client-groups/${id}`,
    payload
  );
  return data;
}
