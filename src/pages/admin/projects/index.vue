<script setup lang="ts">
import type {
  Project,
  ProjectStatus,
  UpdateTitle
} from '@/types/project.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import TabView from 'primevue/tabview';
import type { APIActions } from '@/types/common.type';
import dayjs from 'dayjs';
import type { Card } from '@/types/dashboard.type';
import { useRouteQuery } from '@vueuse/router';
import type { OrderedPipelineStages } from '@/types/service.type';

const isProjectCreate = ref(false);
const isHelpVideoOpen = ref(false);
const isProjectDialog = ref(false);
const isProjectTemplate = ref(false);
const isSelectedProjectDialogVisible = ref(false);
const dialogHeader = ref('Create Project');
const currentStepDetails = ref<UpdateTitle>();
const getSelectedProjects = ref<Project[]>([]);
const mode = ref(useProjectViewMode('kanban'));
const selectedTemplate = ref<string>();
const selectedStages = ref<OrderedPipelineStages[]>();
const isServiceSelected = useRouteQuery('isServiceSelected');

const router = useRouter();
const route = useRoute();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const { isFalsy } = useUtilityFns();
const { getAllStatuses } = useProjectStatus();
const { filtersRef, isFiltersVisible, queryFilters, queryKeys, toggleFilters }
  = useDataTableUtils();
const { isPortalUser } = useCurrentUserData();

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

const { data: projectTemplates } = useQuery(
  ['project-templates'],
  () => {
    return useServiceListV2({});
  },
  {
    onSuccess(data) {
      if (
        mode.value === 'kanban'
        && data
        && data.results.length > 0
        && !isServiceSelected.value
        && activeTabIndex.value === 0
      ) {
        const firstTemplateId = data.results[0].id;
        addInitialServiceFilter(firstTemplateId);
      }
    }
  }
);

watch(
  () => mode.value,
  () => {
    if (mode.value === 'list') {
      router.push({ query: { activeIndex: 0 } });
    }
    else {
      const firstTemplateId = projectTemplates.value?.results.length
        ? projectTemplates.value?.results[0].id
        : undefined;
      if (
        firstTemplateId
        && !isServiceSelected.value
        && activeTabIndex.value === 0
      ) {
        addInitialServiceFilter(firstTemplateId);
      }
    }
  }
);

function addInitialServiceFilter(value: string) {
  const { applyFilter: applyInitialFilter, data: filteredData }
    = useFilterColumns();
  applyInitialFilter('Service', [value]);
  const filters = useEncodeFilterData(filteredData);
  router.push({
    query: { filters, isServiceSelected: 'true' }
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

function showToast(type: APIActions) {
  initToast({
    actionType: type,
    title: 'Project',
    actionObj: { ...getSelectedProjects.value }
  });
}
const { activeTabIndex, tabRef, handleTabChange, activeTab }
  = useSteps('admin-projects');
const { canDo, featureSubscribed } = usePermissions();

const filterIndex = ref(0);
const cards = ref<Card[]>([
  {
    id: 'activeProjectFilter',
    title: 'Active Projects',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'scheduledForPresentWeek',
    title: 'Projects Scheduled for this Week',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'tasksDueNextWeekFilter',
    title: 'Projects Scheduled for Next Week',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    clickable: true
  },
  {
    id: 'overDueTasksFilter',
    title: 'Projects Overdue',
    value: '',
    color: '',
    clickable: true
  }
]);
const activeProjectStatus = ref();
const scheduledProjectStatus = ref();
const encodedFilters = ref<{ name: string; value: string }[]>([]);

const {
  applyFilter,
  applyDynamicFilter,
  data: filterData
} = useFilterColumns();

const { data: projectStatuses } = useQuery(
  ['project-statuses', ...queryKeys],
  () => {
    return getAllStatuses();
  },
  {
    onSuccess: (data: ProjectStatus[]) => {
      if (data) {
        activeProjectStatus.value = data.find(
          (status: ProjectStatus) => status.name === 'Active'
        );
        scheduledProjectStatus.value = data.find(
          (status: ProjectStatus) => status.name === 'Scheduled'
        );
        const activeProjectFilter = () => {
          applyDynamicFilter('Project Status', 'statusId', [
            activeProjectStatus.value?.id
          ]);
          applyDynamicFilter('LessThan Date', 'startDate', [dayjs().toDate()]);
          if (selectedTemplate.value)
            applyFilter('Service', [selectedTemplate.value]);
          return useEncodeFilterData(filterData);
        };
        encodedFilters.value.push({
          name: 'activeProjectFilter',
          value: activeProjectFilter()
        });

        applyFilter('LessThan Date', undefined);
        // applyFilter('Project Status', undefined);
        const scheduledForPresentWeek = () => {
          applyDynamicFilter('Project Status', 'statusId', [
            scheduledProjectStatus.value?.id
          ]);
          applyFilter('Start Date', [
            dayjs().toDate(),
            dayjs().endOf('week').toDate()
          ]);
          if (selectedTemplate.value)
            applyFilter('Service', [selectedTemplate.value]);
          return useEncodeFilterData(filterData);
        };
        encodedFilters.value.push({
          name: 'scheduledForPresentWeek',
          value: scheduledForPresentWeek()
        });

        const scheduledForNextWeekFilter = () => {
          applyDynamicFilter('Project Status', 'statusId', [
            scheduledProjectStatus.value?.id
          ]);
          applyFilter('Start Date', [
            dayjs().startOf('week').add(1, 'week').toDate(),
            dayjs().endOf('week').add(1, 'week').toDate()
          ]);
          if (selectedTemplate.value)
            applyFilter('Service', [selectedTemplate.value]);
          return useEncodeFilterData(filterData);
        };

        encodedFilters.value.push({
          name: 'scheduledForNextWeekFilter',
          value: scheduledForNextWeekFilter()
        });

        applyFilter('Start Date', undefined);

        const overDueProjectsFilter = () => {
          applyDynamicFilter('Project Status', 'statusId', [
            scheduledProjectStatus.value?.id,
            activeProjectStatus.value?.id
          ]);
          applyDynamicFilter('LessThan Date', 'dueDate', [dayjs().toDate()]);
          if (selectedTemplate.value)
            applyFilter('Service', [selectedTemplate.value]);
          return useEncodeFilterData(filterData);
        };
        encodedFilters.value.push({
          name: 'overDueProjectsFilter',
          value: overDueProjectsFilter()
        });
      }
    }
  }
);

const canFetchTilesData = computed(() => {
  if (projectStatuses.value) {
    return (
      !isFalsy(activeProjectStatus.value)
      && !isFalsy(scheduledProjectStatus.value)
    );
  }
  return false;
});

const { isFetching } = useQuery(
  ['projects-list-card-data', filterIndex],
  () => {
    return useProjectListV2({
      filters: encodedFilters.value[filterIndex.value].value,
      isAdhoc:
        !selectedTemplate.value
        && activeTabIndex.value === 0
        && mode.value === 'kanban'
    });
  },
  {
    enabled: canFetchTilesData,
    onSuccess: (value) => {
      cards.value[filterIndex.value].value = value?.total?.toString() || '0';
      cards.value[filterIndex.value].filterString
        = encodedFilters.value[filterIndex.value].value;
      if (filterIndex.value < encodedFilters.value.length - 1) {
        filterIndex.value++;
      }
    }
  }
);

const { defaultBreakpoints } = useCommonBreakPoints();

const activeStatus = computed(() => {
  return activeTab.value === 'Archived' ? 'Restore' : 'Archive';
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

const { mutateAsync: archiveServiceFunc } = useMutation(
  (id: string) => useProjectArchive(id),
  {
    onSuccess: () => {
      showToast('Archive');
      queryClient.invalidateQueries('project-list');
    }
  }
);
const { mutateAsync: restoreServiceFunc } = useMutation(
  (id: string) => useProjectRestore(id),
  {
    onSuccess: () => {
      showToast('Restore');
      queryClient.invalidateQueries('project-list');
    }
  }
);

function prepareForSelectedProject() {
  isSelectedProjectDialogVisible.value = true;
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

function updateTitleDesc(data: UpdateTitle) {
  currentStepDetails.value = data;
}
function handleScheduleBack() {
  currentStepDetails.value = undefined;
  router.push({ name: 'admin-projects', query: { activeIndex: 1 } });
}
function handleProjectAction(data: Project[]) {
  getSelectedProjects.value = data;
}
function projectActions() {
  archiveServiceFunc(
    getSelectedProjects?.value?.map((id: Project) => id.id).toString() as string
  );
}
function handleCardClick(data: Card) {
  router.push({
    name: 'admin-projects',
    query: { filters: data.filterString as string, isServiceSelected: 'true' }
  });
}
const isOverDue = computed(() => {
  const result = cards.value.find(val => val.id === 'overDueTasksFilter');
  if ((result?.value as any) === 0) {
    return 'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400';
  }
  else {
    return 'text-3xl text-red-500 bg-white hover:text-white hover:bg-red-500 transition-all transition-duration-400';
  }
});
const cardData = computed(() => {
  return cards.value
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
        case 'overDueTasksFilter':
          return {
            ...e,
            value: e.value,
            color: `${isOverDue.value}`
          };

        default: {
          return { ...e };
        }
      }
    })
    .filter(e => e) as Card[];
});

function handleTemplateProjectSelection(projectTemplate: any) {
  if (projectTemplate.value === null) {
    toggleFilters(!!queryFilters.value);
  }
}

onMounted(() => {
  useLayoutContentClass().contentClass.value = 'relative';
});

onBeforeUnmount(() => {
  useLayoutContentClass().contentClass.value = '';
});

watch(
  () => queryFilters,
  (val) => {
    if (val) {
      const decodedFilters = useDecodeFilterData(val.value as string);
      const columns = Object.keys(decodedFilters);
      if (columns.includes('Service')) {
        const serviceId = decodedFilters.Service.value[0];
        if (serviceId)
          selectedTemplate.value = serviceId;
      }
    }
  }
);

onMounted(() => {
  if (queryFilters.value) {
    const decodedFilters = useDecodeFilterData(queryFilters.value as string);
    const columns = Object.keys(decodedFilters);
    if (columns.includes('Service')) {
      const serviceId = decodedFilters.Service.value[0];
      selectedTemplate.value = serviceId;
    }
  }
});
</script>

<template>
  <div v-if="featureSubscribed('work', 'project') === false" class="card">
    <Common426 feature="projects" />
  </div>
  <div v-else>
    <div v-if="canDo('projects', 'list')" class="mb-4">
      <WidgetCards
        :cards="cardData"
        :loading="isFetching"
        :cards-in-row="4"
        is-card-small
        @card-click="handleCardClick"
      />
    </div>
    <div class="card p-0" :class="{ 'pb-0': mode === 'list' }">
      <TabView
        ref="tabRef"
        key="list-view"
        v-model:activeIndex="activeTabIndex"
        lazy
        class="-mx-3"
        @tab-change="handleTabChange"
        @tab-click="handleTabChange"
      >
        <TabPanel header="Scheduled">
          <CommonPage
            content-class="pb-0"
            actions-classes="flex justify-content-end align-items-center"
          >
            <template #title>
              <h1
                v-if="isProjectCreate || isProjectTemplate || mode === 'list'"
                class="font-medium text-3xl text-primary mb-0"
              >
                {{
                  isProjectCreate || isProjectTemplate
                    ? 'Create Project'
                    : 'Active & Scheduled Projects'
                }}
              </h1>
              <span v-else-if="mode === 'kanban'">
                <Dropdown
                  v-if="!selectedTemplate"
                  v-model="selectedTemplate"
                  :options="templateOptions || []"
                  option-label="label"
                  option-value="value"
                  placeholder="Select Project Template"
                  show-clear
                  class="bg-primary text-white project-template-select"
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
                      mode === 'kanban'
                        ? ['Project Stage', 'Service']
                        : undefined
                    "
                  />
                </div>
              </span>
              <h1 v-else class="font-medium text-3xl text-primary mb-0">
                Scheduled Projects
              </h1>
            </template>
            <template
              v-if="!(isProjectCreate || isProjectTemplate)"
              #actions
            >
              <CommonListSearchInput
                v-if="mode === 'kanban'"
                v-bind="{
                  placeholder: 'Search Projects',
                }"
                :auto-right-margin="false"
                :list-props="{
                  query: {
                    isServiceSelected: 'true',
                  },
                }"
              />
              <span
                v-tooltip.left="`${projectResource.limit && (projectResource.usage >= projectResource.limit) ? `Can't create more than available limit ${projectResource.limit}` : projectResource.limit && (projectResource.usage >= projectResource.limit) ? `Available limit of ${projectResource.limit} projects already created` : 'Create Project'}`"
              >
                <Button
                  v-if="canDo('projects', 'create')
                    && !(isProjectCreate || isProjectTemplate)
                  "
                  icon="pi pi-plus"
                  class="p-button-rounded flex-shrink-0 ml-2"
                  :disabled="(projectResource.limit && (projectResource.usage >= projectResource.limit))"
                  @click="isProjectDialog = true"
                />
              </span>
              <div
                class="inline-flex justify-content-end align-items-center ml-2"
                :class="[
                  { 'mb-3': mode !== 'list' },
                  { 'mb-4': isFiltersVisible && mode !== 'list' },
                ]"
              >
                <Button
                  v-if="mode === 'kanban'"
                  type="button"
                  :icon="
                    !!route.query.filters
                      ? 'pi pi-filter-slash'
                      : 'pi pi-filter'
                  "
                  class="p-button-icon-only p-button-rounded mr-2 flex-shrink-0"
                  :class="[{ 'p-button-danger': !!route.query.filters }]"
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
                  class="cursor-pointer"
                  tabindex="0"
                  @click.prevent="mode = 'list'"
                  @keyup.enter.prevent="mode = 'list'"
                >
                  <svg
                    class="w-2rem h-2rem"
                    :class="
                      mode === 'kanban' ? 'text-primary' : 'text-gray-300'
                    "
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
                  class="cursor-pointer"
                  tabindex="0"
                  @click.prevent="mode = 'kanban'"
                  @keyup.enter.prevent="mode = 'kanban'"
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
            </template>
            <transition name="slide-up" mode="out-in">
              <div
                v-if="
                  isFiltersVisible
                    && mode !== 'list'
                    && !(isProjectCreate || isProjectTemplate)
                "
                class="-mt-3 mb-3"
              >
                <ProjectFilter
                  v-if="!selectedTemplate"
                  ref="filtersRef"
                  :filters="queryFilters"
                  :disabled-filters="
                    mode === 'kanban' ? ['Project Stage', 'Service'] : undefined
                  "
                />
                <div v-else class="flex gap-3 align-items-center">
                  <Dropdown
                    v-model="selectedTemplate"
                    :options="templateOptions || []"
                    option-label="label"
                    option-value="value"
                    placeholder="Select Project Template"
                    show-clear
                    class="project-template-select bg-primary text-white"
                    @change="handleTemplateProjectSelection"
                  />
                </div>
              </div>
            </transition>
            <div v-if="isProjectCreate || isProjectTemplate">
              <ProjectCreate
                :is-template="isProjectTemplate"
                @modal-close="closeCreateProject"
              />
            </div>
            <div v-else class="card">
              <transition-group key="toggle-view" name="slide-up">
                <div v-if="mode === 'list'" key="list-view">
                  <ProjectList
                    v-if="canDo('projects', 'list')"
                    @selected-action="handleProjectAction"
                  />
                  <p v-else class="text-center font-medium text-xl">
                    You don't have access of the Active & Scheduled projects
                    list.
                  </p>
                </div>
                <ProjectKanbanBoard
                  v-else
                  key="kanban-view"
                  :project-stages="selectedStages"
                  :service-id="selectedTemplate"
                  @stage-update="filterIndex = 0"
                />
              </transition-group>
            </div>
          </CommonPage>
        </TabPanel>
        <TabPanel v-if="canDo('unscheduled_projects', 'list')" header="Unscheduled">
          <CommonPage :title="unplannedPageHeader" content-class="pb-0">
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
                >Unplanned project will be extended to new due date for the
                selected client(s).</template
              >
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
            <template v-else
              >List of all the upcoming projects that are yet to be
              scheduled.</template
            >
          </transition>
        </template> -->
            <template #helpActions>
              <div class="w-full max-w-26rem ml-auto -mb-2">
                <a
                  aria-label="setup project template video"
                  class="font-medium flex justify-content-end align-items-center cursor-pointer"
                  @click="isHelpVideoOpen = true"
                ><i
                   class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
                 />
                  <span>Help</span></a>
              </div>
            </template>
            <div class="card">
              <ProjectList
                v-if="canDo('unscheduled_projects', 'list')"
                is-unplanned
                @update-title-desc="updateTitleDesc"
                @back="handleScheduleBack"
              />
              <p v-else class="text-center font-medium text-xl">
                You don't have access of the Un-Scheduled projects list.
              </p>
            </div>
          </CommonPage>
        </TabPanel>
        <TabPanel header="Archived">
          <CommonPage title="Archived Project" content-class="pb-0">
            <div class="card">
              <ProjectList
                v-if="canDo('projects', 'list')"
                status="Archived"
                :disabled-filters="['Project Status']"
                @selected-action="handleProjectAction"
              />
              <p v-else class="text-center font-medium text-xl">
                You don't have access of the Archived projects list.
              </p>
            </div>
          </CommonPage>
        </TabPanel>
      </TabView>
    </div>

    <CommonConfirmRemoveDialog
      v-if="isSelectedProjectDialogVisible"
      :visible="isSelectedProjectDialogVisible"
      :record-to-remove="getSelectedProjects as Record<string, any>"
      :title="`Confirm ${
        activeStatus === 'Archive' ? 'Archive Selected' : 'Restore Selected'
      } Project(s)`"
      @confirm="projectActions"
      @hide="isSelectedProjectDialogVisible = false"
    >
      <div>
        <div>
          <strong>{{
            getSelectedProjects
              ?.map((project: Project) => project.name)
              .toString()
          }}</strong>
          will be {{ activeStatus === 'Archive' ? 'archived' : 'restored' }}.
        </div>
        <div>
          {{ `Archiving a project will make it's associated tasks inactive.` }}
        </div>
        Are you sure you want to
        {{ activeStatus === 'Archive' ? 'archive' : 'restore' }}
        <strong>{{
          getSelectedProjects?.map((project: Project) => project.name).toString()
        }}</strong>?
      </div>
    </CommonConfirmRemoveDialog>
    <Dialog
      v-model:visible="isHelpVideoOpen"
      :modal="true"
      append-to="body"
      :breakpoints="defaultBreakpoints"
      :style="{ width: '75vw' }"
      content-class="border-round-bottom-md"
      header="Schedule / Extend Project"
      @hide="isHelpVideoOpen = false"
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
            Create Project using Template
            <p class="font-normal text-base mt-1">
              Streamline project initiation with ready-made templates for
              efficiency and consistency.
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
            Setup a Project Manually
            <p class="font-normal text-base mt-1">
              Create a project from the ground up manually, allowing for
              customized control and flexibility.
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
  </div>
</template>

<style lang="scss" scoped>
:deep(.p-tabview-panel) {
  header {
    padding-bottom: v-bind('unplannedHeaderStyles.padding') !important;
    border-bottom: v-bind('unplannedHeaderStyles.borderBottom') !important;

    & > div:first-child {
      @media (width >= 768px) {
        width: 75% !important;
      }
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
