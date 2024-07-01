import $api from '@/plugins/api';
import type { TimelogCreateInput, TimelogUpdateInput } from '@/types/timelog.type';
import type { TimerObj } from '@/types/timer.type';

export function useTimelog() {
  const createOne = async (payload: TimelogCreateInput) => {
    const modifiedPayload = {
      ...payload,
      title: payload.taskTitle
    };
    delete modifiedPayload.taskTitle;
    const { data } = await $api.post<TimerObj>('entity-timer/timelog', modifiedPayload);
    return data;
  };

  const update = async (id: string, payload: TimelogUpdateInput) => {
    const { data } = await $api.patch(`entity-timer/timelog/${id}`, payload);
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete(`entity-timer/${id}`);
    return data;
  };

  return {
    createOne,
    update,
    remove
  };
}
