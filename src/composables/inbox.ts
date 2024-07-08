import $api from '@/plugins/api';
import type { ContentJSON, PaginatedResponse } from '@/types/common.type';
import type {
  AttachTaskPayload,
  Contact,
  Conversation,
  ConversationCreatePayload,
  DetachTask,
  GenerateSuggestionPayload,
  GenerateSummaryPayload,
  GeneratedResponse,
  Inbox,
  InboxCreatePayload,
  SuggestMessagePayload,
  Thread,
  ThreadCreatePayload,
  ThreadType
} from '@/types/inbox.type';

const { isJsonStringValid } = useUtilityFns();

export async function useInboxList(isPortal?: boolean) {
  const { data } = await $api.get<Inbox[]>(`${isPortal ? 'portal/' : ''}inbox`);
  return data;
}

export async function useInboxContacts() {
  const { data } = await $api.get<Contact[]>('contacts');
  return data;
}

export async function useInboxCreate(payload: InboxCreatePayload) {
  const { data } = await $api.post('inbox', payload);
  return data;
}

export async function useInboxUpdate(
  id: string,
  payload: Partial<InboxCreatePayload>
) {
  const { data } = await $api.patch(`inbox/${id}`, payload);
  return data;
}

export async function useThreadList({
  inboxId,
  page,
  limit,
  filters,
  isPortal,
  clientId,
  threadType
}: {
  inboxId: string;
  page?: number;
  limit?: number;
  filters?: string;
  isPortal?: boolean;
  clientId?: string;
  threadType?: ThreadType;
}) {
  const { data } = await $api.get<PaginatedResponse<Thread>>(
    `${isPortal ? 'portal/' : ''}inbox/${inboxId}/threads?${
      threadType ? `threadType=${threadType}` : ''
    }`,
    {
      params: {
        page,
        limit,
        filters
      }
    }
  );
  data.results = data.results.map((thread) => {
    return {
      ...thread,
      displayExcerpt:
        thread.displayExcerpt && isJsonStringValid(thread.displayExcerpt)
          ? JSON.parse(thread.displayExcerpt).content
          : thread.displayExcerpt
    };
  });
  return data;
}

export async function useThread(
  inboxId: string,
  threadId: string,
  isPortal?: boolean
) {
  const { data } = await $api.get<Thread>(
    `${isPortal ? 'portal/' : ''}inbox/${inboxId}/threads/${threadId}`
  );

  return data;
}

export async function useConversationList({
  inboxId,
  threadId,
  isPortal
}: {
  inboxId: string;
  threadId: string;
  isPortal?: boolean;
}) {
  const { data } = await $api.get<Conversation[]>(
    `${
      isPortal ? 'portal/' : ''
    }inbox/${inboxId}/threads/${threadId}/conversations`
  );
  return data.map((conversation) => {
    return {
      ...conversation,
      content: isJsonStringValid(conversation.content)
        ? JSON.parse(conversation.content as string).content
        : (conversation.content as ContentJSON).content,
      isCollapsed: true
    };
  });
}

export async function useThreadCreate(
  payload: ThreadCreatePayload,
  inboxId: string
) {
  const { data } = await $api.post(`/inbox/${inboxId}/threads`, payload);
  return data;
}

export async function useAttachTask(
  payload: AttachTaskPayload,
  inboxId: string,
  threadId: string
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/attach-task`,
    payload
  );
  return data;
}
export async function useDetachTask(
  payload: DetachTask,
  inboxId: string,
  threadId: string
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/detach-task`,
    payload
  );
  return data;
}

export async function useAttachClient(
  payload: { clientId: string },
  inboxId: string,
  threadId: string
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/attach-client`,
    payload
  );
  return data;
}
export async function useDetachClient(
  payload: { clientId: string },
  inboxId: string,
  threadId: string
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/detach-client`,
    payload
  );
  return data;
}
export async function useDetachProject(
  payload: { projectId: string },
  inboxId: string,
  threadId: string
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/detach-project`,
    payload
  );
  return data;
}

export async function useAttachProject(
  payload: { projectId: string },
  inboxId: string,
  threadId: string
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/attach-project`,
    payload
  );
  return data;
}

export async function useAddAgentToThread(
  inboxId: string,
  threadId: string,
  payload: { agent: { uid: string } }
) {
  const { data } = await $api.post(
    `/inbox/${inboxId}/threads/${threadId}/attach-agent`,
    payload
  );
  return data;
}
export async function useRemoveAgentToThread(
  inboxId: string,
  threadId: string,
  agentId: string
) {
  const { data } = await $api.patch(
    `/inbox/${inboxId}/threads/${threadId}/detach-agent/${agentId}`
  );
  return data;
}

export async function useConversationCreate(
  payload: ConversationCreatePayload,
  inboxId: string,
  threadId: string,
  isPortal?: boolean
) {
  const { data } = await $api.post(
    `${
      isPortal ? 'portal' : ''
    }/inbox/${inboxId}/threads/${threadId}/conversations`,
    payload
  );
  return data;
}

export async function useRemoveInboxAttachments(
  attachmentId: string,
  isPortal?: boolean
) {
  const { data } = await $api.delete(
    `${isPortal ? 'portal' : ''}/inbox/attachments/${attachmentId}`
  );
  return data;
}
export async function useGenerateSuggestion(
  payload: GenerateSuggestionPayload,
  isPortal?: boolean
) {
  const { data } = await $api.post<GeneratedResponse[]>(
    `${isPortal ? 'portal' : ''}/brightassist/rewrite`,
    payload
  );
  return data.map((e) => {
    return {
      ...e,
      html:
        isJsonStringValid(e.html) && e.html.includes('{')
          ? JSON.parse(e.html as string).data?.content
          : e.html
    };
  });
}

export async function useArchiveThread(inboxId: string, threadId: string) {
  const { data } = await $api.patch(
    `/inbox/${inboxId}/threads/${threadId}/archive`
  );
  return data;
}

export async function useRestoreThread(inboxId: string, threadId: string) {
  const { data } = await $api.patch(
    `/inbox/${inboxId}/threads/${threadId}/restore`
  );
  return data;
}

export function useBrightAssist() {
  const baseUrl = `brightassist`;
  const getSummary = async (
    payload: GenerateSummaryPayload,
    isPortal?: boolean
  ) => {
    const { data } = await $api.post<GeneratedResponse[]>(
      `${isPortal ? 'portal' : ''}/${baseUrl}/summarize`,
      payload
    );
    return data.map((e) => {
      return {
        ...e,
        html:
          isJsonStringValid(e.html) && e.html.includes('{')
            ? JSON.parse(e.html as string).data?.content
            : e.html
      };
    });
  };
  const getAutoreplySuggestions = async (
    payload: SuggestMessagePayload,
    isPortal?: boolean
  ) => {
    const { data } = await $api.post<GeneratedResponse[]>(
      `${isPortal ? 'portal' : ''}/${baseUrl}/suggest-message`,
      payload
    );
    return data.map((e) => {
      return {
        ...e,
        html:
          isJsonStringValid(e.html) && e.html.includes('{')
            ? JSON.parse(e.html as string).data?.content
            : e.html
      };
    });
  };

  return {
    getSummary,
    getAutoreplySuggestions
  };
}
