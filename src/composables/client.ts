import $api from '@/plugins/api';
import type {
  Client,
  ClientAddCollaboratorsPayload,
  ClientServices,
  ClientStateCreatePayload,
  ClientStatesPayload,
  ClientStatesResponse,
  ClientUpdatePayload,
  ClientUser,
  Collaborator,
  CommonClientService,
  CommonClientState,
  CommonUser,
  Contract,
  CreateBulkClient,
  CreateClientPayload,
  CreateContract,
  ShareContractPayload,
  WorkingTeam,
  genEngagementLetterPayload
} from '@/types/client.type';
import { ClientInfoPayloadSchema } from '@/types/client.type';
import type { Tag } from '@/types/tags.type';
import type { PaginatedResponse } from '@/types/common.type';
import type { User } from '@/types/teams.type';

import { useQuery } from 'vue-query';

const { maskedCode } = useUtilityFns();

export async function useClientList() {
  const { data } = await $api.get<Client[]>('clients');
  return data;
}

export async function useClientListV2({
  page,
  limit,
  filters,
  sortBy,
  isPortal
}: {
  page?: number;
  limit?: number;
  filters?: string;
  sortBy?: string;
  isPortal?: boolean;
}) {
  const { data } = await $api.get<PaginatedResponse<Client>>(
    `${isPortal ? 'portal/' : ''}clients`,
    {
      params: {
        page,
        limit,
        filters,
        sortBy
      }
    }
  );
  return data;
}
export async function useCreateClient(payload: CreateClientPayload) {
  const { data } = await $api.post<Client>(`clients`, payload);
  return data;
}

export async function useClientCreateUpdate(
  values: ClientUpdatePayload & { [key: string]: unknown },
  id: string | string[] | null
) {
  const valuesToExtract = [
    ...Object.keys(ClientInfoPayloadSchema.fields),
    'clientUsers',
    'engagementLetterStatus',
    'relationshipManagerId'
  ];

  let payload: { [key: string]: unknown } = {};

  for (const i in valuesToExtract) {
    payload[valuesToExtract[i]] = values[valuesToExtract[i]];
  }
  if (payload.clientUsers) {
    const clientUsers = (payload.clientUsers as unknown as ClientUser[])?.map(
      (clientUser: ClientUser) => ({
        email: clientUser.email || clientUser.user?.email,
        firstName: clientUser.firstName || clientUser.user?.firstName
      })
    );

    payload = { ...payload, clientUsers: [...clientUsers] };
  }
  const { data } = await $api.patch<Client>(`clients/${id}`, payload);
  return data;
}

export async function useCaseClosure({ id, payload }: { id: string;payload: { isClosed: boolean } }) {
  const { data } = await $api.patch<Client>(`clients/${id}`, payload);
  return data;
};

export async function useClientUserRolesList(clientId: string) {
  const { data } = await $api.get(`clients/${clientId}/client-user-roles`);
  return data;
}
export async function useClientUserCreate({
  clientId,
  payload
}: {
  clientId: string | string[] | null;
  payload: CommonUser;
}) {
  const { data } = await $api.post(`clients/${clientId}/client-users`, payload);
  return data;
}
export async function useClientuserEdit({
  clientId,
  id,
  payload
}: {
  clientId: string | string[] | null;
  id: string;
  payload: CommonUser;
}) {
  const { data } = await $api.patch(
    `clients/${clientId}/client-users/${id}`,
    payload
  );
  return data;
}

export async function useClientUserUpdate({
  clientId,
  id,
  payload
}: {
  clientId: string;
  id: string;
  payload: CommonUser;
}) {
  const { data } = await $api.patch(
    `clients/${clientId}/client-users/${id}`,
    payload
  );
  return data;
}
export async function useClientUserDisable({
  clientId,
  id,
  payload
}: {
  clientId: string;
  id: string;
  payload?: { newUserId: string };
}) {
  const { data } = await $api.patch(
    `clients/${clientId}/client-users/${id}/disable`,
    payload
  );
  return data;
}
export async function useClientUserEnable({
  clientId,
  id
}: {
  clientId: string;
  id: string;
}) {
  const { data } = await $api.patch(
    `clients/${clientId}/client-users/${id}/enable`
  );
  return data;
}
export async function useMakeClientUserAsAuth({
  clientId,
  id
}: {
  clientId: string;
  id: string;
}) {
  const { data } = await $api.patch(
    `clients/${clientId}/client-users/${id}/make-authorised`
  );
  return data;
}

export async function useClientDetails(id: string | null | string[]) {
  const { data } = await $api.get<Client>(`clients/${id}`);
  if (data.meta && data.meta.length > 0) {
    data.meta.forEach((meta) => {
      data[meta.metaKey] = meta.metaValue;
    });
  }
  if (data.businessEntity) {
    data.businessEntityId = data.businessEntity.id;
  }
  if (data.relationshipManager) {
    data.relationshipManagerId = data.relationshipManager.id;
  }
  if (data.engagementLetterStatus) {
    const engagementLetterStatus = data.engagementLetterStatus;
    if (engagementLetterStatus === 'NOT ATTACHED') {
      data.willSign = 'true';
      data.isSigned = 'true';
    }
    else {
      if (engagementLetterStatus === 'NOT SIGNED') {
        data.willSign = 'false';
      }
      data.isSigned = 'false';
    }
  }
  data.maskedSSN = maskedCode(data.ssn as string, 4);
  data.maskedEIN = maskedCode(data.ein as string, 4);

  if (data.members && data.members.length > 0) {
    data.members = data.members.map(member => member.id as unknown as User);
  }
  return data;
}
export async function useClientUserList(clientId: string) {
  const { data } = await $api.get<ClientUser[]>(
    `clients/${clientId}/client-users`
  );
  return data;
}

export async function useClientEnable(id: string | null) {
  const { data } = await $api.patch<Client>(`clients/${id}/enable`);
  return data;
}

export async function useClientDisable(id: string | null) {
  const { data } = await $api.patch<Client>(`clients/${id}/disable`);
  return data;
}

export async function useClientRemove(id: string) {
  const { data } = await $api.delete(`clients/${id}`);
  return data;
}

export function useClientRemoval() {
  const route = useRoute();
  const clientId = ref(route.params.id as string);
  const { updateBreadcrumb } = useBreadcrumbs();

  const selectedClient = ref<Client>();
  const { data: clientDetails, isLoading: loadingClientDetails, isFetching: fetchingClientDetails } = useQuery<Client | undefined>(
    'client-details',
    () => {
      if (!clientId.value)
        return;
      return useClientDetails(clientId.value as string);
    },
    {
      onSuccess: (data) => {
        if (data) {
          updateBreadcrumb({
            breadcrumbs: [
              { label: 'Clients', to: { name: 'admin-clients' } },
              { label: data?.name }
            ]
          });
        }
      }
    }
  );
  const isClientConnected = computed(() => {
    // return (
    //   (selectedClient.value?._count?.clientUsers as number) +
    //     (selectedClient.value?._count?.projects as number) !==
    //   0
    // );
    return (
      (
        Object.values(
          clientDetails.value?._count as { [s: string]: number }
        ) as number[]
      ).reduce((prev, curr) => prev + curr, 0) !== 0
    );
  });

  const clientCounts = computed(() => {
    const users = selectedClient.value?._count?.clientUsers as number;
    const projects = selectedClient.value?._count?.projects as number;
    const entities = selectedClient.value?._count?.entities as number;
    return { users, projects, entities };
  });

  const clientDisableMessage = (countProp: string, countValue: number) => {
    switch (countProp) {
      case 'clientUsers':
        return countValue > 1 ? 'Client Users.' : 'Client User.';
      case 'entities':
        return countValue > 1 ? 'tasks.' : 'task.';
      case 'projects':
        return countValue > 1 ? 'projects.' : 'project.';
      default:
        return '';
    }
  };

  const clientUsersMessage = computed(() => {
    return clientCounts.value.users > 1
      ? `are
              <strong>${clientCounts.value.users}</strong> client users${
                clientCounts.value.projects !== 0 ? ', ' : ''
              }`
      : `is
              <strong>${clientCounts.value.users}</strong> client user${
                clientCounts.value.projects !== 0 ? ', ' : ''
              }`;
  });

  const clientProjectsMessage = computed(() => {
    return clientCounts.value.projects > 1
      ? `
                  ${clientCounts.value.users === 0 ? 'are ' : ''}<strong>${
                    clientCounts.value.projects
                  }</strong> projects${
                    clientCounts.value.entities !== 0 ? ', ' : ''
                  }`
      : `
                  ${clientCounts.value.users === 0 ? 'is ' : ''}<strong>${
                    clientCounts.value.projects
                  }</strong> project${
                    clientCounts.value.entities !== 0 ? ', ' : ''
                  }`;
  });

  const clientEntitiesMessage = computed(() => {
    return clientCounts.value.entities > 1
      ? `
                  ${clientCounts.value.users === 0 ? 'are ' : ''}<strong>${
                    clientCounts.value.entities
                  }</strong> tasks`
      : `
                  ${clientCounts.value.users === 0 ? 'is ' : ''}<strong>${
                    clientCounts.value.entities
                  }</strong> task`;
  });

  watchEffect(() => {
    if (clientDetails.value) {
      selectedClient.value = {
        ...clientDetails.value
        // _count: {
        //   clientUsers: (clientDetails.value?.clientUsers as ClientUser[])
        //     .length,
        //   projects: (clientDetails.value?.projects as typeof Array).length,
        // },
      };
    }
  });

  return {
    clientId,
    clientDetails,
    loadingClientDetails,
    fetchingClientDetails,
    selectedClient,
    isClientConnected,
    clientCounts,
    clientUsersMessage,
    clientProjectsMessage,
    clientEntitiesMessage,
    clientDisableMessage
  };
}

export async function useCreateClientState(
  id: string,
  payload: ClientStateCreatePayload
) {
  const { data } = await $api.post(`clients/${id}/states`, payload);
  return data;
}

export async function useCreateClientStates(
  id: string,
  payload: ClientStatesPayload
) {
  const { data } = await $api.post(`clients/${id}/states/bulk`, payload);
  return data;
}

export async function useCreateClientServices(
  id: string,
  payload: { clientServices: ClientServices[] }
) {
  const { data } = await $api.post(`clients/${id}/automation/bulk`, payload);
  return data;
}

export async function useClientStates(id: string, onlyActive?: boolean) {
  const { data } = await $api.get<ClientStatesResponse[]>(
    `clients/${id}/states`
  );
  const refactoredData: CommonClientState[] = [];
  data.forEach((state) => {
    refactoredData.push({
      state: state.state.id,
      country: state.state.country,
      id: state.id,
      serviceCount: state._count.clientServices,
      activeProjectCount: state.projects?.length || 0,
      name: state.state.name,
      createdAt: state.createdAt,
      isActive: state.isActive,
      completedProjectCount: state._count.projects,
      stateName: state.state.name
    });
  });

  return onlyActive ? refactoredData.filter(s => s.isActive) : refactoredData;
}

export async function useClientStateEnable(clientId: string, id: string) {
  const { data } = await $api.patch<ClientStatesResponse>(
    `clients/${clientId}/states/${id}/enable`
  );
  return data;
}

export async function useClientStateDisable(clientId: string, id: string) {
  const { data } = await $api.patch<ClientStatesResponse>(
    `clients/${clientId}/states/${id}/disable`
  );
  return data;
}

export async function useClientWithoutStates({
  id,
  stateId,
  isFederal,
  isWithoutState
}: {
  id: string;
  stateId?: string;
  isFederal?: boolean;
  isWithoutState: boolean;
}) {
  const { data } = await $api.get(
    `clients/${id}/automation?${
      stateId ? `stateId=${stateId}&` : ''
    }isWithoutState=${isWithoutState}`
  );

  const refactoredData: CommonClientState[] = [];
  data.forEach((state: any) => {
    refactoredData.push({
      state: state.state.id,
      country: state.state.country,
      id: state.id,
      serviceCount: state._count.clientServices,
      activeProjectCount: state.projects?.length || 0,
      name: state.state.name,
      createdAt: state.createdAt,
      isActive: state.isActive,
      completedProjectCount: state._count.projects,
      stateName: state.state.name
    });
  });

  return refactoredData;
}

export async function useClientServices({
  id,
  stateId,
  isFederal = false,
  isWithoutState = false
}: {
  id: string;
  stateId?: string;
  isFederal?: boolean;
  isWithoutState?: boolean;
}) {
  const refactoredData: CommonClientService[] = [];
  const { data } = await $api.get(
    `clients/${id}/automation?${stateId ? `stateId=${stateId}` : ''}${
      isFederal ? `&isFederal=${isFederal}` : ''
    }${isWithoutState ? `&isWithoutState=${isWithoutState}` : ''}`
  );
  if (data && data.length > 0) {
    data.forEach((item: any) => {
      refactoredData.push({
        id: item.id,
        dueInDays: item.dueInDays,
        reminderDays: item.reminderDays,
        serviceId: item.service.id,
        projectManagerId: item.projectManager.id,
        accountingPeriod: item.accountingPeriod
      });
    });
  }
  return refactoredData;
}

export async function useUpdateClientServices(
  clientId: string,
  id: string,
  payload: CommonClientService
) {
  const { data } = await $api.patch(
    `clients/${clientId}/automation/${id}`,
    payload
  );
  const refactoredData: CommonClientService[] = [];
  if (data) {
    refactoredData.push({
      id: data.id,
      dueInDays: data.dueInDays,
      reminderDays: data.reminderDays,
      serviceId: data.service.id,
      projectManagerId: data.projectManager.id,
      accountingPeriod: data.accountingPeriod
    });
  }
  return refactoredData[0] as CommonClientService;
}
export async function useCreateOneClientService(
  clientId: string,
  payload: CommonClientService
) {
  const { data } = await $api.post(`clients/${clientId}/automation`, payload);
  const refactoredData: CommonClientService[] = [];
  if (data) {
    refactoredData.push({
      id: data.id,
      dueInDays: data.dueInDays,
      reminderDays: data.reminderDays,
      serviceId: data.service.id,
      projectManagerId: data.projectManager.id,
      accountingPeriod: data.accountingPeriod
    });
  }
  return refactoredData[0] as CommonClientService;
}

export async function useClientServiceDelete(clientId: string, id: string) {
  const { data } = await $api.delete(`clients/${clientId}/automation/${id}`);
  return data;
}

export async function detachCollaborators(payload: ClientAddCollaboratorsPayload & { clientId: string }) {
  const { data } = await $api.post<Client>(
    `clients/detach-collaborators`,
    payload
  );
  return data;
}

export async function attachCollaborators(payload: ClientAddCollaboratorsPayload & { clientId: string }) {
  const { data } = await $api.post<Client>(
    `clients/attach-collaborators`,
    payload
  );
  return data;
}

export function useEngagementLetter() {
  const useContractList = async (clientId: string) => {
    const { data } = await $api.get<Contract[]>(
      `clients/${clientId}/contracts`
    );
    return data;
  };
  const getContractDetails = async (id: string) => {
    const { data } = await $api.get<Contract & { link: string }>(
      `contract/${id}`
    );
    return data;
  };

  const useContract = async (clientId: string, id: string) => {
    const { data } = await $api.get<Contract>(
      `clients/${clientId}/contracts/${id}`
    );
    const refactoredData: genEngagementLetterPayload = {
      cpaFirmName: '',
      cpaFirmLogo: undefined,
      cpaFirmRepresentative: '',
      cpaFirmRepresentativeDesignation: '',
      filingYear: '',
      isLastYearFiled: false,
      professionalFee: 0,
      percentageDueUponSigning: 0,
      clientName: '',
      clientRepresentative: undefined,
      clientRepresentativeTitle: undefined,
      clientStreet: undefined,
      clientZip: undefined,
      clientState: undefined,
      clientCity: undefined,
      clientSpouseName: undefined,
      states: undefined
    };
    refactoredData.cpaFirmName = data.org.name;
    refactoredData.cpaFirmLogo = data.org.logo ? data.org.logo.path : '';
    refactoredData.clientName = data.client.name;

    return refactoredData;
  };
  const useContractUpdate = async (
    clientId: string,
    id: string,
    payload: Partial<CreateContract>
  ) => {
    const { data } = await $api.patch<Contract>(
      `clients/${clientId}/contracts/${id}`,
      payload
    );
    return data;
  };

  const useContractCreate = async (
    clientId: string,
    id: string,
    payload: genEngagementLetterPayload
  ) => {
    const { data } = await $api.post<Contract[]>(
      `clients/${clientId}/contracts/${id}/generate`,
      payload
    );
    return data;
  };

  const useShareContract = async (
    clientId: string,
    id: string,
    payload: ShareContractPayload
  ) => {
    const { data } = await $api.post<Contract[]>(
      `clients/${clientId}/contracts/${id}/share`,
      payload
    );
    return data;
  };
  return {
    useContractList,
    useContract,
    useContractCreate,
    useContractUpdate,
    useShareContract,
    getContractDetails
  };
}

export async function useClientWorkingTeam(id: string) {
  const { data } = await $api.get<WorkingTeam[]>(`clients/${id}/working-team`);
  return data;
}

export async function useClientCollaborators(id: string) {
  const { data } = await $api.get<Collaborator[]>(
    `clients/${id}/collaborators`
  );
  return data;
}

export async function useClientCreateBulk(payload: CreateBulkClient[]) {
  const { data } = await $api.post('clients/bulk', payload);
  return data;
}

export async function useClientCreateTags(
  id: string,
  payload: { tagId: string }
) {
  const { data } = await $api.post(`clients/${id}/tags`, payload);
  return data;
}

export async function useClientDeleteTags(id: string, tagId: string) {
  return await $api.delete<Tag>(`clients/${id}/tags/${tagId}`);
}
