<script setup lang="ts">
import { useQuery } from 'vue-query';
import type { User } from '@/types/teams.type';
import type { EntityType, Task } from '@/types/tasks.type';
import type { MaybeRef } from 'vue';

const { hasFeatureAccess } = useClientPortalAccess('portal', 'Client Portal');
const { getPortalDashboard } = useDashboardMatrix();
const { getAllPendingWebforms } = useWebforms();
const { getAllFeedbacks } = useFeedback();
const { currentUser, isPortalUser } = useCurrentUserData();
const { featureSubscribed } = usePermissions();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Client', [currentUser?.value?.client?.id]);

const initialFilters = useEncodeFilterData(filterData);
const { getCalendlyUrl } = useIntegrations();

const canFetchCalendlyUrl = ref(false);
const todoStatus = ref();

const { data: scheduledProjects, isLoading: loadingScheduledProjects }
  = useQuery('client-scheduled-projects', () =>
    getPortalDashboard('Scheduled', initialFilters)
  );
const { data: activeProjects, isLoading: loadingActiveProjects } = useQuery(
  'client-active-projects',
  () => getPortalDashboard('Active', initialFilters)
);

const {
  data: pendingRequests,
  isLoading: loadingPendingRequests,
  isFetching: fetchingPendingRequests
} = useQuery('pending-requests', () => {
  const { data: filterData, applyFilter } = useFilterColumns();
  applyFilter('Type', ['ORGANIZER']);
  const requestFilters = useEncodeFilterData(filterData);
  return getAllPendingWebforms({ filters: requestFilters });
});

const {
  data: pendingContracts,
  isLoading: loadingPendingContracts,
  isFetching: fetchingPendingContracts
} = useQuery('pending-contracts', () => {
  const { data: filterData, applyFilter } = useFilterColumns();
  applyFilter('Type', ['CONTRACT']);
  const contractFilters = useEncodeFilterData(filterData);
  return getAllPendingWebforms({ filters: contractFilters });
});

const {
  data: pendingFeedbacks,
  isLoading: loadingPendingFeedbacks,
  isFetching: fetchingPendingFeedbacks
} = useQuery('pending-feedbacks', () => {
  const { data: filterData, applyFilter } = useFilterColumns();
  applyFilter('FeedbackStatus', 'PENDING');
  const feedbackFilters = useEncodeFilterData(filterData);
  return getAllFeedbacks({ filters: feedbackFilters, isPortalUser: true });
});

const { data: userDetails } = useQuery<User>(
  'user-details',
  async () => {
    return useUserDetails(currentUser.value?.id, isPortalUser.value);
  },
  {
    onSuccess: (data: User) => {
      if (data) {
        canFetchCalendlyUrl.value = true;
      }
    }
  }
);
const { data: calendlyData, isFetching } = useQuery(
  ['calendly-url'],
  async () => {
    const data = await getCalendlyUrl(
      userDetails.value?.userClients[0]?.client?.relationshipManager
        ?.id as string,
      isPortalUser.value
    );
    return data;
  },
  {
    enabled: canFetchCalendlyUrl
  }
);

const { data: statusList } = useQuery(
  ['status-list'],
  () => {
    return useEntityStatusList('CLIENTTASK' as EntityType, isPortalUser.value);
  },
  {
    onSuccess: (data) => {
      todoStatus.value = data.find(task => task.status === 1);
    }
  }
);

const canCallTasksAPI = computed(() => !!todoStatus.value);

function callTasksAPI(enabled: MaybeRef<boolean>) {
  return useQuery(
    'portal-dashboard-tasks',
    () => {
      const { data: tasksData, applyFilter } = useFilterColumns();
      applyFilter('Client', [currentUser?.value?.client?.id]);
      applyFilter('Type', ['CLIENTTASK']);
      applyFilter('Status', [todoStatus.value?.id]);
      const taskFilters = useEncodeFilterData(tasksData);
      return useTasksListV2({
        entityType: 'CLIENTTASK',
        isPortal: isPortalUser.value,
        filters: taskFilters
      });
    },
    { enabled }
  );
}

const {
  data: tasksData,
  isLoading: tasksLoading,
  isFetching: tasksFetching
} = callTasksAPI(canCallTasksAPI);

/* const isProjectActive = (project: Project) => {
  return dayjs(project.startDate).isBefore(dayjs().endOf('day'));
}; */

/* const activeProjects = computed(() => {
  return data?.value?.filter((project: Project) => isProjectActive(project));
}); */

/* const scheduledProjects = computed(() => {
  return data?.value?.filter((project: Project) => !isProjectActive(project));
}); */
</script>

<template>
  <Common401 v-if="!hasFeatureAccess" feature="Client Portal" />
  <Common426
    v-else-if="featureSubscribed('client_portal', 'dashboard') === false"
    feature="dashboard"
  />
  <template v-else>
    <div class="layout-dashboard">
      <IntegrationsCalendlyScheduleCta
        v-if="!!calendlyData?.url"
        class="mb-4"
        :is-calendly-url="!!calendlyData"
      />
      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="card">
            <h4>Active Projects</h4>
            <CommonLoading v-if="loadingActiveProjects" />
            <div v-else class="portal-card-container">
              <template v-if="activeProjects?.length">
                <template
                  v-for="(project, index) in activeProjects"
                  :key="index"
                >
                  <WidgetProgress
                    :name="project.name"
                    :due-date="project.dueDate"
                    :start-date="project.startDate"
                    :total="project.entities?.length || 0"
                    :completed="project._count.entities"
                  />
                </template>
              </template>
              <p v-else>
                No Active Projects
              </p>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-6 max-height-content">
          <div class="card h-full">
            <h4>Scheduled Projects</h4>
            <CommonLoading v-if="loadingScheduledProjects" />
            <div v-else class="portal-card-container">
              <template
                v-if="scheduledProjects?.length"
              >
                <template
                  v-for="(project, index) in scheduledProjects"
                  :key="index"
                >
                  <WidgetProgress
                    :name="project.name"
                    :total="project.entities?.length || 0"
                    :start-date="project.startDate"
                    :due-date="project.dueDate"
                    :completed="project._count.entities"
                  />
                </template>
              </template>
              <p v-else>
                No Scheduled Projects
              </p>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-6">
          <WidgetPendingWebforms
            title="Pending Requests"
            :webforms="pendingRequests?.results"
            type="request"
            :loading-webforms="fetchingPendingRequests || loadingPendingRequests"
          />
        </div>
        <div class="col-12 md:col-6">
          <WidgetPendingWebforms
            title="Pending Contracts"
            :webforms="pendingContracts?.results"
            type="contract"
            :loading-webforms="
              loadingPendingContracts || fetchingPendingContracts
            "
          />
        </div>
        <div class="col-12 md:col-6">
          <WidgetPendingWebforms
            title="Pending Feedbacks"
            :webforms="pendingFeedbacks?.results"
            type="feedback"
            is-feedback
            :loading-webforms="
              loadingPendingFeedbacks || fetchingPendingFeedbacks
            "
          />
        </div>
        <div
          v-if="featureSubscribed('client_portal', 'client_task')"
          class="col-12 md:col-6"
        >
          <WidgetCheckList
            class="w-full"
            title="To-Do"
            entity-type="TASK"
            :tasks="tasksData?.results as unknown as Task[]"
            button-tooltip="Create Task"
            :loading="tasksLoading || tasksFetching"
          />
        </div>
      </div>
    </div>
    <!-- <div
      class="flex justify-content-end flex-column md:flex-row align-items-center mt-4"
    >
      <div class="text-900 font-medium mb-1 md:mb-0 mr-2 text-xl">Need help?</div>
      <Button label="Schedule A Meeting with CPA"></Button>
    </div> -->
  </template>
</template>

<style lang="scss" scoped>
:deep(*) {
  .card-content {
    max-height: 18rem !important;
    overflow-y: auto !important;
  }

  .portal-card-container {
    max-height: 15rem !important;
    padding-right: 1rem;
    overflow-y: auto !important;

    @media (width >= 48em) {
      height: 15rem !important;
    }
  }
}
</style>
