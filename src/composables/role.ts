import $api from '@/plugins/api';
import type { Role } from '@/types/role.type';

export async function useRolesList(filters?: string) {
  const { data } = await $api.get<Role[]>(
    `roles?${filters ? `filters=${filters}` : ''}`
  );
  return data;
}
