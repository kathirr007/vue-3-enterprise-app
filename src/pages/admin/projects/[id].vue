<script lang="ts" setup>
import TabView from 'primevue/tabview';

import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { Project } from '@/types/project.type';
import type { Card } from '@/types/dashboard.type';
import type { FullNameObj, User } from '@/types/teams.type';
import type { APIActions, MetaObj } from '@/types/common.type';

const route = useRoute();
const projectId = ref(route.params.id as string);
const { getProjectDashboard } = useDashboardMatrix();
const { fullName, dateToHumanShort } = useVueFilters();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { getGettingStartedSteps } = useCommonListQueries();
const { metaFilter } = useUtilityFns();
const { data: gettingStartedSteps } = getGettingStartedSteps(
  projectId.value as string
);
const { updateBreadcrumb } = useBreadcrumbs();
const { activeIndex, activeTabIndex, handleStep, handleTabChange, tabRef }
  = useSteps('admin-projects-id');
const { handleTooltip } = useTooltip();
const router = useRouter();
const { canDo } = usePermissions();
const { overDue } = useOverDueColor();
const { isPortalUser } = useCurrentUserData();

const isDialogVisible = ref(false);
const generateInvoiceDialog = ref(false);
const isCreateUpdateFeedbackDialog = ref(false);
const cards = ref<Card[]>([
  {
    id: 'totalCompletedTasks',
    title: 'Total Completed Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'pi pi-check'
  },
  {
    id: 'incompleteTasks',
    title: 'Incomplete Tasks',
    value: '',
    color: '',
    icon: 'clarity:tasks-outline-alerted',
    iconify: true
  },
  {
    id: 'overDueTasks',
    title: 'Over Due Tasks',
    value: '',
    color: '',
    icon: 'ic:outline-priority-high',
    iconify: true
  },
  {
    id: 'totalTasks',
    title: 'Total Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'ic:round-format-list-bulleted',
    iconify: true
  },
  {
    id: 'estimatedTime',
    title: 'Project Budget Time',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'pi pi-clock'
  }
]);

const isAvailable = ref(true);
const isDialogVisibleQuickStart = ref(false);
const estimateProjectDialog = ref(false);
const createProjectDialog = ref(false);
const deleteProjectDialog = ref(false);
const isInvoiceCreate = ref(false);
const disabledTooltip = ref('Project is archived, Please restore the project.');
const clientDisabledTooltip = ref(
  'Client is disabled, Please enable the client.'
);

const { data: projectDetails } = useQuery(
  'project-details',
  () => {
    if (!projectId.value)
      return;
    return useProjectDetails(projectId.value as string);
  },
  {
    onSuccess: async (data: Project) => {
      updateBreadcrumb({
        breadcrumbs: [
          { label: 'Projects', to: { name: 'admin-projects' } },
          { label: data.name }
        ]
      });
      if (data.dueDate && !isPortalUser.value) {
        const response = await checkAvailability({
          date: data.dueDate,
          userId: data.projectManagerId
        });
        isAvailable.value = response;
      }
    }
  }
);

const isUserAvailable = computed(() => {
  return isAvailable.value;
});

const isSetupCompleted = computed(() => {
  if (projectDetails.value) {
    return !!projectDetails.value.isSetupCompleted;
  }
});

const isProjectCompleted = computed(() => {
  if (projectDetails.value) {
    return projectDetails.value?.status?.name === 'Completed';
  }
});
const activeStatus = computed(() => {
  return projectDetails.value?.status.name === 'Archived'
    ? 'Restore'
    : 'Archive';
});
const canDoActions = computed(() => {
  return projectDetails.value?.status.name !== 'Archived';
});

const invoiceGenerationStatus = computed(() => {
  if (
    projectDetails.value?.billingType === null
    || projectDetails.value?.billingType === 'NONE'
  ) {
    return 'Unable to generate invoice when billing type is NONE';
  }
  else if (projectDetails.value?.client === null) {
    return 'The Project is not associated with any client, please assign a client first to generate an invoice.';
  }
  else if (
    (projectDetails.value?.client?.clientBillingProfile as any[])?.length === 0
  ) {
    return 'The client associated with the project is not part of any billing profile, please assign a client attached to this project to any billing profile.';
  }
  else {
    return 'Generate Invoice';
  }
});

const isActionDisable = computed(() => {
  return (
    !canDoActions
    || projectDetails.value?.client === null
    || projectDetails.value?.billingType === null
    || projectDetails.value?.billingType === 'NONE'
    || (projectDetails.value?.client?.clientBillingProfile as any[])?.length === 0
  );
});

const isQuickbooksClient = computed(() =>
  metaFilter(projectDetails.value?.client?.meta as MetaObj[], 'quickbooksId')
);

provide('disabledTooltip', disabledTooltip);
provide('clientDisabledTooltip', clientDisabledTooltip);
provide('canDoActions', canDoActions);

const isCompleteTasks = computed(() => {
  const result = cards.value.find(val => val.id === 'incompleteTasks');
  if ((result?.value as any) === 0) {
    return 'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400';
  }
  else {
    return 'text-3xl text-red-500 bg-white hover:text-white hover:bg-red-500 transition-all transition-duration-400';
  }
});
const isOverDue = ref();

const { data: dashboardData, isFetching } = useQuery(
  ['dashboard-project', cards, projectId],
  () => {
    return getProjectDashboard(projectId.value as string);
  },
  {
    onSuccess: (data) => {
      if (data)
        cards.value = cards.value.map((e, i) => {
          switch (e.id) {
            case 'totalCompletedTasks':
              return {
                ...e,
                value: `${data.totalCompletedTasks} `
              };
            case 'overDueTasks':
              return {
                ...e,
                value: `${data.overDueTasks}`,
                color: `${isOverDue.value}`
              };
            case 'totalTasks':
              return {
                ...e,
                value: `${data.totalTasks} `
              };
            case 'incompleteTasks':
              return {
                ...e,
                value: `${data.incompleteTasks}`,
                color: `${isCompleteTasks.value}`
              };
            case 'estimatedTime':
              return {
                ...e,
                value: `${data.estimatedTime}`
              };

            default: {
              return {};
            }
          }
        }) as Card[];
    }
  }
);

function showToast(type: APIActions) {
  initToast({
    actionType: type,
    title: 'Project',
    actionObj: { ...projectDetails.value }
  });
}
const { mutateAsync: archiveServiceFunc } = useMutation(
  (id: string) => useProjectArchive(id),
  {
    onSuccess: () => {
      showToast('Archive');
      queryClient.invalidateQueries('project-details');
      router.push({
        name: 'admin-projects-id',
        params: { id: projectId.value }
      });
    }
  }
);

const { mutateAsync: restoreServiceFunc } = useMutation(
  (id: string) => useProjectRestore(id),
  {
    onSuccess: () => {
      showToast('Restore');
      queryClient.invalidateQueries('project-details');
      queryClient.invalidateQueries('dashboard-project');
    }
  }
);

function projectActions() {
  if (activeStatus.value !== 'Archive') {
    restoreServiceFunc(projectDetails.value?.id as string);
  }
  else {
    archiveServiceFunc(projectDetails.value?.id as string);
  }
}
function handleInvoiceCreateBack() {
  isInvoiceCreate.value = false;
}

function prepareForeGenerateInvoice() {
  if (isQuickbooksClient.value) {
    generateInvoiceDialog.value = true;
  }
  else {
    isInvoiceCreate.value = true;
  }
}

function startGenerateInvoice(isEstimate = false) {
  generateInvoiceDialog.value = false;
  isEstimate
    ? (estimateProjectDialog.value = true)
    : (isInvoiceCreate.value = true);
}

watchEffect(() => {
  isOverDue.value = overDue(cards.value);
  if (activeIndex.value) {
    activeTabIndex.value = +activeIndex.value;
  }
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <transition name="slide-left" mode="out-in">
    <div v-if="isInvoiceCreate" class="card">
      <CommonPage title="Generate Invoice">
        <BillingInvoiceGenerate
          :create="true"
          :project-details="projectDetails"
          @back="handleInvoiceCreateBack"
          @success="handleInvoiceCreateBack"
        />
      </CommonPage>
    </div>
    <div v-else>
      <div class="flex flex-column md:flex-row card align-items-end">
        <div class="w-full md:w-7 mb-2 md:mb-0">
          <div class="flex align-items-center">
            <div class="ml-2 space-y-0.5 flex-1">
              <h1 class="text-3xl text-primary mb-2">
                {{ projectDetails?.name }}
                <!-- <span class="text-lg"
                  >for <strong> {{ projectDetails?.client?.name }} </strong></span
                > -->
              </h1>
              <div v-if="projectDetails" class="inline-flex align-items-center">
                Tags:
                <div
                  v-if="projectDetails?.tags"
                  class="flex flex-wrap gap-1 ml-1"
                >
                  <CommonTags
                    :current-id="projectId"
                    :data="projectDetails"
                    tag-type="PROJECT"
                  />
                </div>
              </div>
              <div
                v-if="projectDetails?.client"
                class="flex flex-column md:flex-row text-base mb-2"
              >
                <span>
                  Client:
                  <strong>{{ projectDetails?.client?.name }} </strong>
                </span>
              </div>
              <div
                class="flex flex-column align-items-center md:flex-row text-base mb-2"
              >
                <span>
                  Due by:
                  <strong>{{
                    dateToHumanShort(projectDetails?.dueDate as string)
                  }}</strong>
                  <span
                    v-if="!isPortalUser && !isUserAvailable"
                    class="ml-1 font-normal text-orange-500"
                  >
                    Leaves/Holidays are conflicting with Project's Due date
                  </span>
                </span>
              </div>
              <div class="flex flex-column md:flex-row text-base mb-2">
                <span>
                  Project Manager:
                  <strong>{{
                    fullName(projectDetails?.projectManager as FullNameObj)
                  }}</strong>
                </span>
              </div>
              <div
                v-if="projectDetails?.pipelineStage"
                class="flex flex-column md:flex-row text-base mb-2"
              >
                <span>
                  Project Stage:
                  <strong>{{
                    projectDetails?.pipelineStage?.name as string
                  }}</strong>
                </span>
              </div>
              <!-- <div class="w-full inline-flex align-items-center space-x-2.5">
                <i class="pi pi-clock text-2xl text-primary"></i>

                <span class="text-gray-800">{{ 'One Time' }}</span>
              </div> -->
            </div>
          </div>
        </div>
        <div class="w-full md:w-5 flex justify-content-end gap-1">
          <Button
            v-if="isSetupCompleted && canDoActions"
            v-tooltip.top="'Quick Start'"
            icon="pi "
            class="p-button-sm p-button-rounded"
            aria-label="Quick Start"
            @click="isDialogVisibleQuickStart = true"
          >
            <Icon icon="mdi:hand-coin" class="flex-none text-xl" />
          </Button>
          <span v-tooltip="invoiceGenerationStatus">
            <Button
              v-if="activeStatus === 'Archive'"
              :disabled="isActionDisable"
              icon="pi"
              class="p-button-sm p-button-rounded"
              @click="prepareForeGenerateInvoice"
            >
              <Icon icon="la:file-invoice-dollar" class="flex-none text-lg" />
            </Button>
          </span>
          <div
            v-if="canDo('projects', 'edit')"
            v-tooltip.top="
              handleTooltip(!!canDoActions, 'Edit', disabledTooltip)
            "
            style="height: 2.357rem;"
          >
            <Button
              :disabled="!canDoActions"
              icon="pi pi-pencil"
              class="p-button-sm p-button-rounded"
              @click="createProjectDialog = true"
            />
          </div>
          <Button
            v-if="activeStatus === 'Archive' && canDo('projects', 'delete')"
            v-tooltip.top="activeStatus"
            class="p-button-sm p-button-rounded p-button-icon-only bg-orange-500 border-orange-500 hover:bg-orange-400 hover:border-orange-400"
            :aria-label="activeStatus"
            @click="deleteProjectDialog = true"
          >
            <div class="flex-none">
              <Icon icon="fa6-solid:box-archive" class="text-lg" />
            </div>
          </Button>
          <div
            v-if="activeStatus === 'Restore' && canDo('projects', 'create')"
            v-tooltip.left="
              `${
                !projectDetails?.client?.isActive
                && projectDetails?.client !== null
                  ? clientDisabledTooltip
                  : activeStatus
              }`
            "
            style="height: 2.357rem;"
          >
            <Button
              :disabled="
                !projectDetails?.client?.isActive
                  && projectDetails?.client !== null
              "
              icon="pi pi-undo"
              class="p-button-sm p-button-rounded flex-none"
              :aria-label="activeStatus"
              @click="deleteProjectDialog = true"
            />
          </div>
          <span v-if="isProjectCompleted" v-tooltip="`${projectDetails?.feedback ? 'Feedback is generated' : 'Generate Feedback'}`">
            <Button
              :disabled="!!projectDetails?.feedback"
              icon="pi"
              class="p-button-sm p-button-rounded"
              @click="isCreateUpdateFeedbackDialog = true"
            >
              <Icon icon="codicon:feedback" class="flex-none text-lg" />
            </Button>
          </span>
          <a
            href="https://brightreturn.com/kb/cpa-project-management"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded"
            />
          </a>
        </div>
      </div>
      <div>
        <TabView
          ref="tabRef"
          v-model:activeIndex="activeTabIndex"
          lazy
          @tab-change="handleTabChange"
        >
          <!-- <TabPanel header="Basic Info">
            <h2 class="text-3xl text-primary">Basic Info</h2>
            <ProjectAddProject @emitStep="handleStep" />
          </TabPanel> -->
          <TabPanel header="Tasks">
            <ProjectAddTaskForm
              :project-details="projectDetails as Project"
              @tasks-updated="queryClient.invalidateQueries('project-details')"
            />
          </TabPanel>
          <TabPanel
            v-if="!isSetupCompleted && canDoActions"
            header="Getting Started"
          >
            <h2 class="text-3xl text-primary">
              Getting Started
            </h2>
            <CommonGetStart
              :timeline-steps="gettingStartedSteps"
              @emit-step="handleStep"
            />
          </TabPanel>
          <TabPanel v-if="isSetupCompleted && canDoActions" header="Dashboard">
            <h2 class="text-3xl text-primary">
              Dashboard
            </h2>

            <div class="grid">
              <WidgetCards
                class="col-12 mb-4"
                :cards="cards"
                :cards-in-row="5"
                :loading="isFetching"
              />

              <div class="col-12 md:col-6">
                <div class="box-shadow card mx-auto">
                  <h6 class="text-500 font-medium mb-3">
                    Notes
                  </h6>
                  <CommonComments
                    resource-type="PROJECT"
                    :resource-id="projectId"
                  />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <WidgetUsers
                  :users="dashboardData?.assignedTeam as unknown as User[]"
                  :loading="isFetching"
                />
              </div>
            </div>
          </TabPanel>
          <!-- <TabPanel v-if="isSetupCompleted && canDoActions" header="Quick Start">
            <h2 class="text-3xl text-primary">Quick Start</h2>
            <CommonGetStart
              :timelineSteps="gettingStartedSteps"
              @emitStep="handleStep"
            />
          </TabPanel> -->
        </TabView>
      </div>
    </div>
  </transition>
  <CommonConfirmRemoveDialog
    v-if="projectDetails && deleteProjectDialog"
    :visible="deleteProjectDialog"
    :record-to-remove="projectDetails as Record<string, any>"
    :title="`Confirm ${
      activeStatus === 'Archive' ? 'Archive' : 'Restore'
    } Project`"
    @confirm="projectActions"
    @hide="deleteProjectDialog = false"
  >
    <div>
      <div>
        <strong>{{ projectDetails?.name }}</strong> will be
        {{ activeStatus === 'Archive' ? 'archived' : 'restored' }}.
      </div>
      <div v-if="activeStatus === 'Archive'">
        {{ `Archiving a project will make it's associated tasks inactive.` }}
      </div>
      Are you sure you want to
      {{ activeStatus === 'Archive' ? 'archive' : 'restore' }}
      <strong>{{ projectDetails?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
  <Dialog
    v-model:visible="createProjectDialog"
    :modal="true"
    append-to="body"
    header="Update Project"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <ProjectAddProject
      disable-bright-assist
      @modal-close="createProjectDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="estimateProjectDialog"
    :modal="true"
    append-to="body"
    header="Generate Estimate"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <ProjectEstimateForm @modal-close="estimateProjectDialog = false" />
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
    v-model:visible="generateInvoiceDialog"
    :modal="true"
    append-to="body"
    header="Generate Invoice"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <div class="px-3">
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg">
          Generate Invoice with Brightreturn (Recommended)
          <p class="font-normal text-base mt-1">
            With BrightReturn, easily generate invoices, send reminders, and
            collect payments via PayPal and Stripe.
          </p>
        </div>
        <Button
          label="Generate Invoice"
          class="p-button-outlined"
          @click="startGenerateInvoice(false)"
        />
      </div>
      <Divider />
      <div class="flex justify-content-between align-items-center">
        <div class="font-medium text-lg">
          Generate estimate on Quickbooks
          <p class="font-normal text-base mt-1">
            Generate estimate, convert to QuickBooks invoice for client sharing.
            QuickBooks payment integration needed for collection.
          </p>
        </div>
        <Button
          label="Generate Estimate"
          class="p-button-outlined"
          @click="startGenerateInvoice(true)"
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
