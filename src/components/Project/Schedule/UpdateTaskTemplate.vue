<script setup lang="ts">
import InputText from 'primevue/inputtext';
import { useQueryClient } from 'vue-query';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Editor from 'primevue/editor';
import MultiSelect from 'primevue/multiselect';
import CommonSchemaForm from '@/components/Common/SchemaForm.vue';
import type { Project } from '@/types/project.type';
import { UnScheduledProjectEntityPayloadSchema } from '@/types/project.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import dayjs from 'dayjs';
import type { Ref } from 'vue';
import type { User } from '@/types/teams.type';
import type { ContentJSON } from '@/types/common.type';

const props = defineProps<{
  projectDetails: Project;
  clientsSelected?: Record<string, any>;
  taskId?: string;
  serviceId?: string;
  formValues?: Record<string, any>;
  isProjectCreate?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', formValues: Record<string, any>): void;
  (e: 'modalClose'): void;
}>();
const formKey = ref(0);
const taskCreateUpdate = ref<SchemaFormRef | null>(null);

const clientSelectedText = computed(() => {
  if (props.clientsSelected) {
    if (
      Array.isArray(props.clientsSelected)
      && props.clientsSelected.length === 1
    ) {
      return `${props.clientsSelected[0].name} selected`;
    }
    if (
      Array.isArray(props.clientsSelected)
      && props.clientsSelected.length > 1
    ) {
      return `${props.clientsSelected.length} ${pluralize($tConfig('CLIENT').toLowerCase())} selected`;
    }
  }
  return '';
});

const queryClient = useQueryClient();
const { pluralize } = useVueFilters();
const { getEntityPriorityList, getEntityStatuses, getClients }
  = useCommonListQueries();
const { isJsonStringValid } = useUtilityFns();

defineExpose({ taskCreateUpdate });

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const { data: clientsList, isLoading: gettingClients } = getClients(
  true,
  clientFilters
);

const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();
applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);

const { usersListOptions } = useUserListOptions(true, userFilters);

const { data: clientTaskStatuses } = getEntityStatuses({
  key: 'client-entity-statuses',
  type: 'CLIENTTASK'
});
const { data: clientTaskPriorites } = getEntityPriorityList({
  key: 'client-entity-priorities',
  type: 'CLIENTTASK'
});

const { data: taskStatuses } = getEntityStatuses({
  key: 'task-entity-statuses',
  type: 'TASK'
});
const { data: taskPriorites } = getEntityPriorityList({
  key: 'task-entity-priorities',
  type: 'TASK'
});

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: InputText,
        name: 'name',
        label: 'Title',
        required: true,
        placeholder: 'Enter Title'
      },
      {
        as: Dropdown,
        required: true,
        type: 'dropdown',
        name: 'type',
        label: 'Type',
        optionLabel: 'name',
        optionValue: 'value',
        placeholder: 'Select Type',
        formGridClass: 'md:col-6',
        disabled: !props.isProjectCreate,
        options: [
          { name: 'Team Task', value: 'TASK' },
          { name: 'Client Request', value: 'CLIENTTASK' }
        ]
      },
      {
        as: Dropdown,
        required: true,
        type: 'dropdown',
        name: 'entityStatus',
        label: 'Status',
        optionLabel: 'name',
        optionValue: 'name',
        placeholder: 'Select Status',
        formGridClass: 'md:col-6'
      },
      {
        as: Dropdown,
        required: true,
        type: 'dropdown',
        name: 'entityPriority',
        label: 'Priority',
        optionLabel: 'name',
        optionValue: 'name',
        placeholder: 'Select Priority',
        formGridClass: 'md:col-6'
      },
      {
        as: Calendar,
        required: true,
        type: 'calender',
        name: 'startDate',
        label: 'Start Date',
        placeholder: 'Select Start Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        minDate: dayjs().toDate()
      },
      {
        as: Calendar,
        required: true,
        type: 'calender',
        name: 'dueDate',
        label: 'Due Date',
        placeholder: 'Select Due Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        minDate: dayjs().toDate()
      },
      {
        as: InputText,
        name: 'estimatedTime',
        label: 'Budget Time(In Minutes)',
        placeholder: 'Enter Bugdet Time',
        formGridClass: 'md:col-6',
        type: 'input-number'
      },

      {
        as: MultiSelect,
        required: true,
        type: 'multiSelect',
        name: 'assignees',
        label: 'Assign to Team or Self',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Assignees',
        formGridClass: 'md:col-6',
        display: 'chip',
        selectionLimit: 1
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'clientId',
        label: `Assign to ${$tConfig('CLIENT')}`,
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: props.isProjectCreate
          ? `Select ${$tConfig('CLIENT')}`
          : clientSelectedText.value,
        formGridClass: 'md:col-6',
        disabled: true,
        options: clientsList.value,
        loading: gettingClients.value
      },
      {
        as: Checkbox,
        type: 'checkbox',
        name: 'isNotificationEnabled',
        label: 'Notification',
        direction: 'horizontal',
        formGridClass: 'md:col-3'
      },
      {
        as: Checkbox,
        type: 'checkbox',
        name: 'isBillingEnabled',
        label: 'Billing',
        direction: 'horizontal',
        formGridClass: 'md:col-3'
      },
      {
        as: Editor,
        type: 'editor',
        name: 'description',
        label: 'Description',
        placeholder: 'Description',
        editorStyle: 'height: 160px'
      }
    ],
    validationSchema: UnScheduledProjectEntityPayloadSchema,
    secondaryBtnText: 'Cancel',
    btnText: 'Submit',
    initialValues: props.formValues
      ? {
          ...props.formValues,
          isNotificationEnabled:
            props.formValues.isNotificationEnabled === 'true'
            || props.formValues.enableNotifications,
          isBillingEnabled:
            props.formValues.isBillingEnabled === 'true'
            || props.formValues.enableBilling,
          description: isJsonStringValid(props.formValues.description)
            ? JSON.parse(props.formValues.description as string)?.content
            : (props.formValues.description as unknown as ContentJSON)?.content
                ? (props.formValues.description as unknown as ContentJSON)?.content
                : props.formValues.description
        }
      : { type: 'TASK' }
  };
});

function handleBack() {
  emit('modalClose');
}

function handleTypeChange(value: Record<string, unknown>) {
  if (value) {
    if (value.type === 'TASK') {
      updateOptions(taskStatuses, statusIndex);
      updateOptions(taskPriorites, priorityIndex);
    }
    if (value.type === 'CLIENTTASK') {
      updateOptions(clientTaskStatuses, statusIndex);
      updateOptions(clientTaskPriorites, priorityIndex);
    }
  }
}

function handleDateChange(value: Record<string, unknown>) {
  if (value.startDate) {
    updateStartDueDateValidation(
      value,
      taskCreateUpdate as unknown as Ref<SchemaFormRef>
    );
    updateFieldProp(
      'minDate',
      dueDateIndex,
      dayjs(`${value.startDate}`).toDate()
    );
  }
}

const {
  findFormIndex,
  updateOptions,
  updateStartDueDateValidation,
  updateFieldProp
} = useSchemaForm(formData);

const statusIndex = findFormIndex('entityStatus');
const priorityIndex = findFormIndex('entityPriority');
const assigneesIndex = findFormIndex('assignees');
const watchersIndex = findFormIndex('watchers');
const startDateIndex = findFormIndex('startDate');
const dueDateIndex = findFormIndex('dueDate');

watchEffect(() => {
  if (taskStatuses.value) {
    updateOptions(taskStatuses, statusIndex);
  }

  if (taskPriorites.value) {
    updateOptions(taskPriorites, priorityIndex);
  }

  if (
    Array.isArray(props.clientsSelected)
    && props.clientsSelected.length > 1
  ) {
    updateFieldProp(
      'note',
      assigneesIndex,
      `This team member will be assigned to all the tasks for all <strong>${props.clientsSelected.length} ${pluralize($tConfig('CLIENT').toLowerCase())}</strong>. You can always re assign the team members even after scheduling the project. <a href="" class="text-red-400 underline">Know More</a>`
    );
  }
  if (usersListOptions.value) {
    updateOptions(usersListOptions, assigneesIndex);
    updateOptions(usersListOptions, watchersIndex);
  }
  if (props.projectDetails) {
    updateFieldProp(
      'minDate',
      startDateIndex,
      dayjs(`${props.projectDetails.startDate}`).toDate()
    );
    updateFieldProp(
      'minDate',
      dueDateIndex,
      dayjs(`${props.projectDetails.startDate}`).toDate()
    );
  }

  if (props.taskId) {
    queryClient.invalidateQueries('task-template-details');
  }
});

async function onSubmit(values: Record<string, unknown>) {
  const valuesToExtract = [
    ...Object.keys(UnScheduledProjectEntityPayloadSchema.fields)
  ];

  const taskEntity: { [key: string]: unknown } = {};

  for (const i in valuesToExtract) {
    taskEntity[valuesToExtract[i]] = values[valuesToExtract[i]];
  }

  taskEntity.title = values.name as string;

  taskEntity.entityType = values.type as string;

  // taskEntity.name;

  if (values.isNotificationEnabled) {
    taskEntity.isNotificationEnabled = `${values.isNotificationEnabled}`;
  }
  else {
    // delete taskEntity.isNotificationEnabled;
    taskEntity.isNotificationEnabled = 'false';
  }

  if (values.isBillingEnabled) {
    taskEntity.isBillingEnabled = `${values.isBillingEnabled}`;
  }
  else {
    // delete taskEntity.isBillingEnabled
    taskEntity.isBillingEnabled = 'false';
  }
  if (taskEntity.estimatedTime) {
    taskEntity.estimatedTime = Number(taskEntity.estimatedTime);
  }
  if (taskEntity.description) {
    taskEntity.description = { content: taskEntity.description };
  }
  let assigneeData = usersListOptions.value?.filter((user: User) => {
    return (values.assignees as string[])?.includes(user.id);
  });
  assigneeData = assigneeData?.map((user: User) => {
    return {
      ...user
    };
  });
  emit('submit', { ...taskEntity, id: props.taskId, assigneeData });
  emit('modalClose');
}
</script>

<template>
  <CommonSchemaForm
    ref="taskCreateUpdate"
    :key="formKey"
    :data="formData"
    @submit="onSubmit"
    @secondary-btn-click="handleBack()"
    @dropdown-change="handleTypeChange"
    @calendar-input="handleDateChange"
  />
</template>

<style lang="scss" scoped></style>
