import $api from '@/plugins/api';
import type {
  CustomAxiosRequestConfig,
  MetaObj,
  PaginatedResponse
} from '@/types/common.type';
import type {
  CreateUserPayload,
  DisableTeamMemberPayload,
  FullNameObj,
  UpdateContractTeamMemberPayload,
  UpdateTeamMemberPayload,
  User,
  UserOptionalUpdatePayload,
  UserPortal
} from '@/types/teams.type';

import type { Client } from '@/types/client.type';
import type { Project } from '@/types/project.type';
import type { Task } from '@/types/tasks.type';

const { fullName } = useVueFilters();
const { currentUser } = useCurrentUserData();
const { isFalsy } = useUtilityFns();

export async function useUsersList(isUserNameMe = false) {
  let currentUserIndex: number | undefined;
  let { data } = await $api.get<User[]>('users');
  data
    = data
    && data.map((user: User, index) => {
      if (currentUserIndex === undefined) {
        currentUserIndex
          = isUserNameMe && user.id === currentUser.value?.id ? index : undefined;
      }

      return {
        ...user,
        name:
          isUserNameMe && user.id === currentUser.value?.id
            ? 'Me'
            : fullName(user)
      };
    });
  if (currentUserIndex !== undefined) {
    const currentUserData = data.splice(currentUserIndex, 1);
    data.unshift(...currentUserData);
  }
  return data;
}

export async function useUsersListV2({
  isUserNameMe = false,
  page,
  limit,
  filters,
  sortBy
}: {
  isUserNameMe?: boolean;
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  let currentUserIndex: number | undefined;
  let encodedFilters: string | undefined;
  const userFilter = [
    'Type',
    'type',
    'in',
    ['ORG_USER', 'OUTSOURCED_ORG_USER']
  ];
  if (filters) {
    const decodedFilters = JSON.parse(atob(filters as string));
    const allUsersFilter = [userFilter, ...decodedFilters];
    encodedFilters = btoa(JSON.stringify(allUsersFilter));
  }
  else {
    const allUsersFilter = [userFilter];
    encodedFilters = btoa(JSON.stringify(allUsersFilter));
  }

  const { data } = await $api.get<PaginatedResponse<User>>('users', {
    params: {
      page,
      limit,
      filters: encodedFilters,
      sortBy
    }
  });
  data.results
    = data
    && data.results.map((user: User, index) => {
      if (currentUserIndex === undefined) {
        currentUserIndex
          = isUserNameMe && user.id === currentUser.value?.id ? index : undefined;
      }

      return {
        ...user,
        name:
          isUserNameMe && user.id === currentUser.value?.id
            ? 'Me'
            : fullName(user)
      };
    });
  if (currentUserIndex !== undefined) {
    const currentUserData = data.results.splice(currentUserIndex, 1);
    data.results.unshift(...currentUserData);
  }
  return data;
}

export async function useUserPortalList() {
  const { data } = await $api.get<UserPortal[]>(`portal/client-users`);
  return data;
}

export async function useUserDetails(
  id: string | string[] | null,
  isPortal?: boolean
) {
  const { data } = await $api.get<User>(
    `${isPortal ? 'portal/' : ''}users/${id}`
  );
  if (data.meta && data.meta.length > 0) {
    data.meta.forEach((meta: MetaObj) => {
      data[meta.metaKey] = meta.metaValue;
    });
  }
  if (data.orgRole) {
    data.orgUserRoleId = data.orgRole.id;
  }
  if (data.designation) {
    data.designationId = data.designation.id;
  }
  if (data.invitedBy) {
    data.invitedBy = fullName(data.invitedBy as FullNameObj) as string;
  }
  if (data.manager) {
    data.reportTo = data.manager.id;
    data.managerId = data.manager.id;
  }
  data.salary = !isFalsy(data.salary) ? Number(data.salary) : 0;

  return data;
}

export async function useUser() {
  const { data } = await $api.get<User>('users/me');

  return { ...data, name: fullName(data) };
}

export async function useUserCreate(payload: CreateUserPayload) {
  const { data } = await $api.post<User>('users', payload, {
    catchErrors: false
  } as CustomAxiosRequestConfig);
  return data;
}

export async function contractUserCreate(payload: CreateUserPayload) {
  const { data } = await $api.post<User>(
    'users/invite-contract-team-member',
    payload,
    {
      catchErrors: false
    } as CustomAxiosRequestConfig
  );
  return data;
}

export async function useUserUpdateDetails(
  id: string | string[] | null,
  payload: UpdateTeamMemberPayload | UpdateContractTeamMemberPayload,
  isPortal?: boolean
) {
  const { data } = await $api.patch<User>(
    `${isPortal ? 'portal/' : ''}users/${id}`,
    payload
  );
  return data;
}

export async function useUserOptionalUpdateDetails(
  id: string | string[] | null,
  payload: UserOptionalUpdatePayload | UpdateTeamMemberPayload,
  isPortal?: boolean
) {
  const { data } = await $api.patch<User>(
    `${isPortal ? 'portal/' : ''}users/${id}`,
    payload
  );
  return data;
}

export async function useUserEnable(id: string | null) {
  const { data } = await $api.patch<User>(`users/${id}/enable`);
  return data;
}

export async function useUserDisable({
  id,
  payload
}: {
  id: string;
  payload?: DisableTeamMemberPayload;
}) {
  const { data } = await $api.post<User>(`users/${id}/disable`, payload);
  return data;
}

export async function useUserRemove(id: string) {
  const { data } = await $api.delete(`users/${id}`);
  return data;
}
export async function useUserSingleClient(id: string) {
  const { data } = await $api.get<Client[]>(`users/${id}/clients`);
  return data;
}

export async function useUserSingleClientV2({
  id,
  page,
  limit,
  filters,
  sortBy
}: {
  id: string;
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  const { data } = await $api.get<PaginatedResponse<Client>>(
    `users/${id}/clients`,
    {
      params: {
        page,
        limit,
        filters,
        sortBy
      }
    }
  );
  return data;
}

export async function useUserSingleProject(id: string) {
  const { data } = await $api.get<Project[]>(`users/${id}/projects`);
  return data;
}
export async function useUserSingleTasks(
  id: string,
  status?: 'OPEN' | 'CLOSED',
  filters?: string
) {
  const url = `users/${id}/entities?${status ? `status=${status}` : ''}`;
  const { data } = await $api.get<Task[]>(url, {
    params: {
      filters
    }
  });
  return data;
}
export async function useUserSingleTasksV2({
  id,
  status,
  page,
  limit,
  filters,
  sortBy
}: {
  id: string;
  status?: 'OPEN' | 'CLOSED';
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  const url = `users/${id}/entities?${status ? `status=${status}` : ''}`;
  const { data } = await $api.get<PaginatedResponse<Task>>(url, {
    params: {
      page,
      limit,
      filters,
      sortBy
    }
  });
  return data;
}

export async function useUserProfilePicRemove({
  id,
  pictureId,
  isPortal
}: {
  id: string;
  pictureId: string;
  isPortal?: boolean;
}) {
  const data = await $api.delete<void>(
    `${isPortal ? 'portal/' : ''}users/${id}/picture/${pictureId}`
  );
  return data;
}
