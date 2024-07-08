import $api from '@/plugins/api';
import type { Invoice } from '@/types/invoices.type';
import type { PaginatedResponse } from '@/types/common.type';

export async function useInvoicesList({
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
  const { data } = await $api.get<PaginatedResponse<Invoice>>('invoices', {
    params: {
      page,
      limit,
      filters,
      sortBy
    }
  });
  return data;
}

export async function useDownloadInvoice(id: string) {
  const { data } = await $api.get<Invoice>(`invoices/${id}`);
  return data;
}
