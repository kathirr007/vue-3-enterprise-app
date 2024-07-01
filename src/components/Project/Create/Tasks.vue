<script setup lang="ts">
import { useBulkCreateTasks } from '@/composables/tasks';
import type { GeneratedTask, Project } from '@/types/project.type';
import type {
  EntityType,
  UpdateTask
} from '@/types/tasks.type';
import dayjs from 'dayjs';
import { useMutation } from 'vue-query';

const props = defineProps<{
  project: Project;
  tasks: GeneratedTask[];
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();
const updatedTasks = ref<Record<string, unknown>[] | GeneratedTask[]>(
  props.tasks
);
const addTaskDialog = ref(false);

const { initToast } = useToasts();

const { mutateAsync: createTasks, isLoading: creatingTasks } = useMutation(
  ({
    payload,
    type
  }: {
    payload: { entities: UpdateTask[] };
    type: EntityType;
  }) => useBulkCreateTasks(type, payload)
);

function handleEntitiesUpdates(data: Record<string, unknown>[]) {
  updatedTasks.value = data;
}

watch(
  () => props.tasks,
  (val) => {
    updatedTasks.value = val;
  }
);

function getInitialFormValues() {
  return {
    type: 'TASK',
    entityStatus: 'To Do',
    entityPriority: 'Medium',
    startDate: props.project.startDate,
    dueDate: props.project.dueDate,
    assignees: [props.project.projectManager.id],
    clientId: props.project.client?.id
  };
}

function handleCreateTask(data: Record<string, unknown>) {
  updatedTasks.value.push({
    ...data,
    isUpdated: true
  } as unknown as GeneratedTask);
  addTaskDialog.value = false;
}

async function handleBulkCreate(taskPayload: Record<string, any>[]) {
  const tasks = taskPayload
    .filter(task => task.type === 'TASK')
    .map((task) => {
      return {
        data: { ...task, description: JSON.stringify(task.description) },
        type: 'TASK'
      };
    }) as UpdateTask[];
  const clientTasks = taskPayload
    .filter(task => task.type === 'CLIENTTASK')
    .map((task) => {
      return {
        data: { ...task, description: JSON.stringify(task.description) },
        type: 'CLIENTTASK'
      };
    }) as UpdateTask[];
  const tasksRes = await createTasks({
    payload: { entities: tasks },
    type: 'TASK'
  });
  const clientTasksRes = await createTasks({
    payload: { entities: clientTasks },
    type: 'CLIENTTASK'
  });
  if (tasksRes && clientTasksRes) {
    initToast({
      actionType: 'Add',
      severity: 'success',
      summary: 'Success',
      detail: 'Tasks created successfully'
    });
    emit('back');
  }
}
</script>

<template>
  <div>
    <div class="flex justify-content-between align-items-center mb-3">
      <h1 class="text-3xl text-primary mb-2">
        Add Tasks for {{ project.name }}
      </h1>
      <Button
        v-tooltip.top="'Add Task'"
        icon="pi pi-plus"
        class="p-button-sm p-button-rounded"
        @click="addTaskDialog = true"
      />
    </div>
    <ProjectScheduleUpdateTasks
      :project-details="project"
      :entity-templates-modified="updatedTasks"
      :project-manager="project.projectManager.id"
      :due-date="dayjs(project.dueDate).toDate()"
      is-project-create
      :is-loading="creatingTasks"
      @entities-updates="handleEntitiesUpdates"
      @submit="(() => handleBulkCreate)()"
      @skip="emit('back')"
    />
  </div>
  <Dialog
    v-model:visible="addTaskDialog"
    :header="`Add Task for ${project.name}`"
    :modal="true"
    :style="{ width: '50%' }"
    @hide="addTaskDialog = false"
  >
    <ProjectScheduleUpdateTaskTemplate
      is-project-create
      :form-values="getInitialFormValues()"
      :project-details="project"
      @submit="handleCreateTask"
    />
  </Dialog>
</template>

<style lang="scss" scoped></style>
