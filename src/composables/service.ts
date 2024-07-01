import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
// import type { PaginatedResponse } from '@/types/common.type';
import type {
  CreateServicePayload,
  ProjectStage,
  ProjectStageCreateUpdatePayload,
  Service,
} from '@/types/service.type';

export async function useServiceList(templates = false) {
  const { data } = await $api.get<Service[]>(
    `services?${templates ? 'default=true' : ''}`
  );
  return data;
}

export async function useServiceListV2({
  templates = false,
  page,
  limit,
  filters,
  sortBy,
}: {
  templates?: boolean;
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  const { data } = await $api.get<PaginatedResponse<Service>>(
    `services?${templates ? 'default=true' : ''}`,
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

export async function useServiceDetails(id: string) {
  const { data } = await $api.get<Service>(`services/${id}`);
  return data;
}

export async function useServiceCreate(payload: CreateServicePayload) {
  const { data } = await $api.post<Service>('services', payload);
  return data;
}

export async function useServiceUpdate(id: string, payload: Partial<Service>) {
  const { data } = await $api.patch<Service>(`services/${id}`, payload);
  return data;
}

export async function useServiceDelete(id: string) {
  return await $api.delete<Service>(`services/${id}`);
}

export async function useGetClientsWithService(id: string) {
  const { data } = await $api.get<Service>(`services/${id}/clients`);
  return data;
}

export function useProjectStages() {
  const { getStatusName } = useProjectStatus();
  const create = async (payload: ProjectStageCreateUpdatePayload) => {
    const { data } = await $api.post('pipeline-stage', payload);
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<ProjectStage>(`pipeline-stage/${id}`);
    return data;
  };

  const update = async (
    id: string,
    payload: Partial<ProjectStageCreateUpdatePayload>
  ) => {
    const { data } = await $api.patch(`pipeline-stage/${id}`, payload);
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete(`pipeline-stage/${id}`);
    return data;
  };

  const getAll = async () => {
    const { data } = await $api.get<PaginatedResponse<ProjectStage>>(
      'pipeline-stage'
    );
    return {
      results: data.results.map((stage: ProjectStage) => ({
        ...stage,
        statusName: getStatusName(stage.projectStatus.name),
      })),
      total: data.total,
    };
  };

  return { create, getAll, remove, update, getOne };
}
