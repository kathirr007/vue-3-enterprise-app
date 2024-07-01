<script setup lang="ts">
import Dropdown from 'primevue/dropdown';
import MultiSelect from 'primevue/multiselect';
import type { MetaObj } from '@/types/common.type';
import { useCommonListQueries } from '@/composables/common';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { Task } from '@/types/tasks.type';
import type { Project } from '@/types/project.type';
import type { SchemaFormRef } from '@/types/schemaform.type';
import type { AttachTaskPayload, DetachTask } from '@/types/inbox.type';
import { AttachTaskPayloadSchema } from '@/types/inbox.type';

const props = defineProps<{
  threadId: string;
  inboxId: string;
  type?: string;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success', data: string): void;
  (e: 'modalClose'): void;
}>();
const { arrDiff } = useUtilityFns();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');

const { data: TaskFilterData, applyFilter: taskApplyFilters } =
  useFilterColumns();
taskApplyFilters('Type', props.type ? [props.type] : ['TASK']);
const { getClients } = useCommonListQueries();
const { metaFilter } = useUtilityFns();
const { initToast } = useToasts();
const queryClient = useQueryClient();
const instance = getCurrentInstance();

const taskOptions = ref();
const formKey = ref(0);
const selectedClientId = ref();
const selectProjectId = ref();
const selectedTasks = ref<string[]>([]);
const formRef = ref<SchemaFormRef>();
const projectListData = ref<Project[]>();
const initailClientId = ref<string>();
const initailProjectId = ref<string>();
const initialFilters = computed(() => {
  if (selectedClientId.value) {
    applyFilter(
      'Client',
      selectedClientId.value ? [selectedClientId.value] : []
    );
    return useEncodeFilterData(filterData);
  }
});

const taskInitailFilter = computed(() => {
  taskApplyFilters(
    'Client',
    selectedClientId.value ? [selectedClientId.value] : []
  );

  taskApplyFilters(
    'Project Name',
    selectProjectId.value ? [selectProjectId.value] : []
  );

  return useEncodeFilterData(TaskFilterData);
});
const { data: clientList } = getClients(true, initialFilters.value);

const { data: projectList } = useQuery(
  ['project-list', selectedClientId],
  () => {
    applyFilter('Is Active', undefined);
    return useProjectListV2({
      responseStatus: 'ScheduledAndActive',
      filters: initialFilters.value,
    });
  },
  {
    onSuccess: (data) => {
      return (projectListData.value = data.results);
    },
  }
);

// const { data: tasksList } = useQuery(
//   ['entities-users', selectedClientId, selectProjectId],
//   () =>
//     useEntitiesUser(
//       selectedClientId.value as string,
//       selectProjectId.value as string
//     )
// );

const { data: tasksList } = useQuery(
  ['tasks-list', selectedClientId, selectProjectId],
  async () => {
    return useTasksListV2({
      status: 'OPEN',
      entityType: 'TASK',
      filters: taskInitailFilter.value,
    });
  },
  {
    onSuccess: (data) => {
      taskOptions.value = data.results?.map((task: Task) => {
        return {
          id: task.id,
          title: metaFilter(task.meta as MetaObj[], 'title'),
        };
      });
    },
  }
);

const { isLoading: gettingThead, data: thread } = useQuery(
  ['thread-details', props.threadId],
  () => useThread(props.inboxId, props.threadId),
  {
    onSuccess: async (data) => {
      selectedTasks.value = (data.inboxData?.entities.map((e) => e.id) ||
        []) as string[];
      setTimeout(() => {
        if (data.inboxData?.clients && data.inboxData?.clients.length > 0) {
          formRef.value?.setFieldValue(
            'clientId',
            data.inboxData?.clients[0].id
          );
          // updateFieldProp('disabled', clientIndex, true);
          selectedClientId.value = data.inboxData?.clients[0].id;
          initailClientId.value = data.inboxData?.clients[0].id;
        }
        if (data.inboxData?.projects && data.inboxData?.projects.length > 0) {
          formRef.value?.setFieldValue(
            'projectId',
            data.inboxData?.projects[0].id
          );
          selectProjectId.value = data.inboxData?.projects[0].id;
          initailProjectId.value = data.inboxData?.projects[0].id;
        }
      }, 500);
      formRef.value?.setFieldValue('taskIds', selectedTasks.value);
      await nextTick(() => {
        instance?.proxy?.$forceUpdate();
      });
    },
  }
);

const formData = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'clientId',
        label: `Client`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        options: clientList.value || [],
        placeholder: 'Select clients',
        showClear: true,
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'projectId',
        label: `Project `,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select project',
        options: projectListData.value || [],
        showClear: true,
      },
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'taskIds',
        label: 'Select tasks',
        optionLabel: 'title',
        optionValue: 'id',
        placeholder: 'Select task',
        formGridClass: 'md:col-12',
        options: taskOptions.value || [],
        display: 'chip',
      },
    ],
    btnText: 'Attach',
    secondaryBtnText: 'Cancel',
    validationSchema: AttachTaskPayloadSchema,
    initialValues: { taskIds: selectedTasks.value },
    validateOnMount: true,
  };
});

const mainBtnLoading = computed(() => {
  return (
    attachingTask.value ||
    detachingTask.value ||
    detachingProject.value ||
    attachingProject.value ||
    attachingClient.value
  );
});

const { findFormIndex, updateOptions, updateFieldProp } =
  useSchemaForm(formData);
const clientIndex: number = findFormIndex('clientId');

watchEffect(() => {
  if (initailClientId.value) {
    updateFieldProp('disabled', clientIndex, true);
  }
});

const handleCancel = () => {
  emit('modalClose');
};

const onSubmit = async (values: Record<string, any>) => {
  const tasksToDetach = arrDiff(
    values.taskIds || [],
    selectedTasks.value || []
  );
  const tasksToAttach = arrDiff(
    selectedTasks.value || [],
    values.taskIds || []
  );

  if (tasksToDetach.length > 0) await detachTask({ taskIds: tasksToDetach });
  if (tasksToAttach.length > 0)
    await attachTask(values as unknown as AttachTaskPayload);
  if (
    initailProjectId.value &&
    initailProjectId.value !== selectProjectId.value
  ) {
    await detachProject({ projectId: initailProjectId.value });
  }
  if (
    selectProjectId.value &&
    selectProjectId.value !== initailProjectId.value
  ) {
    await attachProject({ projectId: selectProjectId.value });
  }
  if (selectedClientId.value) {
    await attachClient({ clientId: selectedClientId.value });
  }
  if (tasksToAttach.length) {
    initToast({
      actionType: 'Create',
      summary: 'Add Task',
      detail: `Total <strong>${tasksToAttach.length}</strong> Task(s) Attachment Successfully`,
    });
  }
  if (tasksToDetach.length > 0) {
    initToast({
      actionType: 'Delete',
      summary: 'Delete Task',
      detail: `Total <strong>${tasksToDetach.length}</strong> Task(s) Deleted Successfully`,
    });
  }
  if (
    initailProjectId.value &&
    initailProjectId.value !== selectProjectId.value
  ) {
    initToast({
      actionType: 'Delete',
      summary: 'Delete Project',
      detail: `Project Detach Successfully`,
    });
  }
  if (
    selectProjectId.value &&
    selectProjectId.value !== initailProjectId.value
  ) {
    initToast({
      actionType: 'Create',
      summary: 'Add Project',
      detail: `Project Attach Successfully`,
    });
  }
  if (!initailClientId.value) {
    initToast({
      actionType: 'Create',
      summary: 'Add Client',
      detail: `Client Attach Successfully`,
    });
  }
  queryClient.invalidateQueries('threads');
  queryClient.invalidateQueries('thread-details');
  emit('success', initailClientId.value as string);
};
const handleDropdownChange = async (val: any, name: string) => {
  if (name === 'clientId') {
    formRef.value?.setFieldValue('projectId', undefined);
    formRef.value?.setFieldValue('taskIds', undefined);
    selectedClientId.value = val.clientId;
    selectProjectId.value = undefined;
  } else if (name === 'projectId') {
    formRef.value?.setFieldValue('taskIds', undefined);
    selectProjectId.value = val.projectId;
  }
};
const { mutateAsync: attachTask, isLoading: attachingTask } = useMutation(
  (values: AttachTaskPayload) => {
    return useAttachTask(values, props?.inboxId, props?.threadId);
  }
);
const { mutateAsync: detachTask, isLoading: detachingTask } = useMutation(
  (values: DetachTask) => {
    return useDetachTask(values, props?.inboxId, props?.threadId);
  }
);
const { mutateAsync: detachProject, isLoading: detachingProject } = useMutation(
  (values: { projectId: string }) => {
    return useDetachProject(values, props?.inboxId, props?.threadId);
  }
);
const { mutateAsync: attachProject, isLoading: attachingProject } = useMutation(
  (values: { projectId: string }) => {
    return useAttachProject(values, props?.inboxId, props?.threadId);
  }
);

const { mutateAsync: attachClient, isLoading: attachingClient } = useMutation(
  (values: { clientId: string }) => {
    return useAttachClient(values, props?.inboxId, props?.threadId);
  }
);
</script>
<template>
  <CommonLoading v-if="gettingThead" />
  <CommonSchemaForm
    v-else
    :data="formData"
    ref="formRef"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
    :formKey="formKey"
    @dropdown-change="handleDropdownChange"
    :primary-btn-loading="mainBtnLoading"
  ></CommonSchemaForm>
</template>

<style lang="scss" scoped></style>
