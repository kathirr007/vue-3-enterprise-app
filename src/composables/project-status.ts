import $api from '@/plugins/api';
import type {
  ProjectStatus,
  CreateProjectStatusPayload,
} from '@/types/project.type';

export function useProjectStatus() {
  const baseUrl = 'projects/project-status';

  const getStatusName = (status: string) => {
    switch (status) {
      case 'Scheduled':
        return 'To Do';
      case 'Active':
        return 'In Progress';
      default:
        return status;
    }
  };

  const getAllStatuses = async () => {
    const { data } = await $api.get<ProjectStatus[]>(baseUrl);
    return data.map((status: ProjectStatus) => ({
      ...status,
      statusName: getStatusName(status.name),
    }));
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<ProjectStatus>(`${baseUrl}/${id}`);
    return data;
  };

  const create = async (payload: CreateProjectStatusPayload) => {
    const { data } = await $api.post<ProjectStatus>(baseUrl, payload);
    return data;
  };

  const update = async (
    id: string,
    payload: Partial<CreateProjectStatusPayload>
  ) => {
    const { data } = await $api.patch<ProjectStatus>(
      `${baseUrl}/${id}`,
      payload
    );
    return data;
  };
  const remove = async (id: string) => {
    const { data } = await $api.delete<ProjectStatus>(`${baseUrl}/${id}`);
    return data;
  };

  return {
    getStatusName,
    getAllStatuses,
    getOne,
    create,
    update,
    remove,
  };
}
