import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type { AuditLog } from '@/types/audit-log.type';

export const useAuditLog = () => {
  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
    format,
  }: {
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
    format?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<AuditLog>>('audit-logs', {
      params: {
        page,
        limit,
        filters,
        sortBy,
        format,
      },
    });
    return data;
  };
  const getOne = async () => {
    const { data } = await $api.get('audit-logs/audit-log-filters');
    return data;
  };
  return {
    getAll,
    getOne,
  };
};
