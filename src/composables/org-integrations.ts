import $api from '@/plugins/api';
import type {
  CreateOrgIntegrationPayload,
  OrgIntegration
} from '@/types/integrations.type';

export function useOrgIntegrations() {
  const baseUrl = 'org-integrations';
  const getAll = async () => {
    const { data } = await $api.get<OrgIntegration[]>(`${baseUrl}`);
    return data;
  };

  const getAllPendingIntegrations = async () => {
    const { data } = await $api.get<Partial<OrgIntegration>[]>(
      `${baseUrl}/pending-org-integrations`
    );
    return data;
  };

  const getAllOrgIntegrationSteps = async (id: string) => {
    const { data } = await $api.get<Partial<OrgIntegration>[]>(
      `${baseUrl}/${id}/org-integration-steps`
    );
    return data;
  };

  const markAsStepComplete = async ({
    id,
    orgIntegrationStepId,
    payload
  }: {
    id: string;
    orgIntegrationStepId: string;
    payload: { status: number };
  }) => {
    const { data } = await $api.patch<Partial<OrgIntegration>[]>(
      `${baseUrl}/${id}/mark-step-complete/${orgIntegrationStepId}`,
      payload
    );
    return data;
  };

  const getOne = async (id: string) => {
    const { data } = await $api.get<OrgIntegration>(`${baseUrl}/${id}`);
    return data;
  };

  const create = async (payload: CreateOrgIntegrationPayload) => {
    const { data } = await $api.post<OrgIntegration>(`${baseUrl}`, payload);
    return data;
  };

  const update = async (
    id: string,
    payload: Partial<CreateOrgIntegrationPayload>
  ) => {
    const { data } = await $api.post<OrgIntegration>(
      `${baseUrl}/${id}`,
      payload
    );
    return data;
  };

  const remove = async (id: string) => {
    const { data } = await $api.delete<OrgIntegration>(`${baseUrl}/${id}`);
    return data;
  };

  return {
    getAll,
    getOne,
    getAllPendingIntegrations,
    getAllOrgIntegrationSteps,
    create,
    update,
    markAsStepComplete,
    remove
  };
}
