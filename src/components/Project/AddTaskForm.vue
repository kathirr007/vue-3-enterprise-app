<script setup lang="ts">
import { useMutation, useQueryClient } from 'vue-query';
import type { Ref } from 'vue';
import { useRouteQuery } from '@vueuse/router';
import type { EntityType, Task } from '@/types/tasks.type';
import { useEntityDelete } from '@/composables/tasks';
import type { DropdownChangeEvent } from 'primevue/dropdown';
import type { Project } from '@/types/project.type';

const props = defineProps<{
  projectDetails?: Project;
}>();

const emit = defineEmits<{
  (e: 'tasks-updated'): void;
}>();

const disabledTooltip = inject('disabledTooltip', '');
const canDoActions = inject('canDoActions', true);

const router = useRouter();
const route = useRoute();
const projectId = ref(route.params.id as string);
const queryTaskType = useRouteQuery<string>('entityType');
const activeIndex = useRouteQuery<string>('activeIndex');
const { initToast } = useToasts();
const { defaultBreakpoints } = useCommonBreakPoints();
const { canDo } = usePermissions();

const currentStatus = ref<string>();
const createProjectTaskDialog = ref(false);
const taskKey = ref(0);
const actionType = ref();
const selectedTask = ref<Task>();
const queryClient = useQueryClient();
const dialogHeader = ref<string>('');
const deleteProjectDialog = ref(false);
const tasksListRef = ref();
const selectedTaskType = ref<EntityType>(
  queryTaskType.value ? (queryTaskType.value as EntityType) : 'TASK'
);
const taskStatusOptions = ref([
  {
    name: 'Team Tasks',
    value: 'TASK'
  },
  { name: 'Client Request', value: 'CLIENTTASK' }
]);

function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedTask.value = undefined;
}

function showToast() {
  initToast({
    actionType: actionType.value,
    title: 'Project Task',
    actionObj: { ...selectedTask.value }
  });
}
function prepareForCreate() {
  dialogHeader.value = 'Create Project Task';
  selectedTask.value = undefined;
  createProjectTaskDialog.value = true;
  taskKey.value = taskKey.value + 1;
}
function prepareForUpdate(data: Task) {
  dialogHeader.value = 'Update Project Task';
  selectedTask.value = { ...data };

  createProjectTaskDialog.value = true;
  taskKey.value = taskKey.value + 1;
}
function prepareForRemove(data: Task) {
  selectedTask.value = data;
  deleteProjectDialog.value = true;
}
function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteProjectDialog, showToast);
}

function closeConfirmRemoveDialog() {
  deleteProjectDialog.value = false;
}

const { mutateAsync: removeProjectTask } = useMutation(
  () =>
    useEntityDelete(
      selectedTask.value?.id as string,
      selectedTask.value?.type as EntityType
    ),
  {
    onSuccess: () => handleRemove()
  }
);
function handleTask() {
  createProjectTaskDialog.value = false;
  queryClient.invalidateQueries('project-details');
}

function deletProjectTask() {
  if (selectedTask.value !== undefined) {
    removeProjectTask();
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

function handleStatusName(val: string) {
  if (val) {
    currentStatus.value = val;
  }
}
</script>

<template>
  <CommonPage
    :title="`
  ${selectedTaskType === 'TASK' ? 'Team' : ' Client Request'} ( ${
      currentStatus ? currentStatus : ''
    } )`"
  >
    <!-- <template #description>
      Tasks of <strong>{{ projectDetails?.name }}</strong>
    </template> -->

    <!-- <template v-slot:actions>
      <Button
        icon="pi pi-plus"
        aria-label="add-record"
        class="p-button-sm p-button-rounded p-button-primary mr-2"
        @click="prepareForCreate"
      />
    </template> -->

    <div class="flex align-items-center justify-content-between mb-4 -mt-3">
      <div class="justify-content-end mr-auto">
        <Dropdown
          v-model="selectedTaskType"
          option-label="name"
          option-value="value"
          :options="taskStatusOptions"
          placeholder="Select"
          @change="updateSelectedTaskStatus"
        />
      </div>
      <span
        v-if="
          canDo('tasks', 'create')
            && (projectDetails?.status.name === 'Scheduled'
              || projectDetails?.status.name === 'Active')
        "
        v-tooltip.top="`${!canDoActions ? disabledTooltip : 'Create Task'}`"
        class="inline-block"
        style=" width: 2.357rem;height: 2.357rem;"
      >
        <Button
          :disabled="!canDoActions"
          icon="pi pi-plus"
          aria-label="add-record"
          class="p-button-sm p-button-rounded p-button-primary"
          @click="prepareForCreate"
        />
      </span>
    </div>
    <div class="card">
      <TasksList
        ref="tasksListRef"
        :project-id="projectId as string"
        hide-filters
        :entity-type="selectedTaskType"
        :is-project-completed="projectDetails?.status.name === 'Completed'"
        @task-status-title="handleStatusName"
        @success="$emit('tasks-updated')"
      />
    </div>

    <CommonConfirmRemoveDialog
      v-if="selectedTask && deleteProjectDialog"
      :visible="deleteProjectDialog"
      :record-to-remove="(selectedTask as Record<string, any>)"
      title="Confirm Delete Project Task"
      @confirm="deletProjectTask"
      @hide="closeConfirmRemoveDialog"
    />
  </CommonPage>
  <Dialog
    v-model:visible="createProjectTaskDialog"
    :modal="true"
    append-to="body"
    :header="dialogHeader"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <TasksCreateUpdate
      :key="taskKey"
      project
      :project-id="projectId as string"
      :client-id="projectDetails?.client?.id"
      :task-id="selectedTask?.id"
      :entity-type="selectedTask?.type || selectedTaskType"
      :project-billing="projectDetails?.billingType"
      @close="handleTask"
    />
  </Dialog>
</template>
