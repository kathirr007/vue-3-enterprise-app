<script setup lang="ts">
import type {
  CreateProject,
  Project
} from '@/types/project.type';
import type { OrderedPipelineStages } from '@/types/service.type';
import type { EntityType, Task } from '@/types/tasks.type';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import draggable from 'vuedraggable';
import router from '@/router';
import StarRating from 'vue-star-rating';

const props = defineProps<{
  clientId?: string;
  projectStages?: OrderedPipelineStages[];
  serviceId?: string;
}>();

const emits = defineEmits<{
  (e: 'stage-update'): void;
}>();

const queryClient = useQueryClient();
const { sortCompare, getProgressBarColor } = useUtilityFns();
const { canDo, canAccessAllMenu } = usePermissions();
const { currentUser } = useCurrentUserData();
const { getAttachmentUrl } = useAttachments();
const { fullName, initials } = useVueFilters();
const { queryFilters, queryKeys } = useDataTableUtils();
const { getStatusName } = useProjectStatus();
const { getAll: getAllStages } = useProjectStages();
const { ratingOptions } = useFeedback();

const drag = ref(false);
const refetchKey = ref(1);
const sliderOverDetails = ref();
const showSlider = ref(false);
const refreshProjectsList = ref(false);
const draggedItem = ref();
const draggedColumnStatus = ref();
const droppedColumnStatus = ref();
const droppedColumnStage = ref();
const draggedItemIndex = ref();
const droppedItemIndex = ref();
const draggedColumnIndex = ref();
const droppedColumnIndex = ref();
const projectBulkTaskUpdateRef = ref();
const movingProjectDetails = ref<Project>();
const droppedColumnStageId = ref<string>();
// const statusOptions = ref<ProjectStatus[]>();

function completedEntitiesInPercent(data: Project) {
  const completedEntities = data._count?.entities;
  const totalEntities = data.entities?.length;
  if (totalEntities === 0)
    return 0;
  return Math.round((completedEntities / totalEntities) * 100);
}

const dragOptions = computed(() => {
  return {
    animation: 200,
    group: 'projects',
    disabled: false,
    ghostClass: 'ghost',
    scrollSensitivity: 200,
    forceFallback: true
  };
});

const { data: projectStageList } = useQuery(
  ['project-stages', ...queryKeys],
  () => {
    return getAllStages();
  }
);

const { mutateAsync: updateProject, isLoading: updatingProject } = useMutation(
  (payload: Partial<CreateProject>) => {
    return useProjectUpdate(draggedItem.value.id as string, payload);
  }
);

const stagesOptions = computed(() => {
  const pipeLineIds
    = props.projectStages?.map(stage => stage.pipelineStageId) || [];
  if (props.projectStages)
    return (
      pipeLineIds?.map((id) => {
        return projectStageList.value?.results.find((stage) => {
          return stage.id === id;
        });
      }) || []
    );
  else
    return (
      projectStageList.value?.results.filter(stage => !stage.orgId) || []
    );
});

const { data: filterData, applyFilter } = useFilterColumns();
if (props.clientId) {
  applyFilter('Client', [props.clientId]);
}
const initialFilters = useEncodeFilterData(filterData);

const {
  data: allProjects,
  isFetching,
  isFetched
} = useQuery(
  ['all-projects-list', refreshProjectsList],
  () => {
    const refactoredFilter = queryFilters.value
      ? useDecodeFilterData(queryFilters.value)
      : useDecodeFilterData(initialFilters);
    const serviceId = props.serviceId || refactoredFilter.Service?.value[0];
    if (serviceId && refactoredFilter) {
      refactoredFilter.Service = {
        column: 'serviceId',
        operator: 'in',
        value: [serviceId]
      };
    }

    const encodedFilters = useEncodeFilterData(refactoredFilter);

    if (
      (serviceId || queryFilters.value)
      && encodedFilters !== queryFilters.value
    ) {
      router.push({
        query: {
          ...router.currentRoute.value.query,
          filters: encodedFilters
        }
      });
    }

    return useProjectListV2({
      filters: refactoredFilter ? encodedFilters : initialFilters,
      isAdhoc: !serviceId
    });
  },
  {
    onSuccess: () => {
      refreshProjectsList.value = false;
    }
  }
);

const { isFetching: fetchingProjectDetails } = useQuery(
  ['project-details', draggedItem],
  () => {
    if (!draggedItem.value)
      return;
    return useProjectDetails(draggedItem.value.id);
  },
  {
    onSuccess: (data) => {
      movingProjectDetails.value = data;
      refetchKey.value++;
    },
    enabled: !!draggedItem
  }
);

const allItemsGrouped = computed(() => {
  if (stagesOptions.value.length === 0)
    return [];
  const projectStageGroupObj = stagesOptions.value
    ? stagesOptions.value
      ?.map(stage => stage?.id)
      .reduce((obj, key) => {
        obj[key as string] = [];
        return obj;
      }, {} as any)
    : {};

  return isFetched.value
    ? allProjects.value?.results.reduce((groups: any, item) => {
      if (!item.pipelineStage)
        return groups;
      const stageId = item.pipelineStage?.id;
      if (!groups[stageId]) {
        // If not, create a new group with an empty array
        groups[stageId] = [];
      }

      groups[stageId]?.push({ ...item, collapsed: true });

      return groups;
    }, projectStageGroupObj)
    : [];
});

watch(
  () => props.serviceId,
  () => {
    if (props.serviceId)
      refreshProjectsList.value = true;
  }
);

const itemMoveHeader = computed(() => {
  switch (droppedColumnStatus.value) {
    case 'Scheduled':
      return {
        title: `Moving ${draggedItem.value.name} to ${droppedColumnStage.value}`,
        // description: `Please update all tasks status to <strong>To Do</strong>, To move project to <strong>
        //   ${droppedColumnStage.value}
        // </strong>.`,
        description: `To Change Project Stage, Please update all tasks status to <strong>TO DO</strong>.`
      };
    case 'Active':
      return {
        title: `Moving ${draggedItem.value.name} to ${droppedColumnStage.value}`,
        // description: `Please update at-least one task status to any status other than <strong>To Do</strong> or <strong>Closed</strong>, To move project to <strong>
        //   ${droppedColumnStage.value}
        // </strong>.`,
        description: `To Change Project Stage, Please update at least one task status to <strong>In Progress</strong>.`
      };
    case 'Completed':
      return {
        title: `Moving ${draggedItem.value.name} to ${droppedColumnStage.value}`,
        // description: `Please update all tasks status to <strong>Closed</strong>, To move project to <strong>
        //   ${droppedColumnStage.value}
        // </strong>.`,
        description: `To Change Project Stage, Please update all tasks status to <strong>Closed</strong>.`
      };

    default:
      break;
  }
});

function filterProjectTasks(type: EntityType) {
  return movingProjectDetails.value
    ? toRaw(movingProjectDetails.value)
      .entities.filter((item: Task) => item)
      .sort(sortCompare({ compareProp: 'type', order: 'desc' }))
    : [];
}
// const getItemColumnName = (items: any[], status: string) => {
//   const findStatusOrder = (statusVal: string) =>
//     statusOptions.value?.find((item: ProjectStatus) => item.name === statusVal)
//       ?.status;
//   switch (status) {
//     case 'Scheduled':
//       return { name: 'To Do', order: findStatusOrder(status) };
//     case 'Active':
//       return { name: 'In Progress', order: findStatusOrder(status) };
//     default:
//       return { name: status, order: findStatusOrder(status) };
//   }
// };

const groupedProjects = computed(() => {
  // Group the objects by "status.name"

  // Convert the groupedResults object to an array
  const groupedArray = Object.entries(allItemsGrouped.value).map(
    ([stage, items]) => {
      const name = stagesOptions.value.find((item) => {
        return item?.id === stage;
      })?.name;
      return {
        stage: name,
        items,
        name,
        id: stage,
        collapsed: true
      };
    }
  );

  return groupedArray;
});

const boardData = reactive<{ name: string; columns: any[] }>({
  name: 'Projects',
  columns: []
});

function handleItemCollapse(item: Project & { collapsed: boolean },
  itemIndex: number,
  columnIndex: number) {
  boardData.columns[columnIndex].items[itemIndex].collapsed = !item.collapsed;
}

function onStart() {
  drag.value = true;
  // draggedColumnStatus.value = undefined;
  // droppedColumnStatus.value = undefined;
}
function onEnd() {
  drag.value = false;
  useTimeoutFn(() => {
    // TODO If Needed:
  }, 1500);
}

function onMove(e: any) {
  if (drag.value) {
    return true;
  }
  if (e.draggedContext.element.entities?.length === 0) {
    refreshProjectsList.value = true;
    return false;
  }
  draggedItem.value = e.draggedContext.element;
  draggedItemIndex.value = e.draggedContext.index;
  droppedItemIndex.value = e.relatedContext.index;
  draggedColumnStatus.value = e.draggedContext.element.status.name;
  droppedColumnStageId.value
    = e.relatedContext.component.componentData.columnStageId;
  droppedColumnStage.value = stagesOptions.value?.find((stage) => {
    return stage?.id === droppedColumnStageId.value;
  })?.name;
  droppedColumnStatus.value = projectStageList.value?.results.find(
    stage => stage.id === droppedColumnStageId.value
  )?.projectStatus?.name;
  draggedColumnIndex.value = boardData.columns.findIndex(
    (column: any) => column.status === draggedColumnStatus.value
  );
  droppedColumnIndex.value = boardData.columns.findIndex(
    (column: any) => column.status === droppedColumnStatus.value
  );

  if (draggedColumnStatus.value !== droppedColumnStatus.value) {
    showSlider.value = true;
    scrollTo({ top: 60 - 16, behavior: 'smooth' });
    return false;
  }
  else {
    updateProject({
      pipelineStageId: droppedColumnStageId.value
    });
  }
}

const moveItem = useDebounceFn((e) => {
  onMove(e);
}, 1500);

function closeSlider() {
  draggedItem.value = undefined;
  showSlider.value = false;
  movingProjectDetails.value = undefined;
  refreshProjectsList.value = true;
}

watchEffect(() => {
  if (groupedProjects.value) {
    boardData.columns = [...groupedProjects.value];
  }
});

async function handleBulkUpdate(data: Task[]) {
  if (!data) {
    closeSlider();
    return;
  }
  if (data.length) {
    if (droppedColumnStatus.value === 'Completed') {
      const isAllTaskCompleted = data.every(
        item => item.status?.status === 3
      );
      if (!isAllTaskCompleted) {
        closeSlider();
        return;
      }
    }
    if (droppedColumnStatus.value === 'Active') {
      const isAnyTaskInProgress = data.some(
        item => item.status?.status === 2
      );
      if (!isAnyTaskInProgress) {
        closeSlider();
        return;
      }
    }

    if (droppedColumnStatus.value === 'Scheduled') {
      const isAllTaskInTodo = data.every(
        item => item.status?.status === 0 || item.status?.status === 1
      );
      if (!isAllTaskInTodo) {
        closeSlider();
        return;
      }
    }
    await updateProject({
      pipelineStageId: droppedColumnStageId.value
    });
    emits('stage-update');
  }
  closeSlider();
}
</script>

<template>
  <CommonLoading v-if="isFetching" />
  <div v-else key="kanban-board" class="kanban-board h-full overflow-auto">
    <transition
      enter-active-class="fadeinright"
      leave-active-class="fadeoutright"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      mode="out-in"
    >
      <div
        v-if="showSlider"
        id="sliderOverDetails"
        ref="sliderOverDetails"
        class="surface-overlay border-round-md h-full absolute top-0 right-0 shadow-2 w-8 z-1 overflow-hidden overflow-y-auto"
      >
        <div class="flex flex-column p-3 h-full">
          <div class="flex align-items-start justify-content-between mb-4">
            <h3 class="text-primary text-xl font-medium">
              {{ itemMoveHeader?.title }}
              <small
                class="block text-sm font-italic font-normal"
                v-html="itemMoveHeader?.description"
              />
            </h3>
            <Button
              icon="pi pi-times"
              class="flex-shrink-0 p-button-rounded p-button-text p-button-plain"
              @click="closeSlider"
            />
          </div>
          <TabView>
            <TabPanel :key="`tasksTab_${refetchKey}`" header="Tasks">
              <ProjectBulkTaskUpdate
                :key="`tasks_${refetchKey}`"
                ref="projectBulkTaskUpdateRef"
                :show-actions="false"
                show-task-status
                hide-header
                :entities="filterProjectTasks('TASK')"
                entity-type="TASK"
                :is-loading="fetchingProjectDetails"
                :is-updating-project="updatingProject"
                @cancel="closeSlider"
                @bulk-update="handleBulkUpdate"
              />
            </TabPanel>
            <!-- <TabPanel
              header="Client Requests"
              :key="`clientTasksTab_${refetchKey}`"
            >
              <ProjectBulkTaskUpdate
                :showActions="false"
                :key="`clientTasks_${refetchKey}`"
                ref="projectBulkTaskUpdateRef"
                showTaskStatus
                hideHeader
                :entities="filterProjectTasks('CLIENTTASK')"
                :entityType="'CLIENTTASK'"
                :isLoading="fetchingProjectDetails"
                @cancel="closeSlider"
                @bulkUpdate="closeSlider"
              />
            </TabPanel> -->
          </TabView>
        </div>
      </div>
    </transition>

    <div
      v-if="boardData.columns.length"
      class="flex flex-row align-items-start"
      :class="{ 'pointer-events-none': showSlider }"
    >
      <div
        v-for="(column, $columnIndex) of boardData.columns"
        :key="$columnIndex"
        class="board-column flex-shrink-0 mr-4 text-left border-round-md relative"
      >
        <div
          class="flex align-items-center justify-content-center mb-4 bg-primary border-round-md text-white font-medium p-2 px-3 text-base text-center"
        >
          {{ column.name }}
          ( {{ column.items.length }} )
          <!-- <Badge :value="column.items.length" severity="warning"></Badge> -->
        </div>
        <div class="items-list">
          <draggable
            :key="`${column.name}_${refetchKey}`"
            :sort="false"
            :item-key="column.name || ''"
            :column-status="column.status"
            :list="column.items"
            class="list-group min-h-full"
            :component-data="{
              tag: 'div',
              type: 'transition-group',
              name: !drag ? 'flip-list' : null,
              key: `transition-group${column.name}`,
              columnStageId: `${column.id}`,
              orgList: column.items,
            }"
            v-bind="dragOptions"
            :move="moveItem"
            :scrollable="true"
            @start="onStart"
            @end="onEnd"
          >
            <template #item="{ element: item, index: $itemIndex }">
              <div
                :key="item.id"
                class="list-item shadow-1 border-1 default-border-color mb-3 p-2 pl-4 border-round-md bg-primary-50 text-gray-900 space-y-2.5 relative cursor-move"
              >
                <!-- <Icon
                  icon="uil:draggabledots"
                  class="drag-handle text-2xl cursor-move text-gray-300 hover:text-gray-900"
                /> -->
                <router-link
                  :key="`pm-${item.id}-link`"
                  v-tooltip="fullName(item.projectManager)"
                  :to="{
                    name: 'admin-teams-id',
                    params: { id: item.projectManager.id },
                  }"
                  :class="{
                    'pointer-events-none':
                      (!canAccessAllMenu
                        && item.projectManager.id !== currentUser.id)
                      || !canDo('users', 'single'),
                  }"
                  class="flex flex-shrink-1 align-items-center text-gray-900 cursor-pointer hover:text-gray-600 absolute user-avatar"
                >
                  <Avatar
                    class="mr-2 relative text-sm"
                    :class="{ 'bg-primary': !item.projectManager?.picture }"
                    shape="circle"
                  >
                    <img
                      v-if="item.projectManager?.picture"
                      class="text-sm"
                      :src="getAttachmentUrl(item.projectManager?.picture.path)"
                      style="vertical-align: middle;"
                      alt="Project Manager"
                    >
                    <template v-else>
                      {{ initials(fullName(item.projectManager) as string) }}
                    </template>
                  </Avatar>
                </router-link>
                <div :key="`project-name-${item.id}`">
                  <!-- <div class="text-sm text-primary-300">Project Name</div> -->
                  <div class="font-medium text-lg pr-3 mr-4 flex flex-column w-full gap-1">
                    <router-link
                      :to="{
                        name: 'admin-projects-id',
                        params: { id: item.id },
                      }"
                    >
                      {{ item.name }}
                    </router-link>
                    <!-- <Rating
                      v-if="item.feedback"
                      :model-value="(item.rating || 0)" class="text-primary" :pt="ratingPassthroughOptions" :cancel="false" readonly
                    />
                    <Rating
                      v-else
                      :model-value="0" class="text-primary" :pt="ratingPassthroughOptions" :cancel="false" readonly
                    /> -->
                    <StarRating
                      :rating="(item.feedback?.rating || 0)" v-bind="{ ...ratingOptions }"
                    />
                    <p
                      v-if="item.client && item.collapsed"
                      class="font-medium text-lg"
                    >
                      {{ ` (${item.client?.name})` }}
                    </p>
                  </div>
                  <p class="mb-1">
                    <span class="font-medium text-900">{{
                      `${completedEntitiesInPercent(item)}%`
                    }}</span>
                    <span class="text-sm text-600">{{
                      ` (${item._count.entities}/${item.entities.length})`
                    }}</span>
                  </p>

                  <ProgressBar
                    :value="completedEntitiesInPercent(item)"
                    :show-value="true"
                    :style="{ height: '10px' }"
                  >
                    <div
                      class="w-full h-full"
                      :class="`bg-${getProgressBarColor(
                        completedEntitiesInPercent(item),
                      )}`"
                    />
                  </ProgressBar>
                </div>
                <div
                  v-if="!item.collapsed"
                  :key="`project-collapsed-${item.id}`"
                  class="fadeindown animation-duration-400 space-y-2.5"
                >
                  <div v-if="item.client">
                    <div class="text-sm text-primary-300">
                      {{ `${$tConfig('CLIENT')}` }}
                    </div>
                    <div class="font-medium text-base">
                      {{ item.client.name }}
                    </div>
                  </div>
                  <div v-if="item.billingRate">
                    <div class="text-sm text-primary-300">
                      Fees
                    </div>
                    <div class="font-medium text-base">
                      ${{ item.billingRate
                      }}<span v-if="item.billingType === 'HOURLY'">/Hr</span>
                    </div>
                  </div>
                  <div
                    v-if="item.description"
                    class="w-full flex-shrink-0 mt-1 text-sm"
                  >
                    {{ item.description }}
                  </div>
                  <Divider />
                  <div class="flex justify-content-between">
                    <div>
                      <div class="text-sm text-primary-300">
                        Start Date
                      </div>
                      <div class="font-medium text-base">
                        {{ dayjs(item.startDate).format('DD-MM-YYYY') }}
                      </div>
                    </div>
                    <div>
                      <div class="text-sm text-primary-300">
                        Due Date
                      </div>
                      <div class="font-medium text-base">
                        {{ dayjs(item.dueDate).format('DD-MM-YYYY') }}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  :key="`project-expand-${item.id}`"
                  class="flex justify-content-center cursor-pointer"
                  @click="handleItemCollapse(item, $itemIndex, $columnIndex)"
                >
                  <i
                    class="pi text-primary"
                    :class="item.collapsed ? 'pi-angle-down' : 'pi-angle-up'"
                  />
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>
    <div v-else class="card border-2 default-border-color shadow-3">
      <div class="text-center font-medium">
        No project record found.
      </div>
    </div>
    <transition
      enter-active-class="fadeinright"
      leave-active-class="fadeoutright"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      mode="out-in"
    >
      <div
        v-if="showSlider"
        class="pointer-events-none overlay absolute top-0 left-0 h-full w-full bg-primary-300 opacity-50"
      />
    </transition>
  </div>
</template>

<style lang="scss" scoped>
:deep(.p-progressbar) {
  .p-progressbar-label {
    width: 100%;
    height: 100%;
  }
}

.board-column {
  width: 375px;
}

.user-avatar {
  right: 0;
}

.items-list {
  height: calc(100vh - 370px);
  overflow: hidden;
  overflow-y: auto;

  .list-item {
    .drag-handle {
      position: absolute;
      top: 50%;
      left: -3px;
      transform: translateY(-50%);
    }
  }
}
</style>
