<script lang="ts" setup>
import type { Client } from '@/types/client.type';
import type { APIActions, MetaObj, TimelineSteps } from '@/types/common.type';
import TabView from 'primevue/tabview';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { provide } from 'vue';
import type { UpdateTitle } from '@/types/project.type';
import type { Card } from '@/types/dashboard.type';
import type { EntityType, Task } from '@/types/tasks.type';
import TasksList from '@/components/Tasks/List.vue';

import type { DropdownChangeEvent } from 'primevue/dropdown';
import { useRouteQuery } from '@vueuse/router';
import type { OrderedPipelineStages } from '@/types/service.type';
import type { LocationQueryRaw, RouteParamsRaw } from 'vue-router';

const queryTaskType = useRouteQuery<string>('entityType');
const activeIndex = useRouteQuery<string>('activeIndex');

const selectedTaskType = ref<EntityType>(
  queryTaskType.value ? (queryTaskType.value as EntityType) : 'TASK'
);
const currentStatus = ref<string>();
const openTaskCreate = ref(false);
const isProjectDialog = ref(false);
const isProjectTemplate = ref(false);
const tasksListRef = ref<InstanceType<typeof TasksList> | null>(null);
const isDialogVisibleQuickStart = ref(false);
const isProjectCreate = ref(false);
const isAutomateHelpVideoOpen = ref(false);
const isScheduleHelpVideoOpen = ref(false);
const isCreateUpdateFeedbackDialog = ref(false);
const taskStatusOptions = ref([
  {
    name: 'Team Tasks',
    value: 'TASK'
  },
  { name: 'Client Request', value: 'CLIENTTASK' }
]);
const mode = ref(useProjectViewMode('kanban'));
const { pluralize } = useVueFilters();
const { isPortalUser } = useCurrentUserData();
const { isFeatureIntegrated, allOrgIntegrationIds, featureSubscribed }
  = usePermissions(true);
const selectedTemplate = ref<string>();
const selectedStages = ref<OrderedPipelineStages[]>();
const isServiceSelected = useRouteQuery('isServiceSelected');
const cards = ref<Card[]>([
  {
    id: 'unscheduleProjects',
    title: 'Unscheduled Projects',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
    // icon: 'iconoir:high-priority',
    // iconify: true,
  },
  {
    id: 'scheduleProjects',
    title: 'Scheduled Projects',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
    // icon: 'material-symbols:inactive-order-outline',
    // iconify: true,
  },
  {
    id: 'activeProjects',
    title: 'Active Projects',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
    // icon: 'mdi:receipt-text-clock',
    // iconify: true,
  },
  {
    id: 'completedProjects',
    title: 'Completed Projects',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
    // icon: 'pi pi-check',
  },
  {
    id: 'totalBillAmount',
    title: 'Total Billable Amount',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
    // icon: 'pi pi-dollar',
  }
]);
const invoiceCards = ref<Card[]>([
  {
    id: 'totalInvoicesRaised',
    title: 'Total Invoices Raised',
    value: '15',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
  }
  /* {
    id: 'totalInvoicesPaidAndReceived',
    title: 'Total Invoices Paid / Amount Received',
    value: '8 / $5000',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
  },
  {
    id: 'totalInvoicesAndAmountPending',
    title: 'Total Invoices Pending / Amount Pending',
    value: '7 / $2000',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
  }, */
]);
const editClientDialog = ref(false);
const removeOrDisableClientDialog = ref(false);
const closeOrReopenClientDialog = ref(false);
const isRemoveClient = ref(false);
const formKey = ref(0);
const dashboardKey = ref(0);
const isDialogVisible = ref(false);
const currentStepDetails = ref<UpdateTitle>();
const automationTitle = ref('Automation');
const automationSubTitle = ref(
  'Assign Project Templates to corresponding State, in order to Automate Project Creation & Scheduling.'
);
const disabledTooltip = ref(`${$tConfig('CLIENT')} is disabled, Please enable the ${$tConfig('CLIENT').toLowerCase()}.'`);
const isInvoiceCreate = ref(false);
const route = useRoute();
const clientId = ref(route.params.id as string);
const { getClientDashboard } = useDashboardMatrix();
const queryClient = useQueryClient();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { metaFilter, getQueryParams } = useUtilityFns();
const { initToast } = useToasts();
const { handleTooltip } = useTooltip();
const { canDo, canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();
const { getAllStatuses } = useProjectStatus();
const { filtersRef, isFiltersVisible, queryFilters, toggleFilters }
  = useDataTableUtils();
const router = useRouter();

function openRemoveDisableDialog(isRemove: boolean) {
  if (isRemove) {
    isRemoveClient.value = true;
  }
  else {
    isRemoveClient.value = false;
  }
  removeOrDisableClientDialog.value = true;
}

function handleStep(step: number | TimelineSteps | string,
  query: LocationQueryRaw = {},
  params: RouteParamsRaw = {}) {
  if (typeof step === 'number') {
    router.push({ query: { activeIndex: step } });
  }
  else {
    if (tabRef.value) {
      const tabHeader
        = typeof step === 'string'
          ? step
          : `${((step as TimelineSteps).route as string).split('?')[0]}`;
      const currentTabIndex = tabRef.value?.tabs.findIndex(
        (item: VNode) => item.props?.header === tabHeader
      );
      const stepTitle = (step as TimelineSteps).title;
      const routeQueryParams = getQueryParams(
        typeof step === 'string'
          ? step
          : ((step as TimelineSteps).route as string)
      );
      const isWorkIntegrated = isFeatureIntegrated(
        ['work'],
        allOrgIntegrationIds.value
      );
      isDialogVisibleQuickStart.value = false;
      if (stepTitle === 'Assign Service' || stepTitle === 'Client States') {
        if (isWorkIntegrated) {
          router.push({
            query: {
              ...query,
              ...routeQueryParams,
              activeIndex: currentTabIndex
            },
            params
          });
        }
        else if (stepTitle === 'Client States') {
          router.push({
            query: {
              ...query,
              ...routeQueryParams,
              activeIndex: currentTabIndex,
              nestedActiveIndex: ''
            },
            params
          });
        }
        else {
          initToast({
            actionType: 'Remove',
            summary: 'Feature Not Integrated',
            detail: `Feature <strong>${'work'}</strong> is not integrated, please integrate work to complete <strong>${stepTitle}</strong> step.`
          });
        }
      }
      else {
        router.push({
          query: {
            ...query,
            ...routeQueryParams,
            activeIndex: currentTabIndex
          },
          params
        });
      }
    }
  }
}

const {
  activeTabIndex,
  handleTabChange,
  tabRef,
  activeNestedTabIndex,
  activeTab,
  nestedTabRef
} = useSteps('admin-clients-id');

const { getGettingStartedSteps } = useCommonListQueries();

const { data: gettingStartedSteps } = getGettingStartedSteps(
  clientId.value as string
);

const { data: projectTemplates } = useQuery(
  ['project-templates'],
  () => {
    return useServiceListV2({});
  },
  {
    onSuccess(data) {
      if (
        activeTab.value === 'Active & Scheduled Projects'
        && mode.value === 'kanban'
        && data
        && data.results.length > 0
        && !isServiceSelected.value
      ) {
        const firstTemplateId = data.results[0].id;
        addInitialServiceFilter(firstTemplateId);
      }
    }
  }
);

/* const { data: projectLimits } = useQuery('project-limit', () => {
  return getResourceLimits({ resource: ResourceType.project });
});

const projectResource = computed(() => {
  const limitComputed = projectLimits.value?.[0].limit === -1 ? 0 : projectLimits.value?.[0].limit;
  const usageComputed = projectLimits.value?.[0].orgSubscriptionResourceUsages ? projectLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: projectResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'project-limit',
  resource: 'project'
});

watch(
  () => mode.value,
  () => {
    if (mode.value === 'list') {
      const { filters, ...restQuery } = route.query;
      router.push({ query: { ...restQuery } });
    }
    else {
      const firstTemplateId = projectTemplates.value?.results.length
        ? projectTemplates.value?.results[0].id
        : undefined;
      if (firstTemplateId) {
        addInitialServiceFilter(firstTemplateId);
      }
    }
  }
);

const invoiceCardData = computed(() => {
  return invoiceCards.value
    .map((e) => {
      switch (e.id) {
        case 'tasksDueTodayFilter':
          return {
            ...e,
            value: e.value
          };

        case 'tasksDueThisWeekFilter':
          return {
            ...e,
            value: e.value
          };

        case 'tasksDueNextWeekFilter':
          return {
            ...e,
            value: e.value
          };

        default: {
          return { ...e };
        }
      }
    })
    .filter(e => e) as Card[];
});

function onQueryFilterChange(value: string) {
  const decodedFilters = useDecodeFilterData(value as string);
  const columns = Object.keys(decodedFilters);
  if (columns.includes('Service')) {
    const serviceId = decodedFilters.Service.value[0];
    if (serviceId)
      selectedTemplate.value = serviceId;
  }
}

watch(
  () => queryFilters,
  (val) => {
    if (val) {
      onQueryFilterChange(val.value as string);
    }
  }
);

function addInitialServiceFilter(value: string) {
  const { applyFilter: applyInitialFilter, data: filteredData }
    = useFilterColumns();
  applyInitialFilter('Service', [value]);
  applyInitialFilter('Client', [clientId.value as string]);
  const filters = useEncodeFilterData(filteredData);
  if (activeIndex.value === '2')
    router.push({
      query: {
        filters,
        isServiceSelected: 'true',
        activeIndex: activeIndex.value
      }
    });
}

const { data: projectTemplate } = useQuery(
  ['project-template', selectedTemplate],
  () => {
    if (!selectedTemplate.value)
      return;
    return useServiceDetails(selectedTemplate.value as string);
  },
  {
    onSuccess(data) {
      if (data) {
        selectedStages.value = data.OrderedPipelineStages;
      }
    }
  }
);

const templateOptions = computed(() => {
  return projectTemplates.value?.results?.map((template) => {
    return {
      label: template.name,
      value: template.id
    };
  });
});

const {
  clientCounts,
  isClientConnected,
  selectedClient,
  clientDetails,
  loadingClientDetails,
  clientDisableMessage,
  fetchingClientDetails
} = useClientRemoval();

const { fullName } = useVueFilters();

const isSetupCompleted = computed(() => {
  if (clientDetails.value) {
    return !!clientDetails.value.isSetupCompleted;
  }
});
const canDoActions = computed(() => clientDetails.value?.isActive);
const activeStatus = computed(() => {
  return clientDetails.value?.isActive ? 'Disable' : 'Enable';
});
const isClosedCase = computed(() => clientDetails.value?.isClosed);
const closureStatus = computed(() => {
  return clientDetails.value?.isClosed ? 'Re-open' : 'Close';
});

const unplannedPageHeader = computed(() => {
  if (currentStepDetails.value) {
    const {
      step: currentStep,
      serviceToSchedule,
      typeofSchedule
    } = currentStepDetails.value;
    if (currentStep === 'select clients') {
      return typeofSchedule === 'Schedule'
        ? `Awesome lets ${typeofSchedule} the Project now.`
        : `Ok, lets ${typeofSchedule} the Project dates now.`;
    }
    if (currentStep === 'update project details') {
      return `${typeofSchedule} ${serviceToSchedule?.service}`;
    }
    if (currentStep === 'update tasks') {
      return `Update tasks and Schedule ${serviceToSchedule?.service}`;
    }
  }
  return 'Unscheduled Projects';
});

const unplannedHeaderStyles = computed(() => {
  return {
    borderBottom: currentStepDetails.value ? '2px solid #A1B1CC' : 'none ',
    padding: currentStepDetails.value ? '1rem ' : '0px '
  };
});

function handleAction(data: Client, actionType: APIActions) {
  initToast({
    actionType,
    title: `${$tConfig('CLIENT')}`,
    actionObj: { ...data },
    detail: `${$tConfig('CLIENT')} <strong>${
      data.name
    }</strong> ${actionType.toLowerCase()}d successfully`
  });
  queryClient.invalidateQueries('client-details');
}

function handleCaseAction(data: Client, actionType: APIActions) {
  initToast({
    actionType,
    title: 'Case',
    actionObj: { ...data },
    detail: `Case <strong>${data.name
      }</strong> ${actionType.toLowerCase()} successfully`
  });
  queryClient.invalidateQueries('client-details');
}

const { mutateAsync: clientDelete } = useMutation(
  'clientDelete',
  (id: string) => useClientRemove(id),
  {
    onSuccess: () =>
      handleAction({ ...clientDetails.value } as Client, 'Delete')
  }
);
const { mutateAsync: clientDisable } = useMutation(
  'clientDisable',
  async (id: string | null) => {
    return useClientDisable(id);
  },
  {
    onSuccess: () => {
      handleAction({ ...clientDetails.value } as Client, 'Disable');
    }
  }
);
const { mutateAsync: clientEnable } = useMutation(
  'clientEnable',
  async (id: string | null) => {
    return useClientEnable(id);
  },
  {
    onSuccess: () => {
      handleAction({ ...clientDetails.value } as Client, 'Enable');
    }
  }
);

const { mutateAsync: caseClosure } = useMutation(
  'case-closure', async (id: string) => {
    const isClosed = closureStatus.value === 'Close';
    return useCaseClosure({ id, payload: { isClosed } });
  },
  {
    onSuccess: () => {
      handleCaseAction({ ...clientDetails.value } as Client, closureStatus.value === 'Close' ? 'Closed' : 'Reopened');
    }
  }
);

const { data: dashboardData } = useQuery(
  ['dashboard-client', cards, clientId],
  () => {
    if (clientId.value)
      return getClientDashboard(clientId.value as string);
  },
  {
    onSuccess: (data) => {
      if (data)
        cards.value = cards.value.map((e, i) => {
          switch (e.id) {
            case 'unscheduleProjects':
              return {
                ...e,
                value: `${
                  data.unscheduleProjects
                    ? data.unscheduleProjects.unscheduleProjects || 0
                    : 0
                }`
              };
            case 'scheduleProjects':
              return {
                ...e,
                value: `${
                  data.scheduleProjects
                    ? data.scheduleProjects.scheduleProjects
                    : 0
                }`
              };
            case 'activeProjects':
              return {
                ...e,
                value: `${data.activeProjects.scheduleProjects}`
              };
            case 'completedProjects':
              return {
                ...e,
                value: `${data.completedProjects.scheduleProjects}`
              };
            case 'totalBillAmount':
              return {
                ...e,
                value: `$ ${data.totalBillAmount}`
              };

            default: {
              return {};
            }
          }
        }) as Card[];
    }
  }
);

const { isFetching } = useQuery(
  ['invoice-list-card-data'],
  async () => {
    return () => ({
      data: []
    });
  },
  {
    onSuccess: (value) => {
      // TODO:
    }
  }
);

provide('handleStep', handleStep);
provide('clientDetails', clientDetails);
provide('loadingClientDetails', loadingClientDetails);
provide('fetchingClientDetails', fetchingClientDetails);
provide('disabledTooltip', disabledTooltip);
provide('canDoActions', canDoActions);

async function handleActivation(status: string) {
  if (status === 'Enable') {
    await clientEnable(clientId.value as string);
    queryClient.invalidateQueries('client-details');
    queryClient.invalidateQueries('project-list');
  }
  else {
    await clientDisable(clientId.value as string);
    queryClient.invalidateQueries('client-details');
    queryClient.invalidateQueries('project-list');
  }
}

async function handleClosure(status: string) {
  if (status === 'Re-open') {
    await caseClosure(clientId.value as string);
    queryClient.invalidateQueries('client-details');
    queryClient.invalidateQueries('project-list');
  }
  else {
    await caseClosure(clientId.value as string);
    queryClient.invalidateQueries('client-details');
    queryClient.invalidateQueries('project-list');
  }
}

async function handleDelete() {
  await clientDelete(clientId.value as string);
  queryClient.invalidateQueries('user-details');
}

function closeDialog() {
  isDialogVisible.value = false;
}
function updateTitleDesc(data: UpdateTitle) {
  currentStepDetails.value = data;
}
function handleScheduleBack() {
  currentStepDetails.value = undefined;
}
function handleTitle(title: string, subTitle: string) {
  automationTitle.value = title;
  automationSubTitle.value = subTitle;
}

function prepareForTemplate() {
  isProjectTemplate.value = true;
  isProjectDialog.value = false;
}
function prepareForCreate() {
  isProjectCreate.value = true;
  isProjectDialog.value = false;
}

function closeCreateProject() {
  isProjectCreate.value = false;
  isProjectTemplate.value = false;
}

function handleCreate() {
  openTaskCreate.value = true;
  formKey.value++;
}
function handleClose() {
  openTaskCreate.value = false;
}
function handleStatusName(val: string) {
  if (val) {
    currentStatus.value = val;
  }
}

function updateSelectedTaskStatus(e: DropdownChangeEvent) {
  selectedTaskType.value = e.value;
  router.push({
    query: {
      activeIndex: activeIndex.value ? activeIndex.value : undefined,
      entityType: selectedTaskType.value
    }
  });
}

function goToGenerateInvoice() {
  // router.push({ name: 'admin-billing-invoices-generate' });
  isInvoiceCreate.value = true;
}

function handleInvoiceCreateBack() {
  isInvoiceCreate.value = false;
}

const billingProfileIdParam = computed(() => {
  return clientDetails.value?.clientBillingProfile?.length
    ? clientDetails.value?.clientBillingProfile[0]?.billingProfileId
    : undefined;
});

function handleTemplateProjectSelection(projectTemplate: any) {
  if (projectTemplate.value === null) {
    toggleFilters(!!queryFilters.value);
  }
}

function handleMoreCta() {
  const { applyFilter: applyCTAFilter, data: ctaData } = useFilterColumns();
  applyCTAFilter('Client', [clientId.value]);
  const ctaFilter = useEncodeFilterData(ctaData);
  router.push({
    name: 'admin-security',
    query: { filters: ctaFilter }
  });
}

function updateDashboardKey() {
  dashboardKey.value++;
}

watchEffect(() => {
  if (clientDetails.value) {
    formKey.value += 1;
    queryClient.invalidateQueries('getting-started');
  }
});

onMounted(() => {
  useLayoutContentClass().contentClass.value = 'relative';
  if (queryFilters.value) {
    onQueryFilterChange(queryFilters.value);
  }
});

onBeforeUnmount(() => {
  useLayoutContentClass().contentClass.value = '';
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <!-- <Message icon="pi" severity="info" class="mt-1 align-items-center relative">
    <div class="flex align-items-center">
      <Icon icon="fluent-emoji:robot" class="ml-1" style="font-size: 2.2rem" />
      <img
        src="/images/robot-icon.png"
        alt="app assistant robot"
        class="w-3rem ml-1"
      />
      <div class="ml-2 text-xl">New Feature Update:</div>
    </div>
    <div class="flex justify-content-start mt-3">
      BrightAssistant identifies document types, tags them, and extracts
      essential data from the documents.
      <a
        :href="`https://brightreturn.com/blog/document-extraction-with-ai/?nocache=47487`"
        target="_blank"
        class="underline ml-2"
        >Learn more</a
      >
    </div>
  </Message> -->
  <div class="flex flex-column md:flex-row card align-items-center py-0">
    <div class="w-full md:w-7 mb-2 md:mb-0">
      <div class="flex align-items-center">
        <Avatar
          v-if="
            clientDetails?.businessEntity
              && clientDetails?.businessEntity.name === 'Individual'
          "
          class="mr-2 bg-primary text-2xl line-height-3"
          size="normal"
          shape="circle"
          icon="pi
          pi-user"
        />
        <Avatar
          v-else
          class="mr-2 bg-primary text-2xl line-height-3"
          size="normal"
          shape="circle"
          icon="pi
          pi-building"
        />
        <div class="ml-2 space-y-0.5 flex-1">
          <h1 class="mb-3">
            <span class="text-xl text-primary">
              {{ clientDetails?.name }}
            </span>
          </h1>
        </div>
      </div>
    </div>
    <div class="w-full md:w-5 flex justify-content-end gap-1 mt-1">
      <Button
        v-if="isSetupCompleted && canDoActions"
        v-tooltip.top="'Quick Start'"
        icon="pi "
        class="p-button-sm p-button-rounded h-2rem w-2rem"
        aria-label="Quick Start"
        @click="isDialogVisibleQuickStart = true"
      >
        <Icon icon="mdi:hand-coin" class="flex-none text-xl" />
      </Button>
      <span v-tooltip="`Generate Feedback`">
        <Button
          icon="pi"
          class="p-button-sm p-button-rounded  h-2rem w-2rem"
          @click="isCreateUpdateFeedbackDialog = true"
        >
          <Icon icon="codicon:feedback" class="flex-none text-xl" />
        </Button>
      </span>
      <div
        v-tooltip.top="handleTooltip(!!canDoActions, 'Edit', disabledTooltip)"
        style="height: 2.357rem;"
      >
        <Button
          v-if="
            canAccessAllMenu
              || clientDetails?.relationshipManager?.id === currentUser.id
          "
          icon="pi pi-pencil"
          class="p-button-sm p-button-rounded h-2rem w-2rem"
          aria-label="Edit"
          :disabled="!canDoActions"
          @click="editClientDialog = true"
        />
      </div>
      <Button
        v-if="canDo('clients', 'delete')"
        v-tooltip.top="canDoActions ? 'Disable' : 'Enable'"
        :icon="canDoActions ? 'pi pi-ban' : 'pi pi-check-circle'"
        class="p-button-sm p-button-rounded h-2rem w-2rem"
        :class="canDoActions ? 'p-button-danger' : 'p-button-success'"
        :aria-label="canDoActions ? 'Disable' : 'Enable'"
        @click="openRemoveDisableDialog(false)"
      />
      <Button
        v-if="canDo('clients', 'delete') && orgType === 'LAWYER'"
        v-tooltip.top="!isClosedCase ? 'Close' : 'Re-open'"
        :icon="!isClosedCase ? 'pi pi-check-circle' : 'pi pi-undo'"
        class="p-button-sm p-button-rounded h-2rem w-2rem bg-green-500 border-green-500 hover:bg-green-400 hover:border-green-400"
        :aria-label="!isClosedCase ? 'Close' : 'Re-open'"
        @click="closeOrReopenClientDialog = true"
      >
        <!-- <Icon v-if="isClosedCase" class="flex-none text-lg" icon="octicon:issue-reopened-16" style="color: white;" /> -->
      </Button>
      <!-- <Button
        icon="pi pi-trash"
        class="p-button-sm p-button-rounded p-button-danger ml-2"
        @click="openRemoveDisableDialog(true)"
        v-tooltip.top="'Delete'"
        aria-label="Delete"
        :disabled="true"
      /> -->
    </div>
  </div>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    scrollable
    @tab-change="handleTabChange"
    @tab-click="handleTabChange"
  >
    <TabPanel v-if="!isSetupCompleted" header="Getting Started">
      <h1 class="text-3xl text-primary">
        Getting Started
      </h1>

      <CommonGetStart
        :timeline-steps="gettingStartedSteps"
        @emit-step="handleStep"
      />
    </TabPanel>
    <TabPanel v-if="isSetupCompleted" header="Dashboard">
      <Common426
        v-if="featureSubscribed('client', 'dashboard') === false"
        feature="dashboard"
      />
      <div v-else>
        <h2 class="text-3xl text-primary">
          Dashboard
        </h2>
        <div class="grid">
          <WidgetCards
            v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
            :cards="cards"
            :cards-in-row="5"
            is-card-small
            class="col-12 mb-4"
          />
          <div class="col-12 md:col-6">
            <ClientsInformation
              :client-id="clientId"
              :client-details="clientDetails"
            />
          </div>
          <div class="col-12 md:col-6">
            <div class="box-shadow card mx-auto">
              <h6 class="text-500 font-medium mb-3">
                Notes
              </h6>
              <Common426
                v-if="featureSubscribed('client', 'notes') === false"
                feature="notes"
              />
              <CommonComments
                v-else
                :key="dashboardKey"
                dashboard
                resource-type="CLIENT"
                :resource-id="clientId"
              />
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="box-shadow card mx-auto">
              <div class="flex justify-content-between">
                <h6 class="text-500 font-medium mb-3">
                  Activity
                </h6>
                <p
                  v-if="canAccessAllMenu"
                  class="text-500 font-medium text-primary hover:underline cursor-pointer mb-3"
                  role="link"
                  tabindex="0"
                  @click="handleMoreCta"
                  @keyup.enter="handleMoreCta"
                >
                  See more...
                </p>
              </div>
              <ClientsActivity
                :client-id="clientId"
                :client-details="clientDetails"
              />
            </div>
          </div>
          <div
            v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
            class="col-12 md:col-6"
          >
            <WidgetCheckList
              class="mx-auto max-w-max"
              :tasks="(dashboardData?.todaysTasks as unknown as Task[])"
              button-tooltip="Create Task"
              title="To-Do"
              :disable-actions="!canDoActions"
              :disabled-tooltip="disabledTooltip"
              entity-type="TASK"
              @task-details-close="updateDashboardKey"
            />
          </div>
          <!-- <div class="col-12 md:col-6">
            <WidgetUsers
              :users="
                (dashboardData as DashboardClient)
                  ?.assignedTeam as unknown as User[]
              "
            />
          </div> -->
        </div>
      </div>
    </TabPanel>
    <TabPanel header="Contracts">
      <ClientsWebforms webform-type="CONTRACT" :client="clientDetails" />
    </TabPanel>
    <TabPanel header="Requests">
      <ClientsWebforms webform-type="ORGANIZER" :client="clientDetails" />
    </TabPanel>
    <TabPanel
      v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
      header="Tasks"
    >
      <Common426 v-if="featureSubscribed('work', 'task') === false" feature="tasks" />
      <div v-else>
        <div class="flex justify-content-between mb-4">
          <div>
            <h2 class="text-3xl text-primary">
              {{
                ` ${
                  selectedTaskType === 'TASK' ? 'Team' : ' Client Request'
                } ( ${currentStatus ? currentStatus : ''} )`
              }}
            </h2>
          </div>
          <div v-if="canDo('tasks', 'create')">
            <div
              v-tooltip.left="
                handleTooltip(
                  !!canDoActions,
                  `${
                    selectedTaskType === 'TASK'
                      ? 'Add Team Task'
                      : 'Add Client Request'
                  }`,
                  disabledTooltip,
                )
              "
              style="height: 2.357rem;"
            >
              <Button
                icon="pi pi-plus"
                class="p-button-rounded"
                :disabled="!canDoActions"
                @click="handleCreate"
              />
            </div>
          </div>
        </div>
        <div class="justify-content-end mr-auto mb-4">
          <Dropdown
            v-model="selectedTaskType"
            option-label="name"
            option-value="value"
            :options="taskStatusOptions"
            placeholder="Select a user"
            @change="updateSelectedTaskStatus"
          />
        </div>
        <TasksList
          v-if="canDo('tasks', 'list')"
          ref="tasksListRef"
          :client-id="clientId"
          :entity-type="selectedTaskType"
          :disabled-filters="['Client']"
          @task-status-title="handleStatusName"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Active Tasks list.
          </p>
        </div>
      </div>
    </TabPanel>
    <!-- <TabPanel header="Update Details">
      <h2 class="text-3xl text-primary">Update Details</h2>
      <ClientsCreateForm />
    </TabPanel> -->
    <TabPanel
      v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
      header="Active & Scheduled Projects"
    >
      <Common426
        v-if="featureSubscribed('work', 'project') === false"
        feature="projects"
      />
      <div v-else>
        <div class="flex justify-content-between mb-3 ml-auto">
          <h2
            v-if="isProjectCreate || isProjectTemplate || mode === 'list'"
            class="text-3xl text-primary"
          >
            {{
              isProjectCreate || isProjectTemplate
                ? 'Create Project'
                : 'Active & Scheduled Projects'
            }}
          </h2>

          <span v-else-if="mode === 'kanban'">
            <Dropdown
              v-if="!selectedTemplate"
              v-model="selectedTemplate"
              :options="templateOptions || []"
              option-label="label"
              option-value="value"
              placeholder="Select Project Template"
              class="bg-primary text-white project-template-select"
              show-clear
            />
            <div
              v-else-if="
                isFiltersVisible
                  && mode !== 'list'
                  && !(isProjectCreate || isProjectTemplate)
              "
            >
              <ProjectFilter
                ref="filtersRef"
                :filters="queryFilters"
                :disabled-filters="
                  mode === 'kanban' ? ['Project Stage', 'Service'] : undefined
                "
              />
            </div>
          </span>

          <div
            v-if="!(isProjectCreate || isProjectTemplate)"
            class="flex align-items-center"
            :class="[
              { 'mb-3': mode !== 'list' },
              { 'mb-4': isFiltersVisible && mode !== 'list' },
            ]"
          >
            <span
              v-tooltip.left="
                `${projectResource.limit && (projectResource.usage >= projectResource.limit) ? `Can't create more than available limit ${projectResource.limit}` : projectResource.limit && (projectResource.usage >= projectResource.limit) ? `Available limit of ${projectResource.limit} projects already created` : handleTooltip(!!canDoActions, 'Create Project', disabledTooltip)}`
              "
              class="inline-block"
              style="height: 2.357rem;"
            >
              <Button
                icon="pi pi-plus"
                class="p-button-rounded"
                :disabled="!canDoActions || (projectResource.limit && (projectResource.usage >= projectResource.limit))"
                @click="isProjectDialog = true"
              />
            </span>
            <div class="inline-flex align-items-center ml-2">
              <Button
                v-if="mode === 'kanban'"
                type="button"
                :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
                class="p-button-icon-only p-button-rounded mr-2 flex-shrink-0"
                :class="[{ 'p-button-danger': queryFilters }]"
                @click="toggleFilters(!!queryFilters)"
              />
              <a
                href="https://brightreturn.com/kb/cpa-project-management"
                target="_blank"
              >
                <Button
                  v-tooltip.top="'Need Help'"
                  type="button"
                  icon="pi pi-question-circle text-lg"
                  class="p-button-icon-only p-button-rounded mr-2"
                />
              </a>
              <span
                v-tooltip="'List View'"
                class="cursor-pointer inline-flex"
                @click.prevent="mode = 'list'"
              >
                <svg
                  class="w-2rem h-2rem"
                  :class="mode === 'kanban' ? 'text-primary' : 'text-gray-300'"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
              <span
                v-tooltip="'Kanban Board View'"
                class="cursor-pointer inline-flex"
                @click.prevent="mode = 'kanban'"
              >
                <svg
                  class="w-2rem h-2rem"
                  :class="mode === 'list' ? 'text-primary' : 'text-gray-300'"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>
        <transition name="slide-up" mode="out-in">
          <div
            v-if="
              !(isProjectCreate || isProjectTemplate)
                && isFiltersVisible
                && mode !== 'list'
            "
            class="-mt-3 mb-3"
          >
            <ProjectFilter
              v-if="!selectedTemplate"
              ref="filtersRef"
              :filters="queryFilters"
              :client-id="clientId"
              :disabled-filters="
                mode === 'kanban'
                  ? ['Project Stage', 'Client', 'Service']
                  : ['Service']
              "
            />
            <div v-else class="flex gap-3 align-items-center pt-2">
              <Dropdown
                v-model="selectedTemplate"
                :options="templateOptions || []"
                option-label="label"
                option-value="value"
                placeholder="Select Project Template"
                class="bg-primary text-white project-template-select"
                show-clear
                @change="handleTemplateProjectSelection"
              />
            </div>
          </div>
        </transition>
        <template v-if="!(isProjectCreate || isProjectTemplate)">
          <transition-group key="toggle-view" name="slide-up">
            <div v-if="mode === 'list'" key="list-view">
              <ProjectList
                v-if="canDo('projects', 'list')"
                :client-id="clientId"
                :disabled-filters="['Client']"
              />
              <div v-else class="card">
                <p class="text-center font-medium text-xl">
                  You don't have access of the Active & Scheduled projects list.
                </p>
              </div>
            </div>
            <ProjectKanbanBoard
              v-else
              key="kanban-view"
              :client-id="clientId"
              :project-stages="selectedStages"
              :service-id="selectedTemplate"
            />
          </transition-group>
        </template>
        <ProjectCreate
          v-if="isProjectCreate || isProjectTemplate"
          :is-template="isProjectTemplate"
          :client-id="clientId"
          @modal-close="closeCreateProject"
        />
      </div>
    </TabPanel>
    <TabPanel v-if="canDo('unscheduled_projects', 'list')" header="Automation">
      <TabView
        ref="nestedTabRef"
        v-model:activeIndex="activeNestedTabIndex"
        lazy
        @tab-change="handleTabChange($event, true)"
        @tab-click="handleTabChange($event, true)"
      >
        <TabPanel
          v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
          header="Unscheduled Projects"
        >
          <Common426
            v-if="featureSubscribed('work', 'project') === false"
            feature="projects"
          />
          <CommonPage v-else :title="unplannedPageHeader">
            <!-- <template #description>
          <transition name="slide-down" appear>
            <p v-if="currentStepDetails?.step === 'select clients'">
              <template v-if="currentStepDetails.typeofSchedule === 'Schedule'">
                One project will be created for each client. After scheduling
                them you can view/edit/reschedule/delete these projects under
                <strong
                  class="text-primary underline cursor-pointer"
                  @click="
                    router.push({
                      name: 'admin-projects',
                      query: { activeIndex: 1 },
                    })
                  "
                >
                  Active & Scheduled
                </strong>
                tab.
              </template>
              <template v-else
                >List of all the projects that are either active or scheduled
                already.
              </template>
            </p>
            <p
              v-else-if="currentStepDetails?.step === 'update project details'"
            >
              <template v-if="currentStepDetails.typeofSchedule === 'Schedule'">
                Team members assigned the clients will become Project Managers
                for all the projects of their clients, you can always reassign
                the Project Manager even after scheduling.
              </template>
              <template v-else
                >Unplanned project will be extended to new due date for the
                selected client(s).</template
              >
            </p>
            <p v-else-if="currentStepDetails?.step === 'update tasks'"></p>
            <template v-else>Lists of all unscheduled Projects. </template>
          </transition>
        </template> -->
            <template #helpActions>
              <div class="w-full max-w-26rem ml-auto -mb-2">
                <a
                  aria-label="setup project template video"
                  class="font-medium flex justify-content-end align-items-center cursor-pointer"
                  @click="isScheduleHelpVideoOpen = true"
                ><i
                   class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
                 />
                  <span>Help</span></a>
              </div>
            </template>
            <div class="card">
              <ProjectList
                v-if="canDo('unscheduled_projects', 'list')"
                :un-planned-client-id="clientId"
                is-unplanned
                @update-title-desc="updateTitleDesc"
                @back="handleScheduleBack"
              />
              <p v-else class="text-center font-medium text-xl">
                You don't have access of the Unscheduled projects list.
              </p>
            </div>
          </CommonPage>
        </TabPanel>
        <TabPanel
          v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
          header="Rules"
        >
          <Common426
            v-if="featureSubscribed('work', 'automation') === false"
            feature="automation rules"
          />
          <div v-else>
            <div
              class="flex justify-between border-bottom-2 default-border-color pb-3 mb-3"
            >
              <h1 class="text-3xl text-primary flex-1 mb-0">
                {{ automationTitle }}
                <small class="block text-gray-500 text-sm font-normal">{{ automationSubTitle }}
                </small>
              </h1>
              <a
                aria-label="setup project template video"
                class="font-medium flex justify-content-end align-items-center cursor-pointer"
                @click="isAutomateHelpVideoOpen = true"
              ><i
                 class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
               />
                <span>Help</span>
              </a>
            </div>
            <ClientsAutomation
              v-if="
                canAccessAllMenu
                  || clientDetails?.relationshipManager?.id === currentUser.id
              "
              :client="(clientDetails as Client)"
              @title="handleTitle"
            />
            <div v-else class="card">
              <p class="text-center font-medium text-xl">
                You don't have access for the Automation.
              </p>
            </div>
          </div>
        </TabPanel>
        <TabPanel header="States">
          <h2 class="text-3xl text-primary">
            States
          </h2>
          <ClientsStates client="clientDetails" />
        </TabPanel>
      </TabView>
    </TabPanel>
    <TabPanel
      v-if="isFeatureIntegrated(['client_billing'], allOrgIntegrationIds)"
      header="Billing"
    >
      <TabView
        ref="nestedTabRef"
        v-model:activeIndex="activeNestedTabIndex"
        lazy
        @tab-change="handleTabChange($event, true)"
        @tab-click="handleTabChange($event, true)"
      >
        <TabPanel
          v-if="metaFilter(clientDetails?.meta as MetaObj[], 'quickbooksId')"
          header="Quickbooks Invoices"
        >
          <h2 class="text-3xl text-primary">
            Quickbooks Invoices
          </h2>
          <ReportsQuickBookInvoice
            v-if="
              canAccessAllMenu
                || clientDetails?.relationshipManager?.id === currentUser.id
            "
            :client-id="clientId"
            :disabled-filters="['Client']"
          />
          <div v-else class="card">
            <p class="text-center font-medium text-xl">
              You don't have access for the Quickbooks Invoices.
            </p>
          </div>
        </TabPanel>
        <TabPanel header="Invoices">
          <Common426
            v-if="featureSubscribed('billing', 'invoice') === false"
            feature="invoices"
          />
          <BillingInvoicesList
            v-else-if="billingProfileIdParam"
            :billing-profile-id="billingProfileIdParam"
            :client-id="clientId"
            :client-details="clientDetails"
            :disabled-filters="['Client']"
          />

          <CommonPage v-else title="Invoices">
            <div class="card shadow-3 text-center text-xl">
              There is no billing profile attached to <span class="font-medium">{{ clientDetails?.name }}</span>.
              <div>
                Create billing profile and attach from <router-link v-if="canAccessAllMenu" :to="{ name: 'admin-client-billing-create' }" class="font-medium hover:underline">
                  here.
                </router-link>
              </div>
            </div>
          </CommonPage>
        </TabPanel>
        <TabPanel header="Payments">
          <Common426
            v-if="featureSubscribed('billing', 'payment') === false"
            feature="payments"
          />
          <CommonPage
            title="Payments"
          >
            <template #actions>
              <!-- <Button
            v-if="canDo('leave', 'create')"
            class="p-button"
            @click="createLeaveDialog = true"
            label="Apply For Leave"
          /> -->
            </template>
            <div class="card">
              <template v-if="canDo('client_billing', 'list')">
                <BillingPaymentsList
                  v-if="billingProfileIdParam"
                  data-permission="canDo('payments', 'list')"
                  :disabled-filters="['Client']"
                  :client-id="clientId"
                  :billing-profile-id="billingProfileIdParam"
                />
                <div v-else class="card shadow-3 text-center text-xl">
                  There is no billing profile attached to <span class="font-medium">{{ clientDetails?.name }}</span>.
                  <div>
                    Create billing profile and attach from <router-link v-if="canAccessAllMenu" :to="{ name: 'admin-client-billing-create' }" class="font-medium hover:underline">
                      here.
                    </router-link>
                  </div>
                </div>
              </template>
              <p v-else class="text-center font-medium text-xl">
                You don't have access of the Payments list.
              </p>
            </div>
          </CommonPage>
        </TabPanel>
      </TabView>
    </TabPanel>
    <!-- <TabPanel header="Contracts">
      <h2 class="text-3xl text-primary">Contracts</h2>
      <ClientsContractList
        v-if="
          canAccessAllMenu ||
          clientDetails?.relationshipManager.id === currentUser.id
        "
      />
      <div class="card" v-else>
        <p class="text-center font-medium text-xl">
          You don't have access of the Contracts.
        </p>
      </div>
    </TabPanel> -->

    <TabPanel :header="`${pluralize($tConfig('CONTACT'))}`">
      <h2 class="text-3xl text-primary">
        {{ `${$tConfig('CLIENT')}` }} Users
      </h2>
      <CommonLoading v-if="loadingClientDetails" />
      <template v-else>
        <ClientsUsersForm
          v-if="
            canAccessAllMenu
              || clientDetails?.relationshipManager?.id === currentUser.id
          "
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the {{ `${$tConfig('CLIENT')}` }} Users.
          </p>
        </div>
      </template>
    </TabPanel>
    <TabPanel header="Team">
      <ClientsTeam :client="clientDetails" />
    </TabPanel>
    <TabPanel
      v-if="isFeatureIntegrated(['documents'], allOrgIntegrationIds)"
      header="Documents"
    >
      <Common426
        v-if="featureSubscribed('document_managment', 'documents') === false"
        feature="documents"
      />
      <ClientsDocuments
        v-else
        :business-type="clientDetails?.businessEntity?.businessType"
      />
    </TabPanel>
    <TabPanel
      v-if="isFeatureIntegrated(['esign'], allOrgIntegrationIds)"
      header="eSignature"
    >
      <Common426
        v-if="featureSubscribed('esignature', 'esign') === false"
        feature="esignature"
      />
      <ClientsESignTab v-else />
    </TabPanel>
    <TabPanel header="Details">
      <h2 class="text-3xl text-primary">
        Contact Details
      </h2>
      <ClientsAddInfoForm />
    </TabPanel>

    <!-- <TabPanel v-if="isSetupCompleted" header="Quick Start">
      <h2 class="text-3xl text-primary">Quick Start</h2>
      <CommonGetStart
        :timelineSteps="gettingStartedSteps"
        @emitStep="handleStep"
      />
    </TabPanel> -->
  </TabView>
  <CommonConfirmRemoveDialog
    v-if="clientDetails && removeOrDisableClientDialog"
    :visible="removeOrDisableClientDialog"
    :record-to-remove="({ ...clientDetails } as Record<string, any>)"
    :is-remove="!isClientConnected"
    :title="`${isRemoveClient ? `Remove ${$tConfig('CLIENT')}` : `${activeStatus} ${$tConfig('CLIENT')}`}`"
    class="remove-dialog"
    @confirm="isRemoveClient ? handleDelete : handleActivation(activeStatus)"
    @hide="removeOrDisableClientDialog = false"
  >
    <div>
      <div v-if="isClientConnected" class="mb-2">
        <div>
          <strong> {{ clientDetails.name }} </strong> has following
          dependencies:
          <ul>
            <template
              v-for="(value, key, index) in clientDetails._count"
              :key="index"
            >
              <li v-if="value">
                There {{ value > 1 ? 'are' : 'is' }}
                <strong>
                  {{ value }}
                </strong>
                {{ clientDisableMessage(key, value) }}
              </li>
            </template>
          </ul>
        </div>
        If you <span class="lowercase mr-1">{{ activeStatus }}</span>
        <strong>{{ selectedClient?.name }}</strong>, all the connected
        <template v-if="clientCounts.users !== 0">
          {{ `${$tConfig('CLIENT').toLowerCase()}` }} user(s) will be disabled{{
            clientCounts.projects !== 0 || clientCounts.entities !== 0
              ? ','
              : ''
          }}
        </template>
        <template v-if="clientCounts.projects !== 0">
          project(s) will be
          {{ activeStatus === 'Enable' ? 'scheduled' : 'archived'
          }}{{ clientCounts.entities !== 0 ? ',' : '' }}
        </template><template v-if="clientCounts.entities !== 0">
          task(s) will be deleted
        </template>.
      </div>
      <div>
        Are you sure you want to {{ isRemoveClient ? 'Delete' : activeStatus }}
        <strong> {{ clientDetails.name }} </strong>?
      </div>
    </div>
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="clientDetails && closeOrReopenClientDialog"
    :visible="closeOrReopenClientDialog"
    :record-to-remove="{ ...clientDetails } as Record<string, any>"
    :title="`${!clientDetails.isClosed ? 'Close the Case' : `Reopen the Case`}`"
    class="remove-dialog"
    @confirm="handleClosure(closureStatus)"
    @hide="closeOrReopenClientDialog = false"
  >
    <div>
      <div>
        Are you sure you want to {{ !clientDetails.isClosed ? 'Close' : 'Re-open' }}
        <strong> {{ clientDetails.name }} </strong>?
      </div>
    </div>
  </CommonConfirmRemoveDialog>
  <Dialog
    v-model:visible="editClientDialog"
    modal
    append-to="body"
    :header="`Update ${$tConfig('CLIENT')}`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="editClientDialog = false"
  >
    <ClientsCreateForm
      :key="formKey"
      :user="clientDetails"
      @close="editClientDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isDialogVisibleQuickStart"
    :modal="true"
    append-to="body"
    header="Quick Start"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonGetStart
      :timeline-steps="gettingStartedSteps"
      @emit-step="handleStep"
    />
  </Dialog>
  <Dialog
    v-model:visible="isDialogVisible"
    :modal="true"
    append-to="body"
    header="Create Project"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <ProjectAddProject
      :client-id="clientId"
      @modal-close="closeDialog"
    />
  </Dialog>
  <Dialog
    v-model:visible="openTaskCreate"
    :modal="true"
    append-to="body"
    :header="`Create ${
      selectedTaskType === 'TASK' ? 'Team Task' : 'Client Request'
    }`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <TasksCreateUpdate
      :key="formKey"
      :client-id="clientId"
      :entity-type="selectedTaskType"
      @close="handleClose"
    />
  </Dialog>
  <Dialog
    v-model:visible="isAutomateHelpVideoOpen"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '75vw' }"
    content-class="border-round-bottom-md"
    :header="`Automate ${$tConfig('CLIENT')} Work`"
    @hide="isAutomateHelpVideoOpen = false"
  >
    <div class="video-container">
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/rPxnfMO5w2Q"
        :title="`Automate ${$tConfig('CLIENT')} Work`"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
  </Dialog>
  <Dialog
    v-model:visible="isScheduleHelpVideoOpen"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '75vw' }"
    content-class="border-round-bottom-md"
    header="Schedule / Extend Project"
    @hide="isScheduleHelpVideoOpen = false"
  >
    <div class="video-container">
      <iframe
        width="560"
        height="315"
        src="https://www.youtube.com/embed/KrsFrffdPoM"
        title="Schedule / Extend Project"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
  </Dialog>
  <Dialog
    v-model:visible="isProjectDialog"
    :modal="true"
    append-to="body"
    header="Create Project"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <div class="px-3">
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg">
          Create project through template
          <p class="font-normal text-base mt-1">
            Use the templates to create the project.
          </p>
        </div>
        <Button
          label="Add using Template"
          class="p-button-outlined"
          @click="prepareForTemplate"
        />
      </div>
      <Divider />
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg">
          Manually Enter Information
          <p class="font-normal text-base mt-1">
            Manually enter your project information to get started.
          </p>
        </div>
        <Button
          label="Add Manually"
          class="p-button-outlined"
          @click="prepareForCreate"
        />
      </div>
    </div>
  </Dialog>
  <Dialog
    v-model:visible="isCreateUpdateFeedbackDialog"
    :modal="true"
    append-to="body"
    header="Create Feedback"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
  >
    <ClientFeedbackCreateForm @modal-close="isCreateUpdateFeedbackDialog = false" />
  </Dialog>
</template>

<style scoped lang="scss">
:deep(.p-tabview-panel) {
  header {
    padding-bottom: v-bind('unplannedHeaderStyles.padding') !important;
    border-bottom: v-bind('unplannedHeaderStyles.borderBottom') !important;
  }
}

:deep(*) {
  .comments-container {
    max-height: calc(20rem - 70px) !important;
    overflow-y: auto !important;
  }

  @media (width >= 48em) {
    .card-container {
      height: calc(18rem - 9px) !important;
    }
  }
}

:deep(.project-template-select) {
  .p-dropdown-label.p-placeholder,
  .p-dropdown-trigger,
  .p-dropdown-label,
  .p-dropdown-clear-icon {
    color: white !important;
  }
}
</style>
