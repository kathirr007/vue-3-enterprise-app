<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type {
  DeleteUnscheduledProject,
  Project,
  ProjectScheduleType,
  UnPlannedProject,
  UnScheduledProjectEntity,
  UpdateTitle
} from '@/types/project.type';
import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import type { APIActions } from '@/types/common.type';
import StarRating from 'vue-star-rating';

const props = withDefaults(
  defineProps<{
    status?: string;
    isUnplanned?: boolean;
    clientId?: string;
    unPlannedClientId?: string;
    userId?: string;
    hideFilters?: boolean;
    disabledFilters?: string[];
  }>(),
  {
    disabledFilters: () => [],
    hideFilters: false
  }
);

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'selectedAction', data: Project[]): void;
  (e: 'update-title-desc', data: UpdateTitle): void;
}>();

dayjs.extend(minMax);

interface ProjectClient {
  name: string;
  clientId: string;
  unScheduledProjectId: string;
  projectManagerId: string;
}

const disabledTooltip = inject('disabledTooltip', '');
const canDoActions = inject('canDoActions', true);

const {
  clientId: clientIdProp,
  userId: userIdProp,
  status: statusProp,
  unPlannedClientId: unPlannedClientIdProp,
  isUnplanned: isUnplannedProp
} = toRefs(props);
const { isLarge, defaultBreakpoints } = useCommonBreakPoints();
const { titleCase, dateToHumanShort, pluralize } = useVueFilters();
const queryClient = useQueryClient();
const { getList } = useUnplannedProjects();
const { handleTooltip } = useTooltip();
const { initToast } = useToasts();
const route = useRoute();
const router = useRouter();
const { filters, searchText: staticSearchText } = useDatatableFilters();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  queryKeys,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  querySortBy,
  toggleFilters,
  tableRecords
} = useDataTableUtils();
const { canDo, canDoSome } = usePermissions();
const { getProgressBarColor, getProperValidationDate } = useUtilityFns();
const { getStatusName } = useProjectStatus();
const { ratingOptions } = useFeedback();

const appMenuControls = allMenuControls;

const unPlannedClientRemove = ref<UnScheduledProjectEntity[]>();
const selectedProject = ref<Project | undefined>();
const isDialogVisible = ref(false);
const clientsListDialog = ref(false);
const removeClientsDialog = ref(false);
const clientsListDialogHeader = ref('');
const projectClientsList = ref<ProjectClient[]>([]);
const isScheduling = ref(false);
const typeofSchedule = ref<ProjectScheduleType>('');
const serviceToSchedule = ref<UnPlannedProject | undefined>();
const projects = ref<Project[]>([]);
const isDelete = ref<boolean>(false);
const selectedProjects = ref<Project[]>([]);
const clientDisabledTooltip = ref(
  `${$tConfig('CLIENT')} is disabled, Please enable the ${$tConfig('CLIENT').toLowerCase()}.`
);
const { data: filterData, applyFilter } = useFilterColumns();
if (clientIdProp?.value) {
  applyFilter('Client', [clientIdProp?.value]);
}
const initialFilters = useEncodeFilterData(filterData);

const {
  isLoading: loadingProjects,
  isFetching: fetchingProjects,
  data: projectData
} = useQuery(
  ['project-list', statusProp, ...queryKeys],
  async () => {
    if (userIdProp?.value)
      return useUserSingleProject(userIdProp?.value);
    return useProjectListV2({
      status: statusProp?.value ? (statusProp?.value as string) : '',
      // clientId: clientIdProp?.value as string,
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters,
      sortBy: querySortBy.value
    });
  },
  {
    onSuccess: (data: any) => {
      projects.value = data.results ? data.results : data;
      tableRecords.value = data;
    },
    enabled: !!clientIdProp?.value || !!userIdProp?.value || true
  }
);

const { isLoading: loadingUnplannedProjects, data: unPlannedProjects }
  = useQuery(
    'unplanned-projects-list',
    () => {
      return getList(unPlannedClientIdProp?.value);
    },
    {
      enabled: isUnplannedProp,
      onSuccess: (data) => {
        if (route.query.serviceToSchedule && route.query.scheduleType) {
          isScheduling.value = true;
          typeofSchedule.value = route.query.scheduleType as ProjectScheduleType;
          const isFederal = route.query.isFederal;
          const serviceId = route.query.serviceToSchedule;
          const stateId = route.query.stateId;
          const interval = route.query.interval;
          serviceToSchedule.value = data.find((project: UnPlannedProject) => {
            if (isFederal === 'true') {
              return (
                project.isFederal
                && project.serviceId === serviceId
                && project.accountingPeriod === interval
              );
            }
            else {
              return (
                project.serviceId === route.query.serviceToSchedule
                && project.stateId === stateId
                && project.accountingPeriod === interval
              );
            }
          });
          updateTitleDesc({
            step: clientIdProp?.value
              ? 'update project details'
              : 'select clients',
            typeofSchedule: typeofSchedule.value,
            serviceToSchedule: serviceToSchedule.value
          });
        }
      }
    }
  );

function showToast(type: APIActions) {
  initToast({
    actionType: type,
    title: 'Project',
    actionObj: { ...selectedProject.value }
  });
}

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

function setProjectClientList(data: UnPlannedProject & { [key: string]: unknown },
  clientsField = '',
  typeofProject = '') {
  clientsListDialog.value = true;
  clientsListDialogHeader.value = `${typeofProject} Project ${pluralize($tConfig('CLIENT'))} for ${data.service}`;
  projectClientsList.value = data[`${clientsField}`] as ProjectClient[];
}

function prepareForSchedule(data: UnPlannedProject,
  scheduleType: 'Schedule' | 'Extend') {
  isScheduling.value = true;
  typeofSchedule.value = `${scheduleType}`;
  serviceToSchedule.value = data;
  router.push({
    query: {
      ...route.query,
      scheduleType,
      serviceToSchedule: data.serviceId,
      isFederal: data.isFederal,
      stateId: data.stateId ? data.stateId : undefined,
      interval: data.accountingPeriod
    }
  });
}

function handleBack() {
  isScheduling.value = false;
  queryClient.invalidateQueries('unplanned-projects-list');
  emit('back');
}

function updateTitleDesc(data: UpdateTitle) {
  emit('update-title-desc', data);
}

function completedEntitiesInPercent(data: Project) {
  const completedEntities = data._count?.entities;
  const totalEntities = data.entities?.length;
  if (totalEntities === 0)
    return 0;
  return Math.round((completedEntities / totalEntities) * 100);
}

function prepareForProjectAction(data: Project) {
  selectedProject.value = data;
  isDialogVisible.value = true;
}

function projectActions() {
  if (statusProp?.value === 'Archived') {
    restoreServiceFunc(selectedProject.value?.id as string);
  }
  if (statusProp?.value === 'Scheduled') {
    archiveServiceFunc(selectedProject.value?.id as string);
  }
}

onMounted(() => {
  if (route.query.serviceToSchedule) {
    isScheduling.value = true;
    /* serviceToSchedule.value = unPlannedProjects.value?.find(
      (project: Project) => project.serviceId === route.query.serviceToSchedule
    ); */
  }
});
const bulkActionLabel = computed(() => {
  if (
    selectedProjects.value.length === 0
    || selectedProjects.value.length === 1
  ) {
    return `Action (${selectedProjects.value.length})`;
  }
  else {
    return `Action (${selectedProjects.value.length})`;
  }
});

function handleUnScheduleProject(data: UnPlannedProject) {
  if (data) {
    if (route.name !== 'admin-clients-id') {
      isDelete.value = true;
    }
    if (route.name === 'admin-clients-id') {
      removeClientsDialog.value = true;
    }
    unPlannedClientRemove.value = data.projectMeta.filter(
      (el: any) => el.projectId === null || el.isExtended === true
    ) as unknown as UnScheduledProjectEntity[];
    return unPlannedClientRemove.value;
  }
}

const { removeUnscheduledProject } = useUnplannedProjects();
const { mutateAsync: deleteUnSchedule, isLoading: isRemoveClientLoading }
  = useMutation(
    'delete-unscheduled-project',
    async (payload: DeleteUnscheduledProject) => {
      return removeUnscheduledProject(payload);
    },
    {
      onSuccess() {
        isDelete.value = false;
        handleSuccess();
      }
    }
  );

function handleSuccess() {
  initToast({
    actionType: 'Remove',
    summary: `Remove ${$tConfig('CLIENT')}`,
    detail: `${$tConfig('CLIENT')}(s) Removed Successfully`
  });
  queryClient.invalidateQueries('unplanned-projects-list');
}

function handleUnscheduledRemoveAction(payload: string[]) {
  deleteUnSchedule({
    unScheduledProjectIds: payload
  } as DeleteUnscheduledProject);
}

function isClientNullOrActive(data: Project) {
  if (data.client === null)
    return true;
  if (data.client && data.client.isActive)
    return true;
}
function handleSelect(e: any) {
  if (e.checked) {
    selectedProjects.value = [...selectedProjects.value, e];
  }
  else {
    selectedProjects.value = selectedProjects.value.filter(
      (project: Project) => project.id !== e.id
    );
  }
}

const selectAll = computed({
  get() {
    return (
      !disableArchivedSelectAll.value
      && selectedProjects.value.length
      === projects.value.filter((project) => {
        if (!project.client || project.client?.isActive) {
          return true;
        }
        else return false;
      }).length
    );
  },
  set(val) {
    if (val) {
      selectedProjects.value = projects.value.filter((project) => {
        if (!project.client || project.client?.isActive) {
          project.checked = true;
          return true;
        }
        else return false;
      });
    }
    else {
      projects.value.forEach((project) => {
        project.checked = false;
      });
      selectedProjects.value = [];
    }
  }
});

const disableArchivedSelectAll = computed(() => {
  return projects.value.every(project => project.client?.isActive === false);
});

const dateValidationForBulkAction = computed(() => {
  const dueDatesArr = selectedProjects.value?.map(project =>
    dayjs(project.dueDate as string)
  );
  const startDatesArr = selectedProjects.value?.map(project =>
    dayjs(project.startDate as string)
  );
  const minDueDate = dayjs.min(dueDatesArr)?.toDate();
  const maxStartDate = dayjs
    .max(dayjs(dayjs.max(startDatesArr)), dayjs())
    ?.toDate();
  return {
    minDueDate,
    maxStartDate
  };
});

function handleBulkUpdate() {
  selectedProjects.value = [];
  queryClient.invalidateQueries('project-list');
}

watchEffect(() => {
  if (selectedProjects.value) {
    emit('selectedAction', selectedProjects.value);
  }
});
</script>

<template>
  <!-- <transition name="slide-down" mode="out-in"> -->
  <template v-if="isScheduling">
    <ProjectSchedule
      v-if="
        !loadingUnplannedProjects
          && serviceToSchedule !== undefined
          && typeofSchedule !== undefined
      "
      :service-to-schedule="serviceToSchedule"
      :typeof-schedule="typeofSchedule"
      @back="handleBack"
      @update-title-desc="updateTitleDesc"
    />
  </template>
  <template v-else>
    <DataTable
      v-if="isUnplanned"
      v-model:filters="filters"
      :value="unPlannedProjects"
      :loading="loadingUnplannedProjects"
      responsive-layout="scroll"
      breakpoint="768px"
      :global-filter-fields="['service']"
      :paginator="true"
      :rows="15"
      :always-show-paginator="false"
      :page-link-size="isLarge ? 5 : 3"
    >
      <template #header>
        <div class="flex justify-content-end">
          <div class="p-input-icon-left mr-auto">
            <i class="pi pi-search" />
            <InputText
              v-model="staticSearchText"
              placeholder="Search Projects"
              type="search"
            />
          </div>
        </div>
      </template>
      <template #empty>
        <div class="text-center">
          No project record found.
        </div>
      </template>
      <Column field="service" header="Project Template" sortable />
      <Column field="state" class="text-center" header="State/Federal" sortable>
        <template #body="{ data }">
          <div class="w-full text-center">
            {{ data.isFederal ? 'Federal' : data.state ? data.state : '-' }}
          </div>
        </template>
      </Column>
      <Column field="accountingPeriod" class="text-center" header="Frequency" />
      <Column
        field="estimatedTime"
        class="text-center"
        header-class="estimated-time"
      >
        <template #header>
          <div class="w-full text-center">
            <i
              v-tooltip.top="'Budget Time in Hr'"
              class="pi pi-clock text-xl"
            />
          </div>
        </template>
      </Column>
      <Column
        v-if="!unPlannedClientId"
        field="unscheduledClients"
        header="Unscheduled Projects"
      >
        <template #body="{ data }">
          <div
            class="font-medium cursor-pointer text-gray-900 hover:text-gray-600"
            @click="
              setProjectClientList(data, 'unscheduledClients', 'Unscheduled')
            "
          >
            {{ data.unscheduledClients.length }} {{ `${$tConfig('CLIENT').toLowerCase()}` }}(s)
          </div>
        </template>
      </Column>
      <Column
        v-if="!unPlannedClientId"
        field="scheduledClients"
        header="Scheduled Projects"
      >
        <template #body="{ data }">
          <div
            class="font-medium cursor-pointer text-gray-900 hover:text-gray-600"
            @click="setProjectClientList(data, 'scheduledClients', 'Scheduled')"
          >
            {{ data.scheduledClients.length }} {{ `${$tConfig('CLIENT').toLowerCase()}` }}(s)
          </div>
        </template>
      </Column>
      <Column
        v-if="!unPlannedClientId"
        field="extendedClients"
        header="Extended Projects"
      >
        <template #body="{ data }">
          <div
            class="font-medium cursor-pointer text-gray-900 hover:text-gray-600"
            @click="setProjectClientList(data, 'extendedClients', 'Extended')"
          >
            {{ data.extendedClients.length }} {{ `${$tConfig('CLIENT').toLowerCase()}` }}(s)
          </div>
        </template>
      </Column>
      <Column
        field="dueDateRange"
        :header="`Due Date ${!unPlannedClientId ? 'Range' : ''}`"
      />
      <Column
        v-if="canDoSome('unscheduled_projects', ['edit', 'delete'])"
        header="Actions"
        class="w-2"
      >
        <template #body="{ data }">
          <div class="flex">
            <span
              v-if="canDo('unscheduled_projects', 'edit')"
              v-tooltip.top="
                handleTooltip(
                  !!canDoActions,
                  'Schedule',
                  disabledTooltip as string,
                )
              "
              class="inline-block"
              style=" width: 2.357rem;height: 2.357rem;"
            >
              <Button
                icon="pi pi-calendar"
                class="p-button-sm p-button-rounded"
                :disabled="
                  ((clientId || unPlannedClientId) && !canDoActions)
                    || data.unscheduledClients.length
                      + data.extendedClients.length
                      === 0
                "
                @click="prepareForSchedule(data, 'Schedule')"
              />
            </span>
            <span
              v-if="canDo('unscheduled_projects', 'edit')"
              v-tooltip.top="
                handleTooltip(
                  !!canDoActions,
                  'Extend',
                  disabledTooltip as string,
                )
              "
              class="ml-2"
              style=" width: 2.357rem;height: 2.357rem;"
            >
              <Button
                icon="pi pi-calendar-plus"
                class="p-button-sm p-button-rounded"
                :disabled="
                  ((clientId || unPlannedClientId) && !canDoActions)
                    || data.unscheduledClients.length
                      + data.extendedClients.length
                      === 0
                "
                @click="prepareForSchedule(data, 'Extend')"
              />
            </span>
            <Button
              v-if="canDo('unscheduled_projects', 'delete')"
              v-tooltip.top="'Delete'"
              icon="pi pi-trash"
              class="p-button-sm p-button-rounded p-button-danger ml-2"
              :disabled="
                ((clientId || unPlannedClientId) && !canDoActions)
                  || data.unscheduledClients.length + data.extendedClients.length
                    === 0
              "
              @click="handleUnScheduleProject(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
    <DataTable
      v-else
      v-model:filters="filters"
      v-bind="{ ...tableAttrs, lazy: !userIdProp }"
      v-model:selection="selectedProjects"
      :value="projects"
      :total-records="projectData?.total || projects?.length"
      :loading="loadingProjects || fetchingProjects"
      responsive-layout="scroll"
      breakpoint="768px"
      :global-filter-fields="['name']"
      @page="!userIdProp && handlePageOrLimitChange($event)"
      @sort="!userIdProp && handleSortChange($event)"
    >
      <template #header>
        <div class="flex justify-content-end">
          <div v-if="userIdProp" class="p-input-icon-left mr-auto">
            <i class="pi pi-search" />
            <InputText
              v-model="staticSearchText"
              aria-label="Search List"
              :placeholder="`Search ${pluralize($tConfig('CLIENT'))}`"
              type="search"
            />
          </div>
          <CommonListSearchInput
            v-else
            v-bind="{
              listProps: props,
              placeholder: 'Search Projects',
              lazy: !!userIdProp,
            }"
          />

          <div>
            <ProjectBulkAction
              v-if="
                status !== 'Archived'
                  && selectedProjects
                  && selectedProjects.length > 0
              "
              :label="bulkActionLabel"
              :projects="selectedProjects"
              :due-date="dateValidationForBulkAction.minDueDate"
              :start-date="dateValidationForBulkAction.maxStartDate"
              @success="selectedProjects = []"
            />
            <span
              v-if="
                !!selectedProjects.length
                  && status === 'Archived'
                  && canDo('projects', 'create')
              "
              v-tooltip.top="`Restore all the selected projects`"
              class="inline-block mr-2"
              style=" width: 2.357rem;height: 2.357rem;"
            >
              <!-- <Button
                icon="pi pi-undo"
                class="p-button-sm p-button-rounded"
                @click="restoreBulkProjects"
              /> -->
              <ProjectBulkRestoreProjects
                :projects="selectedProjects"
                @bulk-update="handleBulkUpdate"
              />
            </span>
            <Button
              v-if="!hideFilters"
              type="button"
              :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
              class="p-button-icon-only p-button-rounded"
              :class="[{ 'p-button-danger': queryFilters }]"
              @click="toggleFilters(!!queryFilters)"
            />
          </div>
        </div>
        <div v-if="isFiltersVisible && !hideFilters" class="my-2">
          <ProjectFilter
            ref="filtersRef"
            :filters="queryFilters"
            :disabled-filters="disabledFilters"
            :client-id="clientId"
          />
        </div>
      </template>
      <template #empty>
        <div class="text-center">
          No project record found.
        </div>
      </template>
      <Column
        v-if="statusProp !== 'Completed' && canDo('projects', 'edit')"
        header-style="width: 3rem"
        :selection-mode="status !== 'Archived' ? 'multiple' : undefined"
      >
        <template v-if="status === 'Archived'" #header>
          <Checkbox
            v-model="selectAll"
            input-id="select-all"
            :binary="true"
            :disabled="disableArchivedSelectAll"
          />
        </template>
        <template v-if="status === 'Archived'" #body="{ data }">
          <Checkbox
            v-model="data.checked"
            input-id="select-one"
            :binary="true"
            :disabled="data.client?.isActive === false"
            @change="handleSelect(data)"
          />
        </template>
      </Column>
      <Column field="name" header="Title" class="w-3">
        <template #body="{ data }">
          <router-link
            :to="{ name: 'admin-projects-id', params: { id: data.id } }"
            class="flex align-items-center font-medium text-gray-900"
            :class="
              canDo('projects', 'single')
                ? 'cursor-pointer hover:text-gray-600'
                : 'pointer-events-none'
            "
          >
            <span class="user-name">{{ data.name }}</span>
          </router-link>
        </template>
      </Column>
      <Column field="projectManager" header="Progress" class="w-2 pr-6">
        <template #body="{ data }: { data: Project }">
          <p class="mb-1">
            <span class="font-medium text-900">{{
              `${completedEntitiesInPercent(data)}%`
            }}</span>
            <span class="text-sm text-600">{{
              ` (${data._count.entities}/${data.entities.length})`
            }}</span>
          </p>

          <ProgressBar
            :value="completedEntitiesInPercent(data)"
            :show-value="true"
            :style="{ height: '10px' }"
          >
            <div
              class="w-full h-full"
              :class="`bg-${getProgressBarColor(
                completedEntitiesInPercent(data),
              )}`"
            />
          </ProgressBar>
        </template>
      </Column>
      <Column header="Rating" field="rating" class="text-center">
        <template #body="{ data }">
          <!-- <Rating
            v-if="data.feedback"
            :model-value="(data.feedback.rating || 0)" class="text-primary" :pt="ratingPassthroughOptions" :cancel="false" readonly
          />
          <Rating
            v-else
            :model-value="0" class="text-primary" :pt="ratingPassthroughOptions" :cancel="false" readonly
          /> -->
          <StarRating
            class="justify-content-center" :rating="(data.feedback?.rating || 0)" v-bind="{ ...ratingOptions }"
          />
        </template>
      </Column>
      <Column header="Stage">
        <template #body="{ data }: { data: Project }">
          {{ data.pipelineStage?.name || 'NA' }}
        </template>
      </Column>

      <Column field="client" :header="`${$tConfig('CLIENT')}`">
        <template #body="{ data }">
          {{ data.client?.name || 'NA' }}
        </template>
      </Column>
      <Column field="startDate" header="Start Date" sortable>
        <template #body="{ data }">
          {{ dateToHumanShort(data.startDate) }}
        </template>
      </Column>
      <Column field="dueDate" header="Due Date" sortable>
        <template #body="{ data }">
          {{ dateToHumanShort(data.dueDate) }}
        </template>
      </Column>
      <Column
        v-if="status === 'Scheduled' && canDo('projects', 'delete')"
        header="Actions"
      >
        <template #body="{ data }">
          <span
            v-if="status === 'Scheduled' && canDo('projects', 'delete')"
            v-tooltip.top="
              handleTooltip(
                !!canDoActions,
                'Archive',
                disabledTooltip as string,
              )
            "
            class="inline-block ml-2"
            style=" width: 2.357rem;height: 2.357rem;"
          >
            <Button
              :disabled="!canDoActions || selectedProjects.includes(data)"
              class="p-button-sm p-button-rounded p-button-icon-only bg-orange-500 border-orange-500 hover:bg-orange-400 hover:border-orange-400"
              @click="prepareForProjectAction(data)"
            >
              <div class="flex-none">
                <Icon icon="fa6-solid:box-archive" class="text-lg" />
              </div>
            </Button>
          </span>
        </template>
      </Column>
      <Column
        v-if="status === 'Archived' && canDo('projects', 'create')"
        header="Actions"
      >
        <template #body="{ data }">
          <span
            v-if="status === 'Archived' && canDo('projects', 'create')"
            v-tooltip.top="
              handleTooltip(
                !!canDoActions && !!isClientNullOrActive(data),
                'Restore',
                `${
                  isClientNullOrActive(data)
                    ? disabledTooltip
                    : clientDisabledTooltip
                }`,
              )
            "
            class="inline-block"
            style=" width: 2.357rem;height: 2.357rem;"
          >
            <Button
              :disabled="
                !canDoActions
                  || !isClientNullOrActive(data)
                  || selectedProjects.includes(data)
              "
              icon="pi pi-undo"
              class="p-button-sm p-button-rounded"
              @click="prepareForProjectAction(data)"
            />
          </span>
        </template>
      </Column>
    </DataTable>
  </template>
  <!-- </transition> -->
  <Dialog
    v-model:visible="clientsListDialog"
    :modal="true"
    append-to="body"
    :header="clientsListDialogHeader"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
  >
    <ol
      v-if="projectClientsList.length"
      class="project-clients-list pl-3 grid p-0 m-0 formgrid"
    >
      <li
        v-for="(item, index) in projectClientsList"
        :key="index"
        class="col md:col-6 py-2"
      >
        <router-link
          :to="{ name: 'admin-clients-id', params: { id: item.clientId } }"
          class="flex align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
        >
          {{ item.name }}
        </router-link>
      </li>
    </ol>
    <template v-else>
      No {{ `${$tConfig('CLIENT').toLowerCase()}` }} found.
    </template>
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="isDialogVisible"
    :visible="isDialogVisible"
    :record-to-remove="selectedProject as Record<string, any>"
    :title="`Confirm ${status === 'Archived' ? 'Restore' : 'Archive'} Project`"
    @confirm="projectActions"
    @hide="isDialogVisible = false"
  >
    <div>
      <div>
        <strong>{{ selectedProject?.name }}</strong> will be
        {{ status === 'Archived' ? 'restored' : 'archived' }}.
      </div>
      <div v-if="status !== 'Archived'">
        {{ `Archiving a project will make it's associated tasks inactive.` }}
      </div>
      Are you sure you want to
      {{ status === 'Archived' ? 'restore' : 'archive' }}
      <strong>{{ selectedProject?.name }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
  <Dialog
    v-model:visible="isDelete"
    content-class="border-round-bottom-md"
    :modal="true"
    append-to="body"
    :header="`Select ${$tConfig('CLIENT')}(s)`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
  >
    <ProjectRemoveUnSchedule
      :un-planned-client="(unPlannedClientRemove as unknown as UnPlannedProject[])"
      :loading="isRemoveClientLoading"
      @cancel="isDelete = false"
      @submit="handleUnscheduledRemoveAction"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="removeClientsDialog"
    :visible="removeClientsDialog"
    title="Confirm Delete"
    @confirm="
      handleUnscheduledRemoveAction([
        (unPlannedClientRemove as UnScheduledProjectEntity[])[0]
          .unScheduledProjectId,
      ] as string[])
    "
    @hide="removeClientsDialog = false"
  >
    <div>Would you like to delete the selected unscheduled project?</div>
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped>
:deep(.estimated-time) {
  color: red;
}

:deep(.p-progressbar) {
  .p-progressbar-label {
    width: 100%;
    height: 100%;
  }
}

:deep(.p-datatable-wrapper) {
  .p-datatable-tbody > tr.p-highlight {
    color: #69707a;
    background-color: #eff6ff !important;
  }
}
</style>
