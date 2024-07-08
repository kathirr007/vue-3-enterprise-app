import $api from '@/plugins/api';
import type { FromEmail, FromEmailCreateInput } from '@/types/fromemail.type';

export function useFromEmail() {
  const getAll = async () => {
    const { data } = await $api.get<FromEmail[]>('smtp-from-email');
    return data;
  };

  const createOne = async (payload: FromEmailCreateInput) => {
    const { data } = await $api.post<FromEmail>('smtp-from-email', payload);
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<FromEmail>(`smtp-from-email/${id}`);
    return data;
  };

  const update = async (id: string, payload: Partial<FromEmailCreateInput>) => {
    const { data } = await $api.patch<FromEmail>(
      `smtp-from-email/${id}`,
      payload
    );
    return data;
  };

  return {
    getAll,
    remove,
    createOne,
    update
  };
}
