import $api from '@/plugins/api';
import type { Feedback, FeedbackCreatePayload } from '@/types/feedback.type';
import type { PaginatedResponse } from '@/types/common.type';

export function useFeedback() {
  const baseUrl = 'feedback';

  const ratingPassthroughOptions = ref(
    {
      root: {
        class: 'flex gap-1 align-items-center'
      },
      onIcon: {
        class: 'ml-0 text-green-500'
      },
      offIcon: {
        class: 'ml-0'
      }
    }
  );

  const ratingOptions = ref({
    readOnly: true, increment: 0.1, starSize: 18, showRating: false
  });

  const createFeedback = async (payload: FeedbackCreatePayload) => {
    const { data } = await $api.post<Feedback>(
      `${baseUrl}`, payload
    );
    return data;
  };

  const getAllFeedbacks = async ({
    page,
    limit,
    filters,
    sortBy,
    isPortalUser
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    isPortalUser?: boolean;
  }) => {
    const { data } = await $api.get<PaginatedResponse<Feedback>>(
      `${isPortalUser ? 'portal/' : ''}${baseUrl}`,
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
  };

  const getOneFeedback = async (id: string) => {
    const { data } = await $api.get<Feedback>(
      `${baseUrl}/${id}`
    );
    return data;
  };

  const remindFeedback = async (id: string) => {
    const { data } = await $api.patch<Feedback>(
      `${baseUrl}/${id}/remind`
    );
    return data;
  };

  const removeFeedback = async (id: string) => {
    const { data } = await $api.delete<Feedback>(
      `${baseUrl}/${id}`
    );
    return data;
  };

  const updateFeedback = async (
    { id, payload }: { id: string;
      payload: Partial<FeedbackCreatePayload>; }
  ) => {
    const { data } = await $api.patch<Feedback>(
      `${baseUrl}/${id}`,
      payload
    );
    return data;
  };

  return {
    ratingPassthroughOptions,
    ratingOptions,
    getAllFeedbacks,
    getOneFeedback,
    remindFeedback,
    updateFeedback,
    createFeedback,
    removeFeedback
  };
}
