<script setup lang="ts">
import type { APIActions, MetaObj } from '@/types/common.type';
import type { Project } from '@/types/project.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import type { Task } from '@/types/tasks.type';
import { type Timelog, type TimelogCreateInput, TimelogCreateInputSchema, TimelogUpdateInputSchema } from '@/types/timelog.type';
import type { TimerObj } from '@/types/timer.type';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import RadioButton from 'primevue/radiobutton';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  timelog?: TimerObj;
}>();

const emit = defineEmits<{
  (e: 'success', data: Timelog): void;
  (e: 'update', data: Timelog): void;
  (e: 'modalClose'): void;
}>();

const taskCreationOptions = [
  { name: 'manual', value: 'manual', radioLabel: 'Create Task' },
  { name: 'existing', value: 'existing', radioLabel: 'Connect to Existing Task' }
];

const queryClient = useQueryClient();
const { getClients } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
const { metaFilter } = useUtilityFns();
const { initToast } = useToasts();
const { createOne: createTimelog, update: updateTimelog } = useTimelog();

const formKey = ref(0);
const formRef = ref<SchemaFormRef>();
const selectedClientId = ref();
const selectProjectId = ref();
const projectListData = ref<Project[]>();
const taskOptions = ref<{ id: string; title: string }[]>([]);
const isTaskHidden = ref(true);
const selectedRadioValue = ref('manual');

function showToast(type: APIActions, data: Timelog) {
  initToast({
    actionType: type,
    title: 'Time Log',
    actionObj: data
  });
}

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
    projectId: selectProjectId.value || undefined,
    entityId: undefined
  });
}

const { data: projectDetails } = useQuery(
  ['project-details', selectProjectId],
  () => {
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

const { mutateAsync: createUpdateTimelog, isLoading } = useMutation(
  (payload: TimelogCreateInput) => {
    if (props.timelog) {
      return updateTimelog(props.timelog.id, payload);
    }
    return createTimelog(payload);
  },
  {
    onSuccess: (data) => {
      if (props.timelog) {
        showToast('Update', data);
      }
      else {
        showToast('Create', data);
      }
      emit('success', data);
      queryClient.invalidateQueries('completed-timers-list');
    }
  }
);

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

function setInitialValues() {
  return props.timelog
    ? {
        ...props.timelog,
        clientId: props.timelog.entity.client ? props.timelog.entity.client.id : undefined,
        timeSpent: props.timelog.activities[0].timespent
      }
    : {
        type: 'manual'
      };
}

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
        loading: loadingClients.value || fetchingClients.value,
        disabled: !!props.timelog?.entity.client
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
        loading: loadingProjects.value || fetchingProjects.value,
        hide: props.timelog
      },
      {
        as: RadioButton,
        type: 'radio',
        label: 'Do you want to Connect Existing Task or Create Manually?',
        name: 'type',
        options: taskCreationOptions,
        hide: props.timelog
      },
      {
        as: InputText,
        type: 'text',
        label: 'Task Title',
        name: 'taskTitle',
        placeholder: 'Title',
        required: true,
        hide: !isTaskHidden.value || props.timelog
      },
      {
        type: 'dropdown',
        as: Dropdown,
        name: 'entityId',
        label: `Task `,
        autocomplete: 'off',
        required: true,
        optionLabel: 'title',
        optionValue: 'id',
        placeholder: 'Select Task',
        formGridClass: 'md:col-12 ',
        options: taskOptions.value || [],
        loading: loadingTasks.value || fetchingTasks.value,
        hide: isTaskHidden.value || props.timelog
      },
      {
        as: InputNumber,
        type: 'input-number',
        name: 'timeSpent',
        label: 'Duration(In Minutes)',
        placeholder: 'Duration',
        required: true
      }
    ],
    validationSchema: props.timelog ? TimelogUpdateInputSchema : TimelogCreateInputSchema,
    initialValues: setInitialValues(),
    btnText: props.timelog ? 'Update' : 'Create',
    secondaryBtnText: 'Cancel'
  } as SchemaForm;
});

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

async function onSubmit(values: Record<string, any>) {
  const { taskTitle, entityId, timeSpent, clientId, type } = values;
  await createUpdateTimelog({
    taskTitle,
    entityId,
    timeSpent,
    clientId,
    type
  });
}

async function handleRadioClick(val: any) {
  const radioValue = { ...val }.type;
  selectedRadioValue.value = radioValue;
  if (radioValue === 'existing') {
    isTaskHidden.value = false;
  }
  else {
    isTaskHidden.value = true;
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
    :primary-btn-loading="isLoading"
    @secondary-btn-click="emit('modalClose')"
    @submit="onSubmit"
    @dropdown-change="handleDropdownChange"
    @radio-click="(() => handleRadioClick)()"
  />
</template>

<style lang="scss" scoped></style>
