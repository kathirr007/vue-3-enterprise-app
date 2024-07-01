import $api from '@/plugins/api';
import type { PaginatedResponse } from '@/types/common.type';
import type {
  ClientBillingProfile,
  CreateProfileClientPayload,
  CreateProfileDetailsPayload,
  CreateProfilePayload
} from '@/types/client-billing.type';
import type { Client } from '@/types/client.type';

const { titleCase } = useVueFilters();

export function useClientBilling() {
  const baseUrl = `billing-profile`;
  const getAll = async ({
    page,
    limit,
    filters
  }: {
    page?: number;
    limit?: number;
    filters?: string;
  }) => {
    const { data } = await $api.get<PaginatedResponse<ClientBillingProfile>>(
      `${baseUrl}`,
      {
        params: {
          page,
          limit,
          filters
        }
      }
    );
    return data;
  };
  const getOne = async (id: string) => {
    const { data } = await $api.get<ClientBillingProfile>(
      `${baseUrl}/${id}`
    );

    const refactorData = {
      name: data.name,
      city: data.address?.city,
      country: data.address?.country,
      state: data.address?.state,
      address: data.address?.street || undefined,
      zipcode: data.address?.zipcode,
      logo: data.logo,
      email: data.meta?.email,
      dueInDays: data.meta?.dueInDays,
      invoiceNumber: data.meta?.invoiceNumber,
      taxNo: data.meta?.taxNo,
      isPaymentGatewayIntegrated: data.isPaymentGatewayIntegrated,
      orgIntegrationId: data.orgIntegration?.integrationId,
      orgIntegration: data.orgIntegration,
      unitInMinutes: data.unitInMinutes
    };
    return refactorData;
  };
  const getClientsWithoutBillingProfile = async () => {
    const { data } = await $api.get<Client[]>(
      `${baseUrl}/clients-not-associated-with-billing-profile`
    );

    return data;
  };
  const createOne = async (payload: CreateProfilePayload) => {
    const { data } = await $api.post<ClientBillingProfile>(
      `${baseUrl}`,
      payload
    );
    return data;
  };
  const update = async (
    id: string,
    payload: Partial<CreateProfileDetailsPayload>
  ) => {
    const { data } = await $api.patch<ClientBillingProfile>(
      `${baseUrl}/${id}`,
      payload
    );
    return data;
  };
  const remove = async (id: string) => {
    const { data } = await $api.delete<ClientBillingProfile>(
      `${baseUrl}/${id}`
    );
    return data;
  };
  const attachClient = async (
    id: string,
    payload: Partial<CreateProfileClientPayload>
  ) => {
    const { data } = await $api.patch(
      `${baseUrl}/${id}/attach-client`,
      payload
    );
    return data;
  };
  const detachClient = async (
    id: string,
    payload: Partial<CreateProfileClientPayload>
  ) => {
    const { data } = await $api.patch(
      `${baseUrl}/${id}/detach-client`,
      payload
    );
    return data;
  };
  const getOneClients = async (id: string) => {
    const { data } = await $api.get<Client[]>(`${baseUrl}/${id}/clients`);
    return data;
  };
  const removeLogoPicture = async (id: string, logoPictureId: string) => {
    const data = await $api.delete(
      `${baseUrl}/${id}/logo/${logoPictureId}`
    );
    return data;
  };

  return {
    getAll,
    getOne,
    createOne,
    update,
    remove,
    attachClient,
    detachClient,
    getOneClients,
    getClientsWithoutBillingProfile,
    removeLogoPicture
  };
}
