import $api from '@/plugins/api';
import type {
  CLientBillingPaymentTiles,
  ClientBillingPayment
} from '@/types/client-billing-payment.type';
import type { PaginatedResponse } from '@/types/common.type';

export function useClientBillingPayments() {
  const getAll = async ({
    page,
    limit,
    filters,
    billingProfileId,
    clientId
  }: {
    billingProfileId: string;
    page?: number;
    limit?: number;
    filters?: string;
    clientId?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<ClientBillingPayment>>(
      `payments/${billingProfileId}`,
      {
        params: {
          page,
          limit,
          filters,
          clientId
        }
      }
    );
    return data;
  };

  const getTilesData = async ({
    billingProfileId,
    clientId
  }: {
    billingProfileId: string;
    clientId?: string;
  }) => {
    const { data } = await $api.get<CLientBillingPaymentTiles>(
      `payments/${billingProfileId}/matrix`,
      {
        params: {
          clientId
        }
      }
    );
    return data;
  };

  const paymentModes: Record<string, string> = {
    CASH: 'Cash',
    ONLINE: 'Online',
    CHEQUE: 'Cheque',
    PAYPAL: 'Paypal',
    STRIPE: 'Stripe',
    OTHER: 'Other'
  };
  return { getAll, getTilesData, paymentModes };
}
