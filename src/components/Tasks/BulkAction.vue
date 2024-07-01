<script setup lang="ts">
import type { EntityType, Task } from '@/types/tasks.type';
import { useMutation, useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    label: string;
    tasks: Task[];
    entityType?: EntityType;
    dueDate?: Date | undefined;
    startDate?: Date | undefined;
  }>(),
  {
    entityType: 'TASK'
  }
);

const emits = defineEmits<{
  (event: 'success'): void;
}>();

const { isPortalUser } = useCurrentUserData();
const currentRoute = useRoute();
const queryClient = useQueryClient();
const { initToast } = useToasts();

const menu = ref<any>();
const isDeleteDialogVisible = ref(false);
const selectedTasks = ref<Task[]>([]);
const bulkType = ref<
  | 'assignedUserId'
  | 'entityStatusId'
  | 'entityPriorityId'
  | 'startDate'
  | 'dueDate'
  | number
>();

const isModalOpen = computed({
  get: () => !!bulkType.value,
  set: (value: boolean) => {
    if (!value) {
      bulkType.value = undefined;
    }
  }
});

const modalHeader = computed(() => {
  switch (bulkType.value) {
    case 'assignedUserId':
      return 'Assigned To';
    case 'entityStatusId':
      return 'Status';
    case 'entityPriorityId':
      return 'Priority';
    case 'startDate':
      return 'Start Date';
    case 'dueDate':
      return 'Due Date';
    default:
      return '';
  }
});

const { mutateAsync: deleteTasks } = useMutation(
  ['task-update'],
  () => {
    return useTaskBulkUpdate({
      ids: props.tasks.map((t) => {
        return t.id;
      }),
      entityType: props.entityType as EntityType,
      field: 'isDeleted',
      value: 'true',
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: () => {
      emits('success');
      queryClient.invalidateQueries({ queryKey: ['tasks-list'] });
    }
  }
);

const bulkActionsMenu = ref([
  {
    label: 'Status',
    isPortal: true,
    command: () => {
      bulkType.value = 'entityStatusId';
    }
  },
  {
    label: 'Priority',
    command: () => {
      bulkType.value = 'entityPriorityId';
    }
  },
  {
    label: 'Start Date',
    isPortal: true,
    command: () => {
      bulkType.value = 'startDate';
    }
  },
  {
    label: 'Due Date',
    command: () => {
      bulkType.value = 'dueDate';
    }
  },
  {
    label: 'Assigned To',
    command: () => {
      bulkType.value = 'assignedUserId';
    }
  },
  {
    label: 'Delete',
    isPortal: true,
    command: () => {
      isDeleteDialogVisible.value = true;
      selectedTasks.value = props.tasks;
    }
  }
]);

const filteredActionsMenu = computed(() => {
  if (isPortalUser.value && currentRoute.name === 'portal-support') {
    const data = bulkActionsMenu.value.filter(val => val.label === 'Delete');
    return data;
  }
  else if (isPortalUser.value && currentRoute.name === 'portal-tasks') {
    const data = bulkActionsMenu.value.filter(val => val.isPortal);
    return data;
  }
  else {
    return bulkActionsMenu.value;
  }
});

function toggle(event: any) {
  menu.value.toggle(event);
}

function handleUpdateSucces() {
  emits('success');
  queryClient.invalidateQueries(['tasks-list']);
  bulkType.value = undefined;
  initToast({
    actionType: 'Update',
    severity: 'success',
    summary: 'Success',
    detail: 'Task updated successfully'
  });
}
function handleRemove() {
  initToast({
    actionType: 'Delete',
    severity: 'error',
    summary: 'Delete',
    detail: 'Task Deleted Successfully'
  });
}
async function deleteTasksBulk() {
  await deleteTasks();
  handleRemove();
}
</script>

<template>
  <Button
    type="button"
    :label="label"
    icon="pi pi-angle-down"
    icon-pos="right"
    class="p-button-outlined w-full sm:w-auto flex-order-0 sm:flex-order-1 mr-2"
    v-bind="$attrs"
    @click="toggle"
  />
  <Menu ref="menu" :model="filteredActionsMenu" :popup="true" />

  <Dialog
    v-model:visible="isModalOpen"
    content-class="border-round-bottom border-top-1 surface-border p-0"
    modal
    :header="`Update ${modalHeader}`"
    :breakpoints="{ '640px': '75vw' }"
    :style="{ width: '25vw' }"
  >
    <TasksBulkActionForm
      :tasks="tasks"
      :entity-type="entityType"
      :update-field="bulkType"
      :min-due-date="dueDate"
      :max-start-date="startDate"
      @success="handleUpdateSucces()"
    />
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="isDeleteDialogVisible"
    :visible="isDeleteDialogVisible"
    :record-to-remove="selectedTasks as Record<string, any>"
    title="Confirm Delete Task(s)"
    @confirm="deleteTasksBulk"
    @hide="isDeleteDialogVisible = false"
  >
    <div>Are you sure you want to delete selected Tasks?</div>
  </CommonConfirmRemoveDialog>
</template>
