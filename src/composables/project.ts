import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  CreateProject,
  DeleteUnscheduledProject,
  ExtendUnScheduledProjectPayload,
  GenerateTasksPayload,
  GeneratedTask,
  Project,
  ProjectStatus,
  ScheduleProjectPayload,
  UnPlannedProject
} from '@/types/project.type';
import type { Ref } from 'vue';
import type { Tag } from '@/types/tags.type';

export async function useProjectList({
  status,
  clientId
}: {
  status: ProjectStatus;
  clientId?: string | Ref<string>;
}) {
  const { data } = await $api.get<Project[]>(
    `projects?${status ? `status=${status}` : ''}${
      clientId ? `&clientId=${isRef(clientId) ? clientId.value : clientId}` : ''
    }`
  );
  return data;
}
export async function useProjectListV2({
  status,
  page,
  limit,
  filters,
  sortBy,
  responseStatus,
  isAdhoc,
  projectsWithoutFeedback
}: {
  status?: string;
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
  responseStatus?: 'Scheduled' | 'Active' | 'ScheduledAndActive' | 'Completed';
  isAdhoc?: boolean;
  projectsWithoutFeedback?: string;
}) {
  const url = `projects?${status ? `status=${status}` : ''}${
    isAdhoc ? `&isAdhoc=${isAdhoc}` : ''
  }${
    projectsWithoutFeedback ? `&projectsWithoutFeedback=${projectsWithoutFeedback}` : ''}`;

  let { data } = await $api.get<PaginatedResponse<Project>>(url, {
    params: {
      page,
      limit,
      filters,
      sortBy
    }
  });
  const scheduledProjects = data.results.filter(
    (project: Project) => project.status.name === 'Scheduled'
  );
  const activeProjects = data.results.filter(
    (project: Project) => project.status.name === 'Active'
  );
  const completedProjects = data.results.filter(
    (project: Project) => project.status.name === 'Completed'
  );
  const activeAndScheduledProjects = [...scheduledProjects, ...activeProjects];

  if (responseStatus === 'Scheduled') {
    data = { results: [...scheduledProjects], total: scheduledProjects.length };
  }
  if (responseStatus === 'Active') {
    data = { results: [...activeProjects], total: activeProjects.length };
  }
  if (responseStatus === 'ScheduledAndActive') {
    data = {
      results: [...activeAndScheduledProjects],
      total: activeAndScheduledProjects.length
    };
  }
  return data;
}

export function useUnplannedProjects() {
  const getList = async (clientId?: string) => {
    const { data } = await $api.get<UnPlannedProject[]>(
      `unplanned-projects?${clientId ? `clientId=${clientId}` : ''}`
    );
    return data;
  };
  const scheduleProject = async (payload: ScheduleProjectPayload) => {
    const { data } = await $api.post(`unplanned-projects/schedule`, payload);
    return data;
  };
  const extendProject = async (payload: ExtendUnScheduledProjectPayload) => {
    const { data } = await $api.post(`unplanned-projects/extend`, payload);
    return data;
  };
  const removeUnscheduledProject = async (
    payload: DeleteUnscheduledProject
  ) => {
    const { data } = await $api.post(`unplanned-projects/delete`, payload);
    return data;
  };
  return {
    getList,
    scheduleProject,
    extendProject,
    removeUnscheduledProject
  };
}

export async function useUnplannedProjectList() {
  const { data } = await $api.get<UnPlannedProject[]>(`unplanned-projects`);
  return data;
}

export async function useCreateProject(payload: CreateProject) {
  const { data } = await $api.post<Project>(`projects`, payload);
  return data;
}

export async function useProjectDetails(id: string) {
  const { data } = await $api.get<Project>(`projects/${id}`);

  if (data.client) {
    data.clientId = data?.client?.id;
  }
  if (data.projectManager) {
    data.projectManagerId = data.projectManager.id;
  }
  if (data.reviewer) {
    data.reviewerId = data.reviewer.id;
  }
  if (data.state) {
    data.stateId = data.state?.id;
  }

  if (data.isFederal) {
    data.stateId = 'federal';
  }

  return data;
}
export async function useProjectUpdate(
  id: string,
  payload: Partial<CreateProject>
) {
  const { data } = await $api.patch<CreateProject>(`projects/${id}`, payload);
  return data;
}
export async function useProjectDelete(id: string) {
  return await $api.delete<Project>(`projects/${id}`);
}
export async function useProjectArchive(id: string) {
  return await $api.patch<Project>(`projects/archive/${id}`);
}
export async function useProjectRestore(id: string) {
  return await $api.patch<Project>(`projects/restore/${id}`);
}

export async function useProjectBulkUpdate(
  ids: string[],
  field: string,
  value: string
) {
  const { data } = await $api.patch<void>('/projects/bulk-update', {
    ids,
    field,
    value
  });
  return data;
}
export async function useProjectCreateTags(
  id: string,
  payload: { tagId: string }
) {
  const { data } = await $api.post(`projects/${id}/tags`, payload);
  return data;
}

export async function useProjectDeleteTags(id: string, tagId: string) {
  return await $api.delete<Tag>(`projects/${id}/tags/${tagId}`);
}

export async function useGenerateTasks(
  payload: GenerateTasksPayload,
  isProject?: boolean
) {
  const { data } = await $api.post<GeneratedTask[]>(
    `brightassist/generate-tasks`,
    payload
  );
  return data.map((task) => {
    return {
      ...task,
      entityType: task.type === 'TEAM' ? 'TASK' : 'CLIENTTASK',
      isGeneratedByBrightAssist: isProject ? 'true' : true,
      enableBilling: isProject ? undefined : true,
      enableNotifications: isProject ? undefined : true,
      estimatedTime: isProject ? undefined : 0
    };
  });
}
