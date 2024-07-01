import $api from '@/plugins/api';
import type { MetaObj, PaginatedResponse } from '@/types/common.type';
import type {
  ClientBillingInvoice,
  CreatePaymentPayload,
  GenerateInvoicePayload,
  InvoiceTemplate
} from '@/types/client-billing-invoices.type';
import type { FullNameObj } from '@/types/teams.type';
import type { Task } from '@/types/tasks.type';

export function useClientBillingInvoices() {
  const baseUrl = 'invoices';
  const { fullName } = useVueFilters();

  const getAll = async ({
    page,
    limit,
    filters,
    sortBy,
    billingProfileId
  }: {
    billingProfileId: string;
    page?: number;
    limit?: number;
    filters?: string;
    sortBy?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<ClientBillingInvoice>>(
      `${baseUrl}/${billingProfileId}/all`,
      {
        params: {
          page,
          limit,
          filters,
          sortBy
        }
      }
    );
    const { results } = data;
    data.results = results.map((item: ClientBillingInvoice) => ({
      ...item,
      raisedBy: {
        ...item.raisedBy,
        name: fullName(item.raisedBy as unknown as FullNameObj)
      }
    }));
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<ClientBillingInvoice>(`${baseUrl}/${id}`);

    return data;
  };

  const getInvoiceHtml = async (id: string) => {
    const { data } = await $api.get<ClientBillingInvoice>(
      `${baseUrl}/${id}/html`
    );

    return data;
  };

  const getInvoiceTemplate = async (id: string) => {
    const { data } = await $api.get<InvoiceTemplate>(
      `${baseUrl}/${id}/template-data`
    );

    return data;
  };

  const downloadInvoice = async (id: string) => {
    const { data } = await $api.get<ClientBillingInvoice>(
      `${baseUrl}/${id}/download`
    );

    return data;
  };

  const createOne = async (
    payload: GenerateInvoicePayload,
    isShared?: boolean
  ) => {
    const { data } = await $api.post<ClientBillingInvoice>(
      `${isShared ? `${baseUrl}?isShared=${isShared}` : `${baseUrl}`}`,
      payload
    );
    return data;
  };
  const update = async (
    id: string,
    payload: Partial<GenerateInvoicePayload>,
    isShared?: boolean
  ) => {
    const { data } = await $api.patch<ClientBillingInvoice>(
      `${isShared ? `${baseUrl}/${id}?isShared=${isShared}` : `${baseUrl}/${id}`}`,
      payload
    );
    return data;
  };

  const markAsPaid = async ({
    id,
    payload
  }: {
    id: string;
    payload: CreatePaymentPayload;
  }) => {
    const { data } = await $api.post(`${baseUrl}/${id}/mark-paid`, payload);
    return data;
  };
  const removeInvoice = async (id: string) => {
    const { data } = await $api.delete<ClientBillingInvoice>(`${baseUrl}/${id}`);
    return data;
  };

  const shareInvoice = async (id: string) => {
    const { data } = await $api.post<ClientBillingInvoice>(
      `${baseUrl}/${id}/share`
    );
    return data;
  };

  const remindInvoice = async (id: string) => {
    const { data } = await $api.post<ClientBillingInvoice>(
      `${baseUrl}/${id}/remind`
    );
    return data;
  };

  const getTasksForBillingProfile = async (id: string) => {
    const { data } = await $api.get<Task[]>(`${baseUrl}/get-tasks-for-billing`);
    return data;
  };
  const getTaskBillingDetails = async (id: string) => {
    const { data } = await $api.get<Task>(`${baseUrl}/${id}/get-task-detail`);
    if (data.meta && data.meta.length > 0) {
      data.meta.forEach((meta: MetaObj) => {
        data[meta.metaKey] = meta.metaValue;
      });
    }
    return data;
  };

  return {
    getAll,
    getOne,
    getInvoiceHtml,
    getInvoiceTemplate,
    createOne,
    update,
    downloadInvoice,
    removeInvoice,
    markAsPaid,
    shareInvoice,
    remindInvoice,
    getTasksForBillingProfile,
    getTaskBillingDetails
  };
}
