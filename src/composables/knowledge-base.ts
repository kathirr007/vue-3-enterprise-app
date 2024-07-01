import $api from '@/plugins/api';
import type {
  Category,
  CreateQuery,
  FAQ,
  KnowledgeBaseMessages
} from '@/types/knowlege-base.type';

export function useKnowledgeBase() {
  const getCategories = async () => {
    const { data } = await $api.get<Category[]>('knowledge-base/categories');
    return data;
  };

  const getFAQs = async (catogery: string) => {
    const { data } = await $api.get<FAQ[]>(
      `knowledge-base/categories/${catogery}`
    );
    return data;
  };

  const getAnswer = async (threadId: number, payload?: CreateQuery) => {
    const { data } = await $api.post<KnowledgeBaseMessages>(
      `knowledge-base/threads/${threadId}/messages`,
      payload
    );
    return data;
  };

  const getThreadId = async () => {
    const { data } = await $api.post(`knowledge-base/threads`);
    return data;
  };

  const sendFeedback = async ({ threadId, messageId, payload }: { threadId: number;messageId: number;payload: { rating: number;feedback_description?: string } }) => {
    const { data } = await $api.post(`knowledge-base/threads/${threadId}/messages/${messageId}/feedback`, payload);
    return data;
  };

  return { getCategories, getFAQs, getAnswer, getThreadId, sendFeedback };
}
