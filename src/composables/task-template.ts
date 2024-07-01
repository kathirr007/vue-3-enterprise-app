import $api from '@/plugins/api';
import type {
  ContentJSON,
  CustomAxiosRequestConfig,
} from '@/types/common.type';
import type {
  TaskTemplate,
  CreateTaskTemplatePayload,
  TaskTemplatePayload,
  TaskAttachment,
} from '@/types/task-template.type';

const { isJsonStringValid } = useUtilityFns();

export async function useTaskTemplateList(serviceId: string) {
  let { data } = await $api.get<TaskTemplate[]>(
    `services/${serviceId}/entity-templates`
  );
  data = data.map((item: TaskTemplate) => ({
    ...item,
    description: isJsonStringValid(item.description)
      ? JSON.parse(item.description as string)?.content
      : (item.description as unknown as ContentJSON)?.content,
    attachmentIds: item.attachments.map(
      (attachment: TaskAttachment) => attachment.id
    ),
  }));
  return data;
}

export async function useTaskTemplateDetails({
  serviceId,
  id,
}: {
  serviceId: string;
  id: string;
}) {
  const { data } = await $api.get<TaskTemplate>(
    `services/${serviceId}/entity-templates/${id}`
  );
  return data;
}

export async function useTaskTemplateCreate({
  serviceId,
  payload,
}: {
  serviceId: string;
  payload: TaskTemplatePayload;
}) {
  const { data } = await $api.post<TaskTemplate>(
    `services/${serviceId}/entity-templates`,
    payload,
    {
      catchErrors: false,
    } as CustomAxiosRequestConfig
  );
  return data;
}

export async function useTaskTemplateUpdate({
  serviceId,
  id,
  payload,
}: {
  serviceId: string;
  id: string;
  payload: TaskTemplatePayload;
}) {
  const { data } = await $api.patch<TaskTemplate>(
    `services/${serviceId}/entity-templates/${id}`,
    payload,
    {
      catchErrors: false,
    } as CustomAxiosRequestConfig
  );
  return data;
}

export async function useTaskTemplateAddAttachment({
  serviceId,
  id,
  payload,
}: {
  serviceId: string;
  id: string;
  payload: { attachmentId: string };
}) {
  const { data } = await $api.post<TaskTemplate>(
    `services/${serviceId}/entity-templates/${id}/attachments`,
    payload
  );
  return data;
}

export async function useTaskTemplateRemoveAttachment({
  serviceId,
  id,
  attachmentId,
}: {
  serviceId: string;
  id: string;
  attachmentId: string;
}) {
  const { data } = await $api.delete<TaskTemplate>(
    `services/${serviceId}/entity-templates/${id}/attachments/${attachmentId}`
  );
  return data;
}

export async function useTaskTemplateRemove(serviceId: string, id: string) {
  return await $api.delete(`services/${serviceId}/entity-templates/${id}`);
}
