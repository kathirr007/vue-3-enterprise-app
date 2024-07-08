<script setup lang="ts">
import type { Project } from '@/types/project.type';

import { useQueryClient } from 'vue-query';

const props = defineProps<{
  label: string;
  projects: Project[];
  dueDate: Date | undefined;
  startDate: Date | undefined;
}>();

const emits = defineEmits<{
  (event: 'success'): void;
}>();

const bulkType = ref<
  'reviewerId' | 'status' | 'projectManagerId' | 'startDate' | 'dueDate'
>();
const isModalOpen = computed({
  get: () => !!bulkType.value,
  set: value => (bulkType.value = value ? bulkType.value : undefined)
});
const modalHeader = computed(() => {
  switch (bulkType.value) {
    case 'reviewerId':
      return 'Reviewer';
    case 'status':
      return 'Status';
    case 'projectManagerId':
      return 'Project Manager';
    case 'startDate':
      return 'Start Date';
    case 'dueDate':
      return 'Due Date';
    default:
      return '';
  }
});
const queryClient = useQueryClient();

const { initToast } = useToasts();

const isStatus = computed(() => {
  if (props.projects) {
    return props.projects[0].status.name;
  }
});
const menu = ref<any>();
function resetComponent() {
  bulkType.value = undefined;
}

const hideMenuOption = isStatus.value !== 'Archived';

const bulkActionsMenu = ref([
  {
    label: 'Status',
    hideMenuOption: true,
    command: () => {
      resetComponent();
      bulkType.value = 'status';
    }
  },
  {
    label: 'Project Manager',
    hideMenuOption,
    command: () => {
      resetComponent();
      bulkType.value = 'projectManagerId';
    }
  },
  {
    label: 'Reviewer',
    hideMenuOption,
    command: () => {
      resetComponent();
      bulkType.value = 'reviewerId';
    }
  },
  {
    label: 'Start Date',
    hideMenuOption,
    command: () => {
      bulkType.value = 'startDate';
    }
  },
  {
    label: 'Due Date',
    hideMenuOption,
    command: () => {
      bulkType.value = 'dueDate';
    }
  }
]);

function toggle(event: any) {
  menu.value.toggle(event);
}

const filteredActionsMenu = computed(() => {
  const data = bulkActionsMenu.value.filter(val => val.hideMenuOption);
  return data;
});
function handleUpdateSucces() {
  emits('success');
  queryClient.invalidateQueries(['project-list']);
  resetComponent();
  initToast({
    actionType: 'Update',
    severity: 'success',
    summary: 'Success',
    detail: 'Project updated successfully'
  });
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
    @hide="resetComponent()"
  >
    <ProjectBulkActionForm
      :projects="projects"
      :update-field="bulkType as string"
      :status-value="isStatus"
      :min-due-date="dueDate"
      :max-start-date="startDate"
      @success="handleUpdateSucces"
    />
  </Dialog>
</template>
