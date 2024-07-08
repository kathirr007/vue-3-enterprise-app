import $api from '@/plugins/api';
import type {
  Broadcast,
  BroadcastTemplate,
  BroadcastTemplateMessage,
  CreateBroadcast,
  CreateBroadcastTemplate,
  Month,
  TemplateMessagePayload,
  Week
} from '@/types/broadcast.type';
import type { PaginatedResponse } from '@/types/common.type';

const { isJsonStringValid } = useUtilityFns();

export async function useBroadcastList() {
  const { data } = await $api.get<Broadcast[]>('broadcasts');
  return data;
}
export async function useBroadcastListV2({
  page,
  limit,
  filters,
  sortBy
}: {
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
}) {
  const { data } = await $api.get<PaginatedResponse<Broadcast>>('broadcasts', {
    params: {
      page,
      limit,
      filters,
      sortBy
    }
  });
  return data;
}
export async function useBroadcastDetails(id: string) {
  const { data } = await $api.get<Broadcast>(`broadcasts/${id}`);
  const refactoredData = { ...data };
  if (data.body) {
    refactoredData.body = isJsonStringValid(refactoredData.body as string)
      ? JSON.parse(refactoredData.body as string).content
      : refactoredData.body;
  }
  if (
    data.template
    && (data.template?.messages as BroadcastTemplateMessage[])?.length > 0
  ) {
    const messages = data.template?.messages as BroadcastTemplateMessage[];
    refactoredData.type = messages[0].type;
    refactoredData.broadcastTemplateId = data.template?.id;
  }
  refactoredData.scheduleBroadcast
    = data.status === 'COMPLETED' ? 'now' : 'later';
  refactoredData.isRecurring = data.isRecurring ? 'repeat' : 'once';
  if (data.isRecurring && data.recurringBroadcast) {
    refactoredData.interval = data.recurringBroadcast?.interval;
  }

  if (data.clients) {
    refactoredData.clientType = Object.keys(data.clients)[0];
    refactoredData.clientsPayload
      = data.clients[refactoredData.clientType];
  }
  if (data.teamMembers) {
    refactoredData.teamMemberType = Object.keys(data.teamMembers)[0];
    refactoredData.teamMembersPayload
      = data.teamMembers[refactoredData.teamMemberType];
  }

  return refactoredData;
}
export async function useBroadcastTemplateList(channel?: string) {
  const { data } = await $api.get<BroadcastTemplate[]>(
    `templates/broadcasts${channel ? `?channel=${channel}` : ''}`
  );
  return data;
}
export async function useBroadcastTemplateListV2({
  page,
  limit,
  filters,
  sortBy,
  channel
}: {
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
  channel?: string;
}) {
  const decodedFilter = useDecodeFilterData(filters);
  const { 'Date Range': dateRange, ...rest } = decodedFilter;
  const filtersString = useEncodeFilterData(rest);
  const { data } = await $api.get<PaginatedResponse<BroadcastTemplate>>(
    `templates/broadcasts${channel ? `?channel=${channel}` : ''}`,
    {
      params: {
        page,
        limit,
        filters: filtersString,
        sortBy
      }
    }
  );

  return data;
}

export async function useBroadcastTemplateCreate(
  payload: CreateBroadcastTemplate
) {
  const { data } = await $api.post<BroadcastTemplate>(
    'templates/broadcasts',
    payload
  );
  return data;
}
export async function useBroadcastCreate(payload: CreateBroadcast) {
  const { data } = await $api.post('broadcasts', payload);
  return data;
}
export async function useBroadcastTemplateUpdate(
  payload: CreateBroadcastTemplate,
  id: string
) {
  const { data } = await $api.patch<BroadcastTemplate>(
    `templates/broadcasts/${id}`,
    payload
  );
  return data;
}
export async function useBroadcastTemplateDelete(id: string) {
  const { data } = await $api.delete(`templates/broadcasts/${id}`);
  return data;
}
export async function useBroadcastDelete(id: string) {
  const { data } = await $api.delete(`broadcasts/${id}`);
  return data;
}
export async function useBroadcastTemplateMessage(
  id: string,
  payload: TemplateMessagePayload
) {
  const { data } = await $api.put(
    `templates/broadcasts/${id}/messages`,
    payload
  );
  return data;
}

export async function useBroadcastTemplate(id: string) {
  const { data } = await $api.get<BroadcastTemplate>(
    `templates/broadcasts/${id}`
  );
  if (data?.messages && data.messages?.length > 0) {
    data.messages = data.messages?.map((message) => {
      if (isJsonStringValid(message.body)) {
        message.body = JSON.parse(message.body as string).content;
      }
      return message;
    });
  }
  return data;
}

export async function useBroadcastUpdate(payload: CreateBroadcast, id: string) {
  const { data } = await $api.patch(`broadcasts/${id}`, payload);
  return data;
}

export async function useBroadcastRemoveAttachment({
  broadcastId,
  attachmentId
}: {
  broadcastId: string;
  attachmentId: string;
}) {
  const { data } = await $api.delete(
    `broadcasts/${broadcastId}/attachments/${attachmentId}`
  );
  return data;
}

export async function useBroadcastTemplateRemoveAttachment({
  broadcastTemplateId,
  attachmentId
}: {
  broadcastTemplateId: string;
  attachmentId: string;
}) {
  const { data } = await $api.delete(
    `templates/broadcasts/${broadcastTemplateId}/attachments/${attachmentId}`
  );
  return data;
}

export async function useBroadcastMessageDetails({
  broadcastMessageId,
  isTemplate,
  userId,
  email
}: {
  broadcastMessageId: string;
  isTemplate: string;
  userId: string;
  email: string;
}) {
  const data = await $api.get(
    `broadcasts/details/${broadcastMessageId}?userId=${userId}&email=${email}&isTemplate=${isTemplate}`
  );
  return data;
}

export function useRecurringBroadcast() {
  const weekOptions: Week[] = [
    { label: 'Sunday', value: 0 },
    { label: 'Monday', value: 1 },
    { label: 'Tuesday', value: 2 },
    { label: 'Wednesday', value: 3 },
    { label: 'Thursday', value: 4 },
    { label: 'Friday', value: 5 },
    { label: 'Saturday', value: 6 }
  ];

  const monthOptions: Month[] = [
    { label: 'January', value: 0, maxDays: 31 },
    { label: 'February', value: 1, maxDays: 28 },
    { label: 'March', value: 2, maxDays: 31 },
    { label: 'April', value: 3, maxDays: 30 },
    { label: 'May', value: 4, maxDays: 31 },
    { label: 'June', value: 5, maxDays: 30 },
    { label: 'July', value: 6, maxDays: 31 },
    { label: 'August', value: 7, maxDays: 31 },
    { label: 'September', value: 8, maxDays: 30 },
    { label: 'October', value: 9, maxDays: 31 },
    { label: 'November', value: 10, maxDays: 30 },
    { label: 'December', value: 11, maxDays: 31 }
  ];
  return { weekOptions, monthOptions };
}
