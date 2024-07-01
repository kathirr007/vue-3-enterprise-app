import $api from '@/plugins/api';
import type { Integration, IntegrationsData, OrgIntegration } from '@/types/integrations.type';
import type {
  OperationType,
  ResourceType,
  UserPermissions
} from '@/types/permissions.type';
import { operations, resources } from '@/types/permissions.type';
import type { MenuItem } from '@/types/app.type';
import type { ClientAccessSetting } from '@/types/teams.type';

export function usePermissions(
  canCallOrgIntegrations = false,
  canCallPermissions = false,
  canCallIntegrations = false
) {
  const { isPortalUser } = useCurrentUserData();

  const resourcesToExclude = reactive([
    'subscriptions',
    'integrations',
    'services',
    'business_entities',
    'designations'
  ]);
  const menusToExclude = reactive([
    'work',
    // 'brightdesk',
    'help',
    'myteam',
    'myclient',
    'mails',
    'users_hrms',
    'client_broadcasts',
    'team_broadcasts',
    'client-tasks',
    'calendar',
    'timelog',
    'assignments',
    'tasks',
    // 'support_tasks',
    'documents',
    'alltasks'
  ]);

  const loadingOrgIntegrations = ref(false);
  const loadingIntegrations = ref(false);
  const integrationIds = ref<string[]>([]);
  const integrationsIds = ref<string[]>([]);
  const orgIntegrations = reactive({
    menusToExclude: [
      'dashboard',
      'myclient',
      'myteam',
      'users_hrms',
      'admin',
      'knowledgeBase'
    ],
    menuDependencies: {
      users_hrms: ['myteam']
    }
  });

  const userPermissions = computed(() => {
    if (userPerms.value) {
      return JSON.parse(atob(userPerms.value)).orgRole.permissions;
    }
    return {};
  });

  const userPlanPermissions = computed(() => {
    if (userPlanPerms.value) {
      // return JSON.parse(atob(userPlanPerms.value));
      return userPlanPerms.value;
    }
    return {};
  });

  const canAccessAllMenu = computed(() => {
    return Object.entries(userPermissions.value || {}).every(
      (item: any) => item[1].admin === null
    );
  });

  const canAccessAdminMenu = computed(() => {
    return Object.entries(userPermissions.value || {})
      .filter(item => resourcesToExclude.includes(item[0]))
      .every((item: any) => item[1].admin === null);
  });

  const getPermissions = async () => {
    const { data } = await $api.get<UserPermissions>('permissions');
    return data;
  };

  if (canCallPermissions)
    getPermissions();

  const getResourceOperations = (resource: ResourceType) => {
    if (userPermissions.value) {
      return Object.keys(userPermissions.value[resource] || {});
    }
    return [];
  };

  const getSubscriptionOperations = (resource: any) => {
    if (userPlanPermissions.value) {
      return Object.keys(userPlanPermissions.value[resource] || {});
    }
    return [];
  };

  const canDo = (
    resourceType: ResourceType,
    operation: OperationType | OperationType[]
  ) => {
    const operationsToCheck = [operation, 'admin'];
    return getResourceOperations(resourceType)?.some((item: string) =>
      operationsToCheck.includes(item)
    );
  };

  const featureSubscribed = (resourceType: any, operation: any | any[]) => {
    const operationsToCheck = Array.isArray(operation)
      ? operation
      : [operation];

    const resourceOperations = getSubscriptionOperations(resourceType);

    return (
      resourceOperations
      && operationsToCheck.every(
        (item: string) =>
          resourceOperations.includes(item)
          && userPlanPermissions.value[resourceType][item] === true
      )
    );
  };

  const checkingAllRoles = (
    arr: string[],
    values: string[],
    typeOfCheck = 'all'
  ) => {
    const checkAll = () =>
      values.every(val =>
        arr.some(item => item === 'admin' || item === val)
      );
    const checkEvery = () =>
      values.includes('admin') || arr.every(val => values.includes(val));
    const checkSome = () =>
      values.includes('admin') || arr.some(val => values.includes(val));
    return typeOfCheck === 'every'
      ? checkEvery()
      : typeOfCheck === 'some'
        ? checkSome()
        : checkAll();
  };

  const canDoSome = (
    resourceType: ResourceType,
    operationsToCheck: OperationType[]
  ) => {
    return checkingAllRoles(
      operationsToCheck,
      getResourceOperations(resourceType),
      'some'
    );
  };
  const canDoEvery = (
    resourceType: ResourceType,
    operationsToCheck: OperationType[]
  ) => {
    return checkingAllRoles(
      operationsToCheck,
      getResourceOperations(resourceType),
      'every'
    );
  };
  const canDoAll = (
    resourceType: ResourceType,
    operationsToCheck?: OperationType[]
  ) => {
    return checkingAllRoles(
      operationsToCheck?.length
        ? operationsToCheck
        : getResourceOperations(resourceType),
      Array.from(operations)
    );
  };

  const permissionKeys = computed(() => {
    if (userPermissions.value) {
      const userPermissionKeys = Object.keys(userPermissions.value).filter(
        key => !resourcesToExclude.includes(key)
      );
      if (userPermissionKeys.includes('support_tasks')) {
        menusToExclude.push('brightdesk');
      }
      return Array.from(
        new Set([
          ...userPermissionKeys,
          ...menusToExclude,
          canAccessAdminMenu.value ? 'admin' : ''
        ])
      );
    }
    return [];
  });

  const allOrgIntegrationIds = computed<string[]>({
    get() {
      return integrationIds.value;
    },
    set(val) {
      integrationIds.value = val;
    }
  });
  const allIntegrationsIds = computed<string[]>({
    get() {
      return integrationsIds.value;
    },
    set(val) {
      integrationsIds.value = val;
    }
  });

  const getAllOrgIntegrationIds = async (isIntegrations?: boolean) => {
    loadingOrgIntegrations.value = true;
    if (isIntegrations) {
      loadingIntegrations.value = true;
    }
    const { data } = await $api.get<OrgIntegration[]>(
      `${isPortalUser.value ? 'portal/' : ''}org-integrations`
    );
    loadingOrgIntegrations.value = false;
    const integData = isIntegrations ? await $api.get<IntegrationsData>(`integrations`) : { data: [] };
    loadingIntegrations.value = false;
    const integrationsData = (integData.data as IntegrationsData).allIntegrations;

    const allIntegrationsDataIds = integrationsData?.map(
      (item: Integration) => item.id?.toLowerCase()
    );
    const allIntegIds = (data as OrgIntegration[]).map(
      (item: OrgIntegration) => item.integration.id?.toLowerCase()
    );
    const foundHrmsIntegration = allIntegIds.find(
      (item: string) => item === 'hrms'
    );
    if (allIntegIds.includes('work'))
      allIntegIds.push('reports');

    if (foundHrmsIntegration)
      allIntegIds.push('users_hrms');

    const integrationsIds = [
      ...allIntegIds,
      ...orgIntegrations.menusToExclude
    ];

    allOrgIntegrationIds.value = [...integrationsIds];
    allIntegrationsIds.value = allIntegrationsDataIds ? [...allIntegrationsDataIds] : [];

    return allIntegrationsIds;
  };

  if (canCallOrgIntegrations) {
    getAllOrgIntegrationIds();
  }
  if (canCallIntegrations) {
    getAllOrgIntegrationIds(true);
  }

  const canAccessMenu = (allOrgIntegrationIds: string[], menu: MenuItem) => {
    const orgIntegrationDependencies = orgIntegrations.menuDependencies;
    const foundMenuDependencies = Object.hasOwnProperty.call(
      orgIntegrationDependencies,
      menu.name as string
    );
    return allOrgIntegrationIds.includes(menu.name as string);
  };

  const canAccessMenuWithDependencies = (
    allIntegrationIds: string[],
    menu: MenuItem
  ) => {
    const orgIntegrationDependencies = orgIntegrations.menuDependencies;
    const foundMenuDependencies = Object.hasOwnProperty.call(
      orgIntegrationDependencies,
      menu.name as string
    );
    if (foundMenuDependencies) {
      return (
        allIntegrationIds.includes(menu.name as string)
        && (orgIntegrations.menuDependencies as any)[menu.name as string].every(
          (item: string) => allIntegrationIds.includes(item)
        )
      );
    }
    return true;
  };

  const isFeatureIntegrated = (
    features: string[],
    integratedFeatures: string[]
  ) => {
    return features.some((feature: string) =>
      integratedFeatures.length && integratedFeatures.includes(feature)
    );
  };

  return {
    canDo,
    canDoSome,
    canDoAll,
    canDoEvery,
    getPermissions,
    canAccessMenu,
    canAccessMenuWithDependencies,
    isFeatureIntegrated,
    getAllOrgIntegrationIds,
    canAccessAllMenu,
    canAccessAdminMenu,
    userPermissions,
    operations,
    resources,
    resourcesToExclude,
    menusToExclude,
    permissionKeys,
    allOrgIntegrationIds,
    allIntegrationsIds,
    userPlanPermissions,
    featureSubscribed,
    loadingOrgIntegrations,
    loadingIntegrations
  };
}

export function useClientPortalAccess(feature: string,
  featureLabel: string) {
  const router = useRouter();
  const portalRouteNames = computed(() =>
    generatePortalRouteNames(currentUser.value?.client?.accessSetting as ClientAccessSetting)
  );

  const hasFeatureAccess = computed(() =>
    portalRouteNames.value.includes(feature)
  );

  onBeforeMount(() => {
    if (!portalRouteNames.value.length) {
      router.push({ name: 'portal-401', query: { feature: featureLabel } });
    }
  });

  return {
    portalRouteNames,
    hasFeatureAccess
  };
}
