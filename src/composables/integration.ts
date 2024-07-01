import $api from '@/plugins/api';
import type {
  InvoiceEstimate,
  InvoiceEstimatePayload,
} from '@/types/integration.type';

export async function useEstimateList(id: string) {
  const { data } = await $api.get<InvoiceEstimate>(
    `integrations/quickbooks/estimate/${id}`
  );
  return data;
}

export async function useInvoiceEstimateCreate(
  payload: InvoiceEstimatePayload
) {
  const { data } = await $api.post<string>(
    'integrations/quickbooks/estimate',
    payload
  );
  return data;
}
