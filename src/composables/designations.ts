import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  Designation,
  DesignationCreatePayload,
  DesignationRemovePayload,
} from '@/types/designation.type';
import type { User } from '@/types/teams.type';

export async function useDesignationList() {
  const { data } = await $api.get<Designation[]>('designations');
  return data;
}
export async function useDesignationListV2({
  page,
  limit,
  filters,
  sortBy,
}: {
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  const { data } = await $api.get<PaginatedResponse<Designation>>(
    'designations',
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
}
export async function useGetDesignationUsers(id: string) {
  const { data } = await $api.get<[{ users: User[] }]>(
    `designations/${id}/users`
  );
  return data[0].users;
}

export async function useDesignationCreate(payload: DesignationCreatePayload) {
  const { data } = await $api.post<Designation>('designations', payload);
  return data;
}

export async function useDesignationRemove(
  id: string,
  payload?: DesignationRemovePayload
) {
  const { data } = await $api.delete<void>(`designations/${id}`, {
    data: payload,
  });
  return data;
}

export async function useDesignationUpdate(
  id: string,
  payload: Partial<DesignationCreatePayload>
) {
  const { data } = await $api.patch<Designation>(`designations/${id}`, payload);
  return data;
}

export async function useDesignationUsers(id: string) {
  const { data } = await $api.get<User[]>(`designations/${id}/users`);
  return data[0].users;
}
