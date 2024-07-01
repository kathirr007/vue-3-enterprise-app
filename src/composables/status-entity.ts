import $api from '@/plugins/api';
import type { EntityStatus } from '@/types/status-entity.type';

export async function useStatusList(isPortal?: boolean) {
  const { data } = await $api.get<EntityStatus[]>(
    `${isPortal ? 'portal/' : ''}entity-status`
  );
  return data;
}
