import $api from '@/plugins/api';
import type { CreateEntityTimer, TimerObj } from '@/types/timer.type';
import type { PaginatedResponse } from '@/types/common.type';

export function useTimer() {
  const start = async (payload: CreateEntityTimer) => {
    const { data } = await $api.post<TimerObj>('entity-timer', payload);
    return data;
  };
  const stop = async (payload: CreateEntityTimer & { id: string }) => {
    const { data } = await $api.put<TimerObj>(`entity-timer/${payload.id}`, {
      entityId: payload.entityId,
      timeSpent: payload.timeSpent
    });
    return data;
  };

  const timerList = async ({
    page,
    limit,
    isCompleted,
    filters
  }: {
    page?: number;
    limit?: number;
    isCompleted?: boolean;
    filters?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<TimerObj>>(
      'entity-timer',
      {
        params: {
          page,
          limit,
          isCompleted,
          filters
        }
      }
    );
    const isActiveTimer = data.results?.some(
      (timerData: TimerObj) => !timerData.isCompleted
    );
    const activeTimer = data.results?.find(
      (timerData: TimerObj) => !timerData.isCompleted
    );
    return { data, isActiveTimer, activeTimer };
  };

  // const isTimerActive = computed(() => timerList().)

  return {
    start,
    stop,
    timerList
  };
}
