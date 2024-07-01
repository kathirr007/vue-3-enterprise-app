<script setup lang="ts">
import type { CreateEntityTimer, TimerObj } from '@/types/timer.type';
import { CreateEntityTimerPayloadSchema } from '@/types/timer.type';
import Dropdown from 'primevue/dropdown';
import { useCommonListQueries } from '@/composables/common';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { MetaObj } from '@/types/common.type';
import type { Task } from '@/types/tasks.type';

import type { Project } from '@/types/project.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

const props = defineProps<{
  taskIdValue?: string;
  project?: string;
  client?: string;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'success', data: TimerObj): void;
  (e: 'modalClose'): void;
}>();

const currentRoute = useRoute();
const { getClients } = useCommonListQueries();
const { metaFilter } = useUtilityFns();
const { pluralize } = useVueFilters();
const { start } = useTimer();
const queryClient = useQueryClient();
const formKey = ref(0);
const { initToast } = useToasts();
const route = useRoute();
const currentRouteId = ref(route.params.id as string);
const { data: filterData, applyFilter } = useFilterColumns();

const formRef = ref<SchemaFormRef>();
const selectedClientId = ref();
const selectProjectId = ref();
const projectListData = ref<Project[]>();
const taskOptions = ref<{ id: string; title: string }[]>([]);

const initialFilters = computed(() => {
  if (selectedClientId.value) {
    applyFilter('Client', [selectedClientId.value]);
    return useEncodeFilterData(filterData);
  }
});

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const {
  data: clientList,
  isLoading: loadingClients,
  isFetching: fetchingClients
} = getClients(true, clientFilters);

async function setFormValues() {
  formRef.value?.setValues({
    ...formRef.value.schemaFormValues,
    clientId:
      selectedClientId.value || props.client
        ? selectedClientId.value || props.client
        : undefined,
    projectId:
      selectProjectId.value || props.project
        ? selectProjectId.value || props.project
        : undefined,
    taskId: props.taskIdValue ? props.taskIdValue : undefined
  });
}

const {
  data: projectList,
  isLoading: loadingProjects,
  isFetching: fetchingProjects
} = useQuery(
  ['timer-project-list', selectedClientId],
  () =>
    useProjectListV2({
      responseStatus: 'ScheduledAndActive',
      filters: initialFilters.value
    }),
  {
    onSuccess: (data) => {
      return (projectListData.value = data.results);
    }
  }
);
const { data: projectDetails } = useQuery(
  ['project-details', selectProjectId],
  () => {
    // if (!selectProjectId.value) return;
    return useProjectDetails(selectProjectId.value as string);
  },
  {
    enabled: computed(() => !!selectProjectId.value),
    onSuccess: (data: Project) => {
      if (data) {
        selectedClientId.value = data.client.id;
        setFormValues();
      }
    }
  }
);
const {
  data: tasksList,
  isLoading: loadingTasks,
  isFetching: fetchingTasks
} = useQuery(
  ['entities-users', selectedClientId, selectProjectId],
  () =>
    useEntitiesUser(
      selectedClientId.value as string,
      selectProjectId.value as string
    ),
  {
    onSuccess: (data) => {
      taskOptions.value = data
        ?.filter((task: Task) => task.isActive)
        .map((task: Task) => {
          return {
            id: task.id,
            title: metaFilter(task.meta as MetaObj[], 'title')
          };
        });
    }
  }
);

function handleAction(data: TimerObj) {
  initToast({
    actionType: 'Update',
    summary: 'Start Timer',
    title: 'Start Timer',
    actionObj: { ...data },
    detail: `Timer for the task <strong>${metaFilter(
      data.entity.meta as MetaObj[],
      'title'
    )}</strong> is started successfully`
  });
  emit('success', data as TimerObj);
}

const { mutateAsync: createstart, isLoading: startIsLaoding } = useMutation(
  (payload: CreateEntityTimer) => {
    return start(payload);
  },
  {
    onSuccess: (data) => {
      handleAction(data);
    }
  }
);

const formData: ComputedRef<SchemaForm> = computed(() => {
  return {
    fields: [
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'clientId',
        label: `${$tConfig('CLIENT')}`,
        autocomplete: 'off',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: `Select ${$tConfig('CLIENT').toLowerCase()}`,
        showClear: true,
        options: clientList.value || [],
        loading: loadingClients.value || fetchingClients.value
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
        showClear: true,
        options: projectListData.value || [],
        loading: loadingProjects.value || fetchingProjects.value
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'taskId',
        label: `Task `,
        autocomplete: 'off',
        required: true,
        optionLabel: 'title',
        optionValue: 'id',
        placeholder: 'Select Task',
        formGridClass: 'md:col-12 ',
        options: taskOptions.value || [],
        loading: loadingTasks.value || fetchingTasks.value
      }
    ],
    validationSchema: CreateEntityTimerPayloadSchema,
    initialValues: {
      clientId:
        selectedClientId.value || props.client
          ? selectedClientId.value || props.client
          : undefined,
      projectId:
        selectProjectId.value || props.project
          ? selectProjectId.value || props.project
          : undefined,
      taskId: props.taskIdValue ? props.taskIdValue : undefined
    },
    validateOnMount: true,
    btnText: 'Start Timer',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});

watch(
  () => [currentRoute, selectedClientId],
  ([currentRouteVal]) => {
    if (
      (currentRouteVal as RouteLocationNormalizedLoaded).name
      === 'admin-clients-id'
    ) {
      selectedClientId.value = currentRouteId.value as string;
    }
    else if (
      (currentRouteVal as RouteLocationNormalizedLoaded).name
      === 'admin-projects-id'
    ) {
      selectProjectId.value = currentRouteId.value as string;
    }
  },
  { immediate: true }
);

function handleCancel() {
  // cancel the form
  emit('modalClose');
}

async function onSubmit(values: any) {
  const { taskId, ...rest } = values;
  const payload = { entityId: taskId };
  await createstart(payload as CreateEntityTimer);
  queryClient.invalidateQueries('timers-list');
  queryClient.invalidateQueries('tasks-list');
  // queryClient.invalidateQueries('task-details');
  emit('modalClose');
}
async function handleDropdownChange(val: any, name: string) {
  if (name === 'clientId') {
    selectedClientId.value = val.clientId;
    selectProjectId.value = undefined;
    setFormValues();
  }
  else if (name === 'projectId') {
    selectProjectId.value = val.projectId;
    setFormValues();
  }
}

onMounted(() => {
  if (formRef.value) {
    setFormValues();
  }
});
</script>

<template>
  <CommonSchemaForm
    ref="formRef"
    :data="formData"
    :form-key="formKey"
    :primary-btn-loading="startIsLaoding"
    @secondary-btn-click="handleCancel"
    @submit="onSubmit"
    @dropdown-change="handleDropdownChange"
  />
</template>

<style lang="scss" scoped></style>
