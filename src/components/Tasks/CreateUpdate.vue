<script setup lang="ts">
import type {
  EntityType,
  Task,
  TaskUserAddPayload,
  TaskUserRemovePayload,
  UpdateTask,
  UpdateTaskPayload
} from '@/types/tasks.type';
import { taskCreateUpdateSchemaPayload } from '@/types/tasks.type';
import InputText from 'primevue/inputtext';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Editor from 'primevue/editor';
import MultiSelect from 'primevue/multiselect';

import CommonSchemaForm from '@/components/Common/SchemaForm.vue';
import type { ClientUser } from '@/types/client.type';
import type { FullNameObj } from '@/types/teams.type';
import type { SchemaForm, SchemaFormRef } from '@/types/schemaform.type';
import dayjs from 'dayjs';
import type { Ref } from 'vue';
import type { BillingType, Project } from '@/types/project.type';
import type { FileObject } from '@/types/common.type';
import FileUpload from 'primevue/fileupload';
import type { AttachmentResponse } from '@/types/attachment.type';

const props = defineProps<{
  entityType?: EntityType;
  taskId?: string;
  projectId?: string;
  disableAll?: boolean;
  hideButtons?: boolean;
  slideover?: boolean;
  project?: boolean;
  projectBilling?: BillingType;
  clientId?: string;
  refresh?: boolean;
  hideDescription?: boolean;
  isSupportTask?: boolean;
  firmSupportTask?: boolean;
  isTaskDetails?: boolean;
}>();

const emit = defineEmits(['close', 'taskDetails']);

const selectedClientId = ref<string>(props.clientId || '');
const formKey = ref(0);
const formValues = ref();
const clientId = ref(props.clientId) || ref('');
const taskCreateUpdateRef = ref<SchemaFormRef | null>(null);
const selectedAttachments = ref<File[]>();

defineExpose({ taskCreateUpdateRef });
const route = useRoute();
const { projectId: projectIdProp } = toRefs(props);
const queryClient = useQueryClient();
const { arrDiff, focusAndBlurInput } = useUtilityFns();
const { fullName } = useVueFilters();
const { isPortalUser } = useCurrentUserData();
const { onUpload, isSupportTask: isSupportTaskAttachment } = useAttachments();
isSupportTaskAttachment.value = true;
const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();

applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);

const { usersListOptions } = useUserListOptions(
  !isPortalUser.value,
  userFilters
);
const { initToast } = useToasts();
const { getClients, getEntityPriorityList, getEntityStatuses }
  = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
const { canDo } = usePermissions();

const dueDateChecker = computed(() => {
  return taskCreateUpdateRef.value?.schemaFormValues.dueDate;
});

const managerChecker = computed(() => {
  const assigneeUserId = Array.isArray(
    taskCreateUpdateRef.value?.schemaFormValues.assignees
  )
    ? taskCreateUpdateRef.value?.schemaFormValues.assignees[0]
    : taskCreateUpdateRef.value?.schemaFormValues.assignees;
  return assigneeUserId;
});

const {
  data: isAvailableCheckQuery,
  isLoading: checkingAvailability,
  isFetching: fetchingAvailability
} = useQuery(
  ['check-availability', dueDateChecker, managerChecker],
  async () =>
    checkAvailability({
      date: dueDateChecker.value as string,
      userId: managerChecker.value as string
    }),
  {
    enabled: !isPortalUser.value
  }
);

const initialFilters = computed(() => {
  if (selectedClientId.value) {
    applyFilter('Client', [selectedClientId.value]);
    return useEncodeFilterData(filterData);
  }
});

applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);

const { data: clientList,
  isLoading: loadingClients,
  isFetching: fetchingClients } = getClients(!isPortalUser.value, clientFilters);

const { data: clientTaskStatuses } = getEntityStatuses({
  key: 'client-entity-statuses',
  type: 'CLIENTTASK',
  isPortal: isPortalUser.value
});
const { data: clientTaskPriorites } = getEntityPriorityList({
  key: 'client-entity-priorities',
  type: 'CLIENTTASK',
  isPortal: isPortalUser.value
});

const { data: taskStatuses } = getEntityStatuses({
  key: 'task-entity-statuses',
  type: 'TASK',
  isPortal: isPortalUser.value
});
const { data: taskPriorites } = getEntityPriorityList({
  key: 'task-entity-priorities',
  type: 'TASK',
  isPortal: isPortalUser.value
});

const { data: taskDetails } = useQuery(
  ['task-details', props.taskId],
  async () =>
    useTask(
      props.taskId as string,
      props.entityType as EntityType,
      isPortalUser.value
    ),
  {
    enabled: !!props.taskId,
    onSuccess: (data) => {
      if (data) {
        emit('taskDetails', data);
        updateFieldProp('disabled', typeIndex, true);
        if (data.type === 'SUPPORTTASK') {
          updateFieldProp('disabled', clientIndex, true);
        }
        handleDropdownChange(data, 'type');
        if (data.clientId) {
          selectedClientId.value = data.clientId as string;
        }
      }
    }
  }
);

const { data: projectsList, isFetching: projectisLoading } = useQuery(
  ['project-client-list', selectedClientId, taskDetails],
  async () => {
    const data = await useProjectListV2({
      responseStatus:
        props.project || taskDetails.value?.status?.status === 3
          ? undefined
          : 'ScheduledAndActive',
      filters: initialFilters.value
    });
    return data.results;
  },
  {
    enabled: !isPortalUser.value
  }
);

const { data: clientUserList, isFetching: clientUserIsloading } = useQuery(
  ['client-users', selectedClientId, taskDetails],
  async () => {
    if (
      isPortalUser.value
      || !selectedClientId.value
      || (taskDetails.value && taskDetails.value?.type !== 'CLIENTTASK')
      || props.isSupportTask
    )
      return [];
    const users = await useClientUserList(selectedClientId.value as string);

    return users.map((el: ClientUser) => {
      return {
        name: fullName(el.user as FullNameObj),
        id: el.user.id
      };
    });
  },
  {
    enabled: !isPortalUser.value
  }
);

const { mutateAsync: addTaskUser } = useMutation(
  'addTaskUser',
  async ({ id, userType, clientId, userId }: TaskUserAddPayload) => {
    return useTaskUserAdd(
      { id, userType, clientId, userId },
      taskDetails.value?.type || (props.entityType as EntityType)
    );
  }
);

const { mutateAsync: removeTaskUser } = useMutation(
  'removeTaskUser',
  async (payload: TaskUserRemovePayload) => {
    return useTaskUserDelete(
      payload,
      taskDetails.value?.type || (props.entityType as EntityType)
    );
  }
);

const { mutateAsync: addAttachment } = useMutation(
  async ({
    payload,
    taskId
  }: {
    payload: { attachmentId: string };
    taskId: string;
  }) => {
    return useEntitiesAddAttachment(
      isPortalUser.value,
      taskId,
      props.isSupportTask ? 'SUPPORTTASK' : (props.entityType as EntityType),
      payload
    );
  }
);

async function makeParallelAddAttachmentReq(payloadArr: string[],
  taskId: string) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      await addAttachment({ payload: { attachmentId: item }, taskId });
    })
  );
}

const { mutateAsync: createTask, isLoading: createIsLoading } = useMutation(
  'createTask',
  async (payload: { data: UpdateTaskPayload }) => {
    return useTaskCreate(
      payload,
      (payload.data.type as EntityType) || (props.entityType as EntityType),
      isPortalUser.value
    );
  },
  {
    onSuccess: async (data) => {
      let attachments;
      if (selectedAttachments.value?.length) {
        attachments = (await onUpload({
          payload: {
            files: selectedAttachments.value as File[]
          }
        })) as { res: AttachmentResponse; file: File }[];
        await makeParallelAddAttachmentReq(
          attachments?.map(e => e.res.id),
          data.id
        );
      }
      initToast({
        actionType: 'Create',
        severity: 'success',
        summary: 'Success',
        detail: 'Task Created Successfully'
      });
      queryClient.invalidateQueries('tasks-list');
      emit('close');
    }
  }
);
const { mutateAsync: updateTask, isLoading: updateIsLoading } = useMutation(
  'updateTask',
  async ({ payload, id }: { payload: UpdateTask; id: string }) => {
    const { type, data: tempData } = payload;
    const { watchers, assignees, clientUsers } = tempData;
    const valuesToExtract = [
      'assignees',
      'clientId',
      'description',
      'dueDate',
      'entityPriority',
      'entityStatus',
      'estimatedTime',
      'isBillingEnabled',
      'isNotificationEnabled',
      'projectId',
      'startDate',
      'title',
      'watchers',
      'type'
    ];
    const data: { [key: string]: unknown } = {};
    for (const i in valuesToExtract) {
      data[valuesToExtract[i]] = tempData[valuesToExtract[i]];
    }
    const payloadData = {
      type,
      data
    } as UpdateTask;

    const addRemoveItem = (
      arr1: string[],
      arr2: string[],
      itemType: 'watchers' | 'assignees' | 'clientUsers'
    ) => {
      const itemsToRemove = arrDiff(arr1, arr2);
      const itemsToAdd = arrDiff(arr2, arr1);

      if (itemsToRemove.length > 0) {
        itemsToRemove.map(async (item) => {
          let payload: TaskUserRemovePayload;
          if (itemType === 'watchers') {
            payload = {
              id: props.taskId as string,
              watcherId: item
            };
            await removeTaskUser(payload);
          }
          if (itemType === 'assignees') {
            payload = {
              id: props.taskId as string,
              assigneeId: item
            };
            await removeTaskUser(payload);
          }
          if (itemType === 'clientUsers') {
            payload = {
              id: props.taskId as string,
              userId: item,
              clientId: props.clientId
            };
            await removeTaskUser(payload);
          }
        });
      }
      if (itemsToAdd.length > 0) {
        itemsToAdd.map(async (item) => {
          let payload: TaskUserAddPayload;
          if (itemType === 'watchers') {
            payload = {
              id: props.taskId as string,
              userId: item,
              userType: 'watcher'
            };
            await addTaskUser(payload);
          }
          if (itemType === 'assignees') {
            payload = {
              id: props.taskId as string,
              userId: item,
              userType: 'assignee'
            };
            await addTaskUser(payload);
          }
          if (itemType === 'clientUsers') {
            payload = {
              id: props.taskId as string,
              userId: item,
              clientId: props.clientId,
              userType: 'clientUser'
            };
            await addTaskUser(payload);
          }
        });
      }
    };

    if (watchers && watchers.length > 0) {
      addRemoveItem(
        watchers,
        taskDetails.value?.watchers as string[],
        'watchers'
      );
    }
    else
      addRemoveItem([], taskDetails.value?.watchers as string[], 'watchers');
    if (assignees && assignees.length > 0) {
      addRemoveItem(
        assignees as string[],
        taskDetails.value?.assignees !== undefined
          ? ([taskDetails.value?.assignees] as string[])
          : [],
        'assignees'
      );
    }
    else
      addRemoveItem(
        [],
        taskDetails.value?.assignees !== undefined
          ? ([taskDetails.value?.assignees] as string[])
          : [],
        'assignees'
      );
    if (clientUsers && clientUsers.length > 0) {
      addRemoveItem(
        clientUsers,
        (taskDetails.value?.clientUsers as string[]) || [],
        'clientUsers'
      );
    }
    else
      addRemoveItem(
        [],
        (taskDetails.value?.clientUsers as string[]) || [],
        'clientUsers'
      );

    return useTaskUpdate({
      payload: payloadData,
      entityType: payloadData.type as EntityType,
      id,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: async (data: Task) => {
      initToast({
        actionType: 'Update',
        severity: 'success',
        summary: 'Success',
        detail: 'Task Updated Successfully'
      });
      queryClient.invalidateQueries('timers-list');
      queryClient.invalidateQueries('tasks-list');
      queryClient.invalidateQueries('portal-dashboard-tasks');
      emit('close', data);
    }
  }
);

function setInitialValues() {
  if (props.taskId !== undefined && taskDetails.value !== undefined) {
    // formKey.value++;
    return {
      ...taskDetails.value,
      isClientTask: props.entityType === 'CLIENTTASK',
      firmSupportTask: props.firmSupportTask
    };
  }
  else {
    return {
      clientId: props.clientId,
      projectId: projectIdProp?.value,
      isBillingEnabled: props.projectBilling && props.projectBilling !== 'NONE',
      type: props.entityType || 'TASK',
      isClientTask: props.entityType === 'CLIENTTASK',
      firmSupportTask: props.firmSupportTask
    };
  }
}

const isClientTask = computed(() => {
  return (
    taskDetails.value?.type === 'CLIENTTASK'
    || props.entityType === 'CLIENTTASK'
  );
});

const firmSupportTask = computed(() => {
  return props.firmSupportTask;
});

const formData = computed<SchemaForm>(() => {
  return {
    fields: [
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'clientId',
        label: `${$tConfig('CLIENT')}`,
        placeholder: `Select ${$tConfig('CLIENT').toLowerCase()}`,
        optionLabel: 'name',
        optionValue: 'id',
        options: clientList.value || [],
        required: props.firmSupportTask,
        hide: !props.firmSupportTask,
        loading: loadingClients.value || fetchingClients.value
      },
      {
        as: InputText,
        name: 'name',
        label: 'Title',
        required: true,
        placeholder: 'Enter Title',
        disabled: props.disableAll,
        hide: props.slideover
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'type',
        label: 'Type',
        optionLabel: 'name',
        optionValue: 'value',
        placeholder: 'Select Type',
        formGridClass: 'md:col-6',
        disabled: props.disableAll || !!(props.project && props.taskId),
        options: props.clientId
          ? [
              { name: 'Team Task', value: 'TASK' },
              { name: 'Client Request', value: 'CLIENTTASK' }
            ]
          : [{ name: 'Task', value: 'TASK' }],
        hide: !props.project,
        filter: false
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'entityStatus',
        label: 'Status',
        optionLabel: 'name',
        optionValue: 'name',
        placeholder: 'Select Status',
        formGridClass: 'md:col-6',
        disabled: props.disableAll,
        filter: false,
        hide: (isPortalUser.value && props.isSupportTask) || props.firmSupportTask,
        options: taskStatuses.value
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'entityPriority',
        label: 'Priority',
        optionLabel: 'name',
        optionValue: 'name',
        placeholder: 'Select Priority',
        formGridClass: 'md:col-6',
        disabled: props.disableAll || isPortalUser.value,
        filter: false,
        hide: (isPortalUser.value && props.isSupportTask) || props.firmSupportTask,
        options: taskPriorites.value
      },
      {
        as: Calendar,
        type: 'calender',
        name: 'startDate',
        label: 'Start Date',
        placeholder: 'Select Start Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        disabled: props.disableAll,
        minDate: dayjs().toDate(),
        hide: (isPortalUser.value && props.isSupportTask) || props.firmSupportTask
      },
      {
        as: Calendar,
        type: 'calender',
        name: 'dueDate',
        label: 'Due Date',
        placeholder: 'Select Due Date',
        formGridClass: 'md:col-6',
        dateFormat: 'dd M yy',
        disabled: props.disableAll || isPortalUser.value,
        minDate: dayjs().toDate(),
        hide: (isPortalUser.value && props.isSupportTask) || props.firmSupportTask,
        note:
          !isPortalUser.value
          && !(checkingAvailability.value || fetchingAvailability.value)
          && !isAvailableCheckQuery.value
          && `<span class='text-orange-500'>Leaves/Holidays are conflicting with Task's Due date</span>`
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'clientId',
        label: `Assign to ${$tConfig('CLIENT')}`,
        optionLabel: 'name',
        optionValue: 'id',
        required: isClientTask.value,
        placeholder: `Select ${$tConfig('CLIENT')}`,
        formGridClass: !props.slideover ? 'md:col-6' : '',
        disabled:
           (props.disableAll
           || props.project
           || taskDetails.value?.status?.status === 3
           || props.isSupportTask),
        showClear: true,
        hide: isPortalUser.value || props.firmSupportTask,
        options: clientList.value
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'projectId',
        label: 'Assign to Project',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Project',
        formGridClass: !props.slideover ? 'md:col-6' : '',
        disabled:
          props.disableAll
          || props.project
          || taskDetails.value?.status?.status === 3,
        showClear: true,
        hide: isPortalUser.value || props.firmSupportTask,
        options: projectsList.value,
        loading: projectisLoading.value
      },
      {
        as: InputText,
        type: 'number',
        name: 'estimatedTime',
        label: 'Budget Time(In Minutes)',
        placeholder: 'Enter Bugdet Time',
        formGridClass: !props.slideover ? 'md:col-6' : '',
        disabled: props.disableAll,
        hide: isPortalUser.value || props.firmSupportTask
      },
      {
        as: Dropdown,
        type: 'dropdown',
        name: 'assignees',
        label: 'Assign to Team or Self',
        optionLabel: 'name',
        optionValue: 'id',
        placeholder: 'Select Assignees',
        formGridClass: !props.slideover ? 'md:col-6' : '',
        display: 'chip',
        disabled: props.disableAll,
        hide: isPortalUser.value || props.firmSupportTask,
        showClear: true,
        options: usersListOptions.value
      },

      {
        as: Checkbox,
        type: 'checkbox',
        name: 'isNotificationEnabled',
        label: 'Notification',
        direction: 'horizontal',
        formGridClass: !props.slideover ? 'md:col-3 flex align-items-end' : '',
        disabled: props.disableAll,
        hide: isPortalUser.value || props.firmSupportTask
      },
      {
        as: Checkbox,
        type: 'checkbox',
        name: 'isBillingEnabled',
        label: 'Billing',
        direction: 'horizontal',
        disabled: props.disableAll,
        formGridClass: !props.slideover ? 'md:col-3 flex align-items-end' : '',
        hide: isPortalUser.value || props.firmSupportTask
      },
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'watchers',
        label: 'Collaborators',
        placeholder: 'Select Collaborators',
        optionLabel: 'name',
        optionValue: 'id',
        formGridClass: !props.slideover ? 'custom-grid' : '',
        display: 'chip',
        disabled: props.disableAll,
        hide:
          !!projectIdProp?.value
          || (isPortalUser.value && props.isSupportTask)
          || isClientTask.value
          || props.firmSupportTask,
        options: usersListOptions.value
      },
      {
        as: MultiSelect,
        type: 'multiSelect',
        name: 'clientUsers',
        label: `${$tConfig('CLIENT')} Users`,
        placeholder: `Select a ${$tConfig('CLIENT').toLowerCase()} user`,
        optionLabel: 'name',
        optionValue: 'id',
        options: clientUserList.value,
        formGridClass: !props.slideover ? 'custom-grid' : '',
        display: 'chip',
        disabled: props.disableAll,
        hide: !isClientTask.value || isPortalUser.value,
        loading: clientUserIsloading.value
      },
      {
        as: Editor,
        type: 'editor',
        name: 'description',
        label: props.firmSupportTask ? 'Message' : `Description`,
        placeholder: 'Description',
        editorStyle: 'height: 160px',
        readonly: props.disableAll,
        formGridClass: 'mt-4',
        required: props.firmSupportTask,
        hide: props.hideDescription || false
      },
      {
        as: FileUpload,
        name: 'attachments',
        type: 'file',
        hide: !props.isSupportTask || props.taskId,
        label: 'Attachments',
        hideUploadBtn: true,
        multiple: true
      }
    ],
    validationSchema: taskCreateUpdateSchemaPayload,
    secondaryBtnText: 'Cancel',
    btnText: 'Submit',
    initialValues: setInitialValues(),
    hideButtons: isPortalUser.value
      ? false
      : props.hideButtons || !canDo('tasks', 'edit')
  } as SchemaForm;
});

function handleBack() {
  // if (!props.project) {
  //   router.push({ name: 'admin-tasks' });
  // }
  emit('close');
}

const {
  findFormIndex,
  updateOptions,
  updateFieldProp,
  updateStartDueDateValidation
} = useSchemaForm(formData);

const watchersIndex = findFormIndex('watchers');
const clientUserIndex = findFormIndex('clientUsers');
const statusIndex = findFormIndex('entityStatus');
const priorityIndex = findFormIndex('entityPriority');
const clientIndex = findFormIndex('clientId');
const assigneesIndex = findFormIndex('assignees');
const projectsIndex = findFormIndex('projectId');
const dueDateIndex = findFormIndex('dueDate');
const typeIndex = findFormIndex('type');

function handleDropdownChange(value: Record<string, unknown>,
  name?: string) {
  if (value) {
    formValues.value = { ...value };
    if (name === 'type') {
      if (value.type === 'TASK') {
        updateFieldProp('hide', clientUserIndex, true);
        updateFieldProp('hide', watchersIndex, false);
        updateOptions(usersListOptions, watchersIndex);
        useTimeoutFn(() => {
          focusAndBlurInput(
            taskCreateUpdateRef as unknown as Ref<SchemaFormRef>,
            'name'
          );
        }, 400);
      }
      if (value.type === 'CLIENTTASK') {
        updateFieldProp('hide', watchersIndex, true);
        if (!isPortalUser.value) {
          updateFieldProp('hide', clientUserIndex, false);
        }
        updateOptions(clientUserList, clientUserIndex);

        updateOptions(clientTaskStatuses, statusIndex);
        updateOptions(clientTaskPriorites, priorityIndex);
      }
    }
    if (value.clientId && name === 'clientId') {
      taskCreateUpdateRef.value?.setFieldValue('projectId', undefined);
      taskCreateUpdateRef.value?.setFieldValue('clientUsers', undefined);
      selectedClientId.value = value.clientId as string;
    }
    if (value.projectId && name === 'projectId') {
      const selectedProjectForClient = projectsList.value?.filter(
        val => val.id === value.projectId
      ) as Project[];
      if (selectedProjectForClient[0].client) {
        const clientId = selectedProjectForClient[0].client.id;
        taskCreateUpdateRef.value?.setFieldValue('clientId', clientId);
      }
      else {
        taskCreateUpdateRef.value?.setFieldValue('clientId', undefined);
      }
    }
  }
}

function handelCalendar(val: Record<string, unknown>, field: string) {
  if (val.startDate) {
    updateStartDueDateValidation(
      val,
      taskCreateUpdateRef as unknown as Ref<SchemaFormRef>
    );
    if (!props.disableAll) {
      updateFieldProp('disabled', dueDateIndex, false);
    }
  }
}

watchEffect(async () => {
  if (taskDetails.value) {
    formData.value.initialValues = setInitialValues();
    if (props.slideover) {
      formKey.value++;
    }
  }
});

async function onSubmit(values: Record<string, unknown>) {
  const payload = values as UpdateTaskPayload;
  payload.type = props.isSupportTask
    ? 'SUPPORTTASK'
    : props.project || props.clientId
      ? payload.type
      : props.entityType || 'TASK';
  if (projectIdProp?.value) {
    payload.projectId = projectIdProp.value as string;
  }

  payload.title = payload.name as string;

  delete payload.name;
  payload.description = {
    content: (payload.description as unknown as string) || ''
  };

  if (payload.isNotificationEnabled !== undefined) {
    payload.isNotificationEnabled = payload.isNotificationEnabled.toString();
  }
  else payload.isNotificationEnabled = 'false';
  if (payload.isBillingEnabled) {
    payload.isBillingEnabled = payload.isBillingEnabled.toString();
  }
  else payload.isBillingEnabled = 'false';

  if (payload.estimatedTime) {
    payload.estimatedTime = +payload.estimatedTime;
  }
  if (payload.assignees) {
    payload.assignees = [payload.assignees] as any;
  }
  else {
    payload.assignees = [];
  }

  if (props.taskId) {
    await updateTask({
      payload: {
        data: payload,
        type: props.isSupportTask
          ? 'SUPPORTTASK'
          : props.project || props.clientId
            ? payload.type
            : 'TASK'
      },
      id: props.taskId as string
    });
    emit('close');
  }
  else {
    await createTask({ data: payload } as unknown as {
      data: UpdateTaskPayload;
    });
    emit('close');
  }
}

function handleFileUpload(files: FileObject) {
  selectedAttachments.value = files.files as File[];
}
</script>

<template>
  <CommonLoading v-if="!(!props.taskId || taskDetails)" class="my-4" />
  <CommonSchemaForm
    v-else
    ref="taskCreateUpdateRef"
    :key="formKey"
    :data="formData"
    :button-wrapper-class="
      isTaskDetails ? 'bg-white absolute bottom-0 z-1 p-3' : ''
    "
    :primary-btn-loading="createIsLoading || updateIsLoading"
    @submit="onSubmit"
    @secondary-btn-click="handleBack()"
    @dropdown-change="handleDropdownChange"
    @calendar-input="handelCalendar"
    @file-select="handleFileUpload"
  />
</template>
