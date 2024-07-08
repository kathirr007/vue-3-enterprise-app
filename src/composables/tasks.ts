import $api from '@/plugins/api';
import type {
  ContentJSON,
  MetaObj,
  PaginatedResponse
} from '@/types/common.type';
import type { Conversation } from '@/types/inbox.type';
import type { EntityStatus } from '@/types/status-entity.type';
import type {
  EntityType,
  Task,
  TaskComments,
  TaskUserAddPayload,
  TaskUserRemovePayload,
  UpdateTask,
  UpdateTaskPayload
} from '@/types/tasks.type';
import type { Tag } from '@/types/tags.type';
import type { User } from '@/types/teams.type';

const { isJsonStringValid } = useUtilityFns();
const { isPortalUser } = useCurrentUserData();

export async function useTasksList({
  status,
  entityType = 'TASK',
  clientId,
  isPortal
}: {
  status?: 'CLOSED' | 'OPEN';
  entityType?: EntityType;
  clientId?: string;
  isPortal?: boolean;
}) {
  const { data } = await $api.get<Task[]>(
    `${isPortal ? 'portal/' : ''}entities?${
      entityType ? `entityType=${entityType}` : ''
    }&${status ? `status=${status}` : ''}&${
      clientId ? `clientId=${clientId}` : ''
    }`
  );
  return data;
}
export async function useTasksListV2({
  status,
  entityType = 'TASK',
  clientId,
  isPortal,
  page,
  limit,
  filters,
  sortBy
}: {
  entityType: EntityType;
  // status?: 'CLOSED' | 'OPEN';
  status?: string;
  clientId?: string;
  isPortal?: boolean;
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  let url = `entities${!isPortalUser.value ? `/${entityType}` : ''}?`;
  if (isPortal)
    url = 'portal/'.concat(url);
  if (status)
    url = url.concat(`status=${status}`);
  if (clientId)
    url = url.concat(`&clientId=${clientId}`);

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
export async function useTask(
  id: string,
  entityType: EntityType,
  isPortal?: boolean
) {
  const { data } = await $api.get<Task>(
    `${isPortal ? `portal/` : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}`
  );
  const schemaDataPaylaod: UpdateTask = {
    data: data as unknown as UpdateTaskPayload
  };

  schemaDataPaylaod.data.meta?.forEach((meta: MetaObj) => {
    if (meta.metaKey === 'description') {
      schemaDataPaylaod.data[meta.metaKey] = JSON.parse(meta.metaValue).content;
    }
    else if (
      meta.metaKey === 'isNotificationEnabled'
      || meta.metaKey === 'isBillingEnabled'
    ) {
      schemaDataPaylaod.data[meta.metaKey] = (meta.metaValue
      === 'true') as unknown as string;
    }
    else {
      schemaDataPaylaod.data[meta.metaKey] = meta.metaValue;
    }
  });
  if (data.status) {
    schemaDataPaylaod.data.entityStatus = data.status.name;
  }
  if (data.title) {
    data.name = data.title;
  }
  if (data.priority) {
    schemaDataPaylaod.data.entityPriority = data.priority.name;
  }
  if (data.client) {
    schemaDataPaylaod.data.clientId = data.client.id;
  }
  if (data.project) {
    schemaDataPaylaod.data.projectId = data.project.id;
  }
  if (data.assignees && data.assignees.length) {
    schemaDataPaylaod.data.assigneesData = data.assignees;
    schemaDataPaylaod.data.assignees = data.assignees.map((e: User) => e.id)[0];
  }
  else {
    schemaDataPaylaod.data.assignees = undefined;
  }
  if (data.watchers) {
    schemaDataPaylaod.data.watchersData = data.watchers;
    schemaDataPaylaod.data.watchers = data.watchers.map((e: User) => e.id);
  }
  else {
    schemaDataPaylaod.data.watchers = [];
  }
  if (data.clientUsers && data.clientUsers.length > 0) {
    schemaDataPaylaod.data.clientUsers = data.clientUsers.map(
      (clientUser: any) => {
        return clientUser.user?.id as string;
      }
    ) as string[];
  }
  else {
    schemaDataPaylaod.data.clientUsers = [];
  }
  if (data.comments.length > 0) {
    schemaDataPaylaod.data.comments = data.comments.map(
      (comment: TaskComments) => {
        return {
          ...comment,
          content: JSON.parse(comment.content as unknown as string),
          isEditing: false
        };
      }
    );
  }
  if (data.conversations?.length) {
    schemaDataPaylaod.data.conversations = data.conversations.map(
      (conversation: Conversation) => {
        return {
          ...conversation,
          content: isJsonStringValid(conversation.content)
            ? JSON.parse(conversation.content as string).content
            : (conversation.content as ContentJSON).content
        };
      }
    );
  }
  return schemaDataPaylaod.data;
}
export async function useTaskUpdate({
  id,
  payload,
  isPortal,
  entityType
}: {
  id: string;
  entityType: EntityType;
  payload: Partial<UpdateTask>;
  isPortal?: boolean;
}) {
  const { data } = await $api.patch<Task>(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}`,
    payload
  );
  return data;
}
export async function useTaskCreate(
  payload: UpdateTaskPayload,
  entityType: EntityType,
  isPortal?: boolean
) {
  const { data } = await $api.post<Task>(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }`,
    payload
  );
  return data;
}
export async function useEntityStatusList(
  type: EntityType,
  isPortal?: boolean
) {
  const { data } = await $api.get<EntityStatus[]>(
    `${isPortal ? 'portal/' : ''}entity-status?entityType=${type}`
  );
  return data;
}
export async function useEntityPriorityList(
  type: EntityType,
  isPortal?: boolean
) {
  const { data } = await $api.get(
    `${isPortal ? 'portal/' : ''}entity-priorities?entityType=${type}`
  );
  return data;
}
export async function useEntityDelete(
  id: string,
  entityType: EntityType,
  isPortal?: boolean
) {
  return await $api.delete<Task>(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}`
  );
}
export async function useTaskUserAdd(
  values: TaskUserAddPayload,
  entityType: EntityType
) {
  const { id, userType, ...payload } = values;
  const { data }
    = userType === 'watcher'
      ? await $api.post<Task>(
          `entities${
            !isPortalUser.value ? `/${entityType}` : ''
          }/${id}/watchers`,
          {
            ...payload
          }
      )
      : userType === 'assignee'
        ? await $api.post<Task>(
          `entities${
            !isPortalUser.value ? `/${entityType}` : ''
          }/${id}/assignees`,
          {
            ...payload
          }
        )
        : await $api.post<Task>(
          `entities${
            !isPortalUser.value ? `/${entityType}` : ''
          }/${id}/clientUsers`,
          {
            ...payload
          }
        );
  return data;
}
export async function useTaskUserDelete(
  payload: TaskUserRemovePayload,
  entityType: EntityType
) {
  const { data } = payload.watcherId
    ? await $api.delete<Task>(
        `entities${!isPortalUser.value ? `/${entityType}` : ''}/${
          payload.id
        }/watchers/${payload.watcherId}`
    )
    : payload.assigneeId
      ? await $api.delete<Task>(
        `entities${!isPortalUser.value ? `/${entityType}` : ''}/${
          payload.id
        }/assignees/${payload.assigneeId}`
      )
      : await $api.post<Task>(
        `entities${!isPortalUser.value ? `/${entityType}` : ''}/${
          payload.id
        }/clientUsers/remove`,
        {
          clientId: payload.clientId,
          userId: payload.userId
        }
      );
  return data;
}
export async function useTaskCommentCreate(
  taskId: string,
  payload: TaskComments,
  isPortal?: boolean
) {
  const { data } = await $api.post<TaskComments>(
    `${isPortal ? 'portal/' : ''}entities/${taskId}/comments`,
    payload
  );
  return {
    ...data,
    content: JSON.parse(data.content as unknown as string),
    isEditing: false
  };
}
export async function useTaskComments(taskId: string, isPortal?: boolean) {
  const { data } = await $api.get<TaskComments[]>(
    `${isPortal ? 'portal/' : ''}entities/${taskId}/comments`
  );
  return data.map(comment => ({
    ...comment,
    content: JSON.parse(comment.content as unknown as string),
    isEditing: false
  }));
}
export async function useTaskCommentUpdate(
  id: string,
  taskId: string,
  payload: TaskComments,
  isPortal?: boolean
) {
  const { data } = await $api.patch<TaskComments>(
    `${isPortal ? 'portal/' : ''}entities/${taskId}/comments/${id}`,
    payload
  );
  return {
    ...data,
    content: JSON.parse(data.content as unknown as string),
    isEditing: false
  };
}
export async function useTaskCommentDelete(
  id: string,
  taskId: string,
  isPortal?: boolean
) {
  const { data } = await $api.delete<TaskComments>(
    `${isPortal ? 'portal/' : ''}entities/${taskId}/comments/${id}`
  );
  return data;
}
export async function useEntitiesUser(clientId = '', projectId = '') {
  const { data } = await $api.get<Task[]>(
    `me/entities?${clientId ? `clientId=${clientId}` : ''}${
      projectId ? `&projectId=${projectId}` : ''
    }`
  );
  return data;
}
export async function useTaskBulkUpdate({
  ids,
  field,
  value,
  isPortal,
  entityType
}: {
  ids: string[];
  field: string;
  value: string;
  entityType: EntityType;
  isPortal?: boolean;
}) {
  const { data } = await $api.patch<void>(
    `${isPortal ? 'portal/' : ''}/entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/bulk-update`,
    {
      ids,
      field,
      value
    }
  );
}
export async function useEntitiesAddAttachment(
  isPortal: boolean,
  id: string,
  entityType: EntityType,
  payload: { attachmentId: string }
) {
  const { data } = await $api.post<Task>(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}/attachments`,
    payload
  );
  return data;
}
export async function useEntitiesDeleteAttachment(
  isPortal: boolean,
  id: string,
  entityType: EntityType,
  attachmentId: string
) {
  const { data } = await $api.delete<Task>(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}/attachments/${attachmentId}`
  );
  return data;
}

export async function useTaskCreateTags(
  isPortal: boolean,
  id: string,
  entityType: EntityType,
  payload: { tagId: string }
) {
  const { data } = await $api.post(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}/tags`,
    payload
  );
  return data;
}

export async function useTaskDeleteTags(
  isPortal: boolean,
  id: string,
  entityType: EntityType,
  tagId: string
) {
  return await $api.delete<Tag>(
    `${isPortal ? 'portal/' : ''}entities${
      !isPortalUser.value ? `/${entityType}` : ''
    }/${id}/tags/${tagId}`
  );
}

export async function useBulkCreateTasks(
  entityType: EntityType,
  payload: { entities: UpdateTaskPayload[] }
) {
  const { data } = await $api.post<Task[]>(
    `entities/${entityType}/bulk-create`,
    payload
  );
  return data;
}

export async function checkAvailability(payload: {
  date: string;
  userId?: string;
}) {
  if (payload.date === undefined || payload.date === null)
    return true;
  const { data } = await $api.post('hrms/check-availability', payload);
  return data;
}

export const useTaskTypeHumanMap: Record<string, string> = {
  TASK: 'Team Task',
  CLIENTTASK: 'Client Request'
};
