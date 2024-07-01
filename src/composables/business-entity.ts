import $api from '@/plugins/api';
// import type { PaginatedResponse } from '@/types/common.type';
import type {
  BusinessEntity,
  BusinessEntityCreatePayload,
} from '@/types/business-entity.type';
import type { Client } from '@/types/client.type';
import type { PaginatedResponse } from '@/types/common.type';

export async function useBusinessEntityList() {
  const { data } = await $api.get<BusinessEntity[]>('business-entities');
  return data;
}
export async function useBusinessEntityListV2({
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
  const { data } = await $api.get<PaginatedResponse<BusinessEntity>>(
    'business-entities',
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

export async function useGetClientsWithBusinessEntity(id: string) {
  const { data } = await $api.get<Client[]>(`business-entities/${id}/clients`);
  return data;
}

export async function useBusinessEntityCreate(
  payload: BusinessEntityCreatePayload
) {
  const { data } = await $api.post<BusinessEntity>(
    'business-entities',
    payload
  );
  return data;
}

export async function useBusinessEntityUpdate(
  id: string,
  payload: Partial<BusinessEntity>
) {
  const { data } = await $api.patch<BusinessEntity>(
    `business-entities/${id}`,
    payload
  );
  return data;
}

export async function useBusinessEntityDelete(id: string) {
  return await $api.delete<BusinessEntity>(`business-entities/${id}`);
}
