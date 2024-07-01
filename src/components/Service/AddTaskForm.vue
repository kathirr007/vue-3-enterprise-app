<script setup lang="ts">
import type {
  CreateTaskTemplatePayload,
  TaskTemplate,
  TaskTemplatePayload
} from '@/types/task-template.type';
import { CreateTaskTemplateSchema } from '@/types/task-template.type';

import type { Ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { AxiosError } from 'axios';
import { useServiceDetails } from '@/composables/service';
import { useTaskTemplateList } from '@/composables/task-template';
import type { Service } from '@/types/service.type';
import type { Attachment, AttachmentResponse } from '@/types/attachment.type';
import type { APIActions } from '@/types/common.type';

interface EmptyTask {
  title: string;
  entityType: string;
  description?: string;
  estimatedTime?: number;
  enableNotifications?: boolean;
  enableBilling?: boolean;
  error?: string;
  attachmentIds?: string[];
  attachments?: Attachment[];
  dueInDays?: number;
  order?: number;
}

type TaskType = 'clientTask' | 'teamTask';

const props = defineProps<{
  back?: boolean;
  emitPayload?: boolean;
  taskTemplates?: TaskTemplate[];
  apiKey?: number;
  template?: boolean;
  loading?: boolean;
  revisit?: boolean;
}>();

const emit = defineEmits<{
  (event: 'back'): void;
  (event: 'skip'): void;
  (event: 'task', ...args: any[]): void;
}>();

const commonTaskEntities = {
  title: '',
  description: '',
  enableBilling: false,
  enableNotifications: false,
  error: '',
  attachmentIds: [],
  attachments: []
};

const emptyTeamTask: EmptyTask = {
  ...commonTaskEntities,
  estimatedTime: 0,
  dueInDays: 0,
  entityType: 'TASK'
};

const emptyClientTask: EmptyTask = {
  ...commonTaskEntities,
  dueInDays: 0,
  entityType: 'CLIENTTASK'
};
const failedRecords = ref<EmptyTask[]>([]);
const successRecords = ref<EmptyTask[]>([]);
const selectedTaskToRemove = ref<EmptyTask>();
const selectedFieldToRemove = ref<{ taskType: string; fieldId: number }>();
const confirmRemoveTaskDialog = ref(false);
const attachmentToRemove = ref<
  Pick<Attachment, 'id' | 'name'> & { index: number; taskType: TaskType }
>();
const confirmRemoveAttachmentDialog = ref(false);
const attachmentsListDialog = ref(false);
const taskAttachmentsList = ref<Pick<Attachment, 'id' | 'name' | 'path'>[]>([]);
const currentAttachmentRef = ref<{
  index: number;
  taskType: TaskType;
  isUpdate?: boolean;
}>();

const router = useRouter();
const route = useRoute();
const { defaultBreakpoints, isMedium } = useCommonBreakPoints();
const { convertMinsToHrsMins } = useVueFilters();
const { filterObjArrByKeyValue, objectArrSumTotal, sortCompare }
  = useUtilityFns();
const { showToast, initToast } = useToasts();
// const serviceId = useRouteQuery<string>('serviceId');
const serviceId = ref(route.params.id as string);
const queryClient = useQueryClient();
const { getAttachmentUrl, getAttachment } = useAttachments();
const { handleSubmit, meta, values, errors, setValues, validate } = useForm({
  validationSchema: CreateTaskTemplateSchema,
  initialTouched: {
    clientTasks: false,
    teamTasks: false
  },
  validateOnMount: false,
  initialValues: {
    teamTasks: [{ ...emptyTeamTask }],
    clientTasks: [{ ...emptyClientTask }]
  }
});
const { canDo } = usePermissions();

const submittingForm = computed(
  () =>
    props.loading
    || creatingTaskTemplate.value
    || updatingTaskTemplate.value
    || removingTaskTemplate.value
    || createUpdateServiceLoading.value
);

const {
  remove: removeFromTeamTask,
  push: pushToTeamTask,
  fields: teamTaskFields,
  update: updateTeamTask,
  replace: replaceTeamTasks
} = useFieldArray('teamTasks');

const {
  remove: removeFromClientTask,
  push: pushToClientTask,
  fields: clientTaskFields,
  update: updateClientTask,
  replace: replaceClientTasks
} = useFieldArray('clientTasks');

const estimatedTaskDurations = computed(() => {
  // if (values.teamTasks) {
  // }
  // return 0;
  const allTasks = [...(values.teamTasks || [])];
  return objectArrSumTotal(allTasks, 'estimatedTime');
});

const showSubmitTooltip = computed(() => {
  return props.back && meta.value.valid;
});

function showAttachmentToast(actionType: APIActions) {
  initToast({
    actionType,
    summary: `Task template attachment ${actionType.toLowerCase()}`,
    detail: `Task template attachment ${actionType.toLowerCase()}d successfully`
  });
}

function removeFieldError(field: Ref<EmptyTask>): void {
  if (field.value.error !== '') {
    field.value.error = '';
  }
}

function pushTask(taskType: TaskType, data?: EmptyTask) {
  if (taskType === 'teamTask') {
    pushToTeamTask(data || emptyTeamTask);
  }
  else {
    pushToClientTask(data || emptyClientTask);
  }
  validate({ mode: 'silent' });
}

function updateTasks(taskType: TaskType, data?: EmptyTask[]) {
  if (taskType === 'teamTask') {
    return replaceTeamTasks(data as EmptyTask[]);
  }
  if (taskType === 'clientTask') {
    return replaceClientTasks(data as EmptyTask[]);
  }
}

async function updateAttachment(index: number,
  taskType: TaskType,
  isUpdate: boolean,
  attachments: AttachmentResponse[],
  isRemoveAttachment?: boolean,
  removeId?: string) {
  if (isUpdate) {
    await addTaskAttachment({
      serviceId: serviceId.value as string,
      id: (values[`${taskType}s`][index] as TaskTemplatePayload).id,
      payload: { attachmentId: attachments[0].id }
    });
    initToast({
      actionType: 'Update',
      summary: 'Task Attachment',
      detail: `Attachment attached to task template successfully`
    });
  }
  else {
    const prevIds
      = (values[`${taskType}s`][index].attachmentIds as string[]) || [];
    const prevAttachments
      = (values[`${taskType}s`][index].attachments as Pick<
        Attachment,
        'id' | 'name'
      >[]) || [];

    values[`${taskType}s`][index].attachmentIds = isRemoveAttachment
      ? prevIds.filter((id: string) => id !== removeId)
      : [...prevIds, ...attachments.map(attachment => attachment.id)];

    values[`${taskType}s`][index].attachments = isRemoveAttachment
      ? (prevAttachments.filter(
          attachment => attachment.id !== removeId
        ) as Attachment[])
      : ([
          ...prevAttachments,
          ...(await Promise.all(
            attachments.map(async (attachment) => {
              const { id, name, path } = (await getAttachment(
                attachment.id
              )) as Attachment;
              return { id, name, path };
            })
          ))
        ] as Attachment[]);

    initToast({
      actionType: 'Update',
      title: 'File Upload',
      summary: 'Task Attachment',
      detail: `Total <strong>${
        (values[`${taskType}s`][index].attachmentIds as string[]).length
      }</strong> Attachment${
        (values[`${taskType}s`][index].attachmentIds as string[]).length > 1
          ? 's'
          : ''
      } ready to attach to task template`
    });
  }
}

function removeTaskFromFieldArray() {
  selectedFieldToRemove.value?.taskType === 'teamTask'
    ? removeFromTeamTask(selectedFieldToRemove.value?.fieldId as number)
    : removeFromClientTask(selectedFieldToRemove.value?.fieldId as number);
}

function removeTask(fieldId: number, taskType: string) {
  selectedTaskToRemove.value = (values as CreateTaskTemplatePayload)[
    `${taskType}s`
  ][fieldId];
  selectedFieldToRemove.value = { fieldId, taskType };
  if ((selectedTaskToRemove.value as TaskTemplate)?.id) {
    confirmRemoveTaskDialog.value = true;
  }
  else {
    removeTaskFromFieldArray();
  }
}

function showAttachments(data: {
  actionType: 'show' | 'hide';
  attachments?: Pick<Attachment, 'id' | 'name'>[];
  idx?: number;
  taskType?: TaskType;
}) {
  taskAttachmentsList.value = data.attachments as Pick<
    Attachment,
    'name' | 'id' | 'path'
  >[];
  currentAttachmentRef.value = {
    index: data.idx as number,
    taskType: data.taskType as TaskType
  };

  attachmentsListDialog.value = true;
}

function prepareRemoveTaskAttachment(index: number,
  taskType: TaskType,
  data: Pick<Attachment, 'id' | 'name'>) {
  attachmentToRemove.value = { ...data, index, taskType };
  confirmRemoveAttachmentDialog.value = true;
}

const { data: serviceDetails } = useQuery('service-details', () => {
  if (!serviceId.value)
    return;
  return useServiceDetails(serviceId.value as string);
});

const { data: taskTemplates } = useQuery(
  ['task-templates', props.taskTemplates],
  () => {
    if (props.taskTemplates)
      return props.taskTemplates;
    if (!serviceId.value)
      return;
    return useTaskTemplateList(serviceId.value as string);
  },
  {
    onSuccess: async (data: TaskTemplate[]) => {
      if (data) {
        filterTaskTemplates(data);
      }
    }
  }
);

const { mutateAsync: addTaskAttachment } = useMutation(
  async ({
    serviceId,
    id,
    payload
  }: {
    serviceId: string;
    id: string;
    payload: { attachmentId: string };
  }) => {
    return useTaskTemplateAddAttachment({
      serviceId,
      id,
      payload: { attachmentId: payload.attachmentId }
    });
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries('task-templates');
      showAttachmentToast('Update');
    }
  }
);

const { mutateAsync: removeTaskAttachment } = useMutation(
  async ({
    serviceId,
    id,
    attachmentId
  }: {
    serviceId: string;
    id: string;
    attachmentId: string;
  }) => {
    return useTaskTemplateRemoveAttachment({ serviceId, id, attachmentId });
  },
  {
    onSuccess: () => {
      queryClient.invalidateQueries('task-templates');
      showAttachmentToast('Delete');
    }
  }
);

const { isLoading: creatingTaskTemplate, mutateAsync: createTaskTemplate }
  = useMutation(
    ({
      serviceId,
      payload
    }: {
      serviceId: string;
      payload: TaskTemplatePayload;
    }) => {
      return useTaskTemplateCreate({ serviceId, payload });
    },
    {
      onSuccess: async (data: TaskTemplate, variables) => {
        successRecords.value?.push({
          ...variables.payload,
          error: ''
        } as EmptyTask);
      },
      onError: (err: { err: AxiosError; message: string }, variables) => {
        failedRecords.value?.push({
          ...variables.payload,
          error: err.message
        } as EmptyTask);
      }
    }
  );

const { mutateAsync: removeTaskTemplate, isLoading: removingTaskTemplate }
  = useMutation(({ serviceId, id }: { serviceId: string; id: string }) => {
    return useTaskTemplateRemove(serviceId, id);
  });

const { mutateAsync: updateTaskTemplate, isLoading: updatingTaskTemplate }
  = useMutation(
    ({
      serviceId,
      id,
      payload
    }: {
      serviceId: string;
      id: string;
      payload: TaskTemplatePayload;
    }) => {
      return useTaskTemplateUpdate({ serviceId, id, payload });
    },
    {
      onSuccess: async (data: TaskTemplate, variables) => {
        successRecords.value?.push({
          ...variables.payload,
          error: ''
        } as EmptyTask);
      },
      onError: (err: { err: AxiosError; message: string }, variables) => {
        failedRecords.value?.push({
          ...variables.payload,
          error: err.message
        } as EmptyTask);
      }
    }
  );

const {
  mutateAsync: createUpdateService,
  isLoading: createUpdateServiceLoading
} = useMutation(
  (payload: Partial<Service>) => {
    return useServiceUpdate(serviceDetails.value?.id as string, payload);
  },
  {
    onSuccess(data: Service | undefined) {
      initToast({
        actionType: serviceDetails.value ? 'Update' : 'Create',
        title: 'Project Template',
        actionObj: data as unknown as Record<string, unknown>
      });
    }
  }
);

function filterTaskTemplates(data: TaskTemplate[]) {
  const teamTasks = filterObjArrByKeyValue(data, 'entityType', 'TASK').sort(
    sortCompare({ compareProp: 'order' })
  );
  const clientTasks = filterObjArrByKeyValue(
    data,
    'entityType',
    'CLIENTTASK'
  ).sort(sortCompare({ compareProp: 'order' }));
  const hasTeamTask = teamTasks.length > 0;
  const hasClientTask = clientTasks.length > 0;
  setValues({
    teamTasks: hasTeamTask
      ? [...teamTasks]
      : [...teamTasks, { ...emptyTeamTask }],
    clientTasks: hasClientTask
      ? [...clientTasks]
      : [...clientTasks, { ...emptyClientTask }]
  });
}

async function makeParallelAPIReq(payloadArr: Record<string, unknown>[]) {
  if (payloadArr.length === 0) {
    return;
  }
  await Promise.allSettled(
    payloadArr.map(async (item) => {
      const { error, attachments, attachmentIds, ...rest } = item;
      const payload = {
        ...rest,
        attachments: attachmentIds
      } as unknown as TaskTemplatePayload;
      payload.id
        ? await updateTaskTemplate({
          serviceId: serviceId.value as string,
          id: payload.id as string,
          payload
        })
        : await createTaskTemplate({
          serviceId: serviceId.value as string,
          payload
        });
    })
  );
}

const onSubmit = handleSubmit(async (formValues) => {
  const teamTasks = formValues.teamTasks.map((task, index: number) => ({
    ...task,
    order: task.order || index + 1,
    description: { content: task.description || '' }
  }));
  const clientTasks = formValues.clientTasks.map((task, index: number) => ({
    ...task,
    order: task.order || index + 1,
    description: { content: task.description || '' }
  }));
  let payload = [...clientTasks, ...teamTasks];
  payload = payload.filter(item => item.title !== '');
  // payload = payload.map((item: EmptyTask) => {
  //   const { attachmentIds, attachments, ...rest } = item;
  //   return { ...rest, attachments: attachmentIds };
  // }) as unknown as TaskTemplatePayload;
  const servicePayload = {
    id: serviceDetails.value?.id,
    name: serviceDetails.value?.name,
    billingType: serviceDetails.value?.billingType,
    estimatedTime: `${estimatedTaskDurations.value}`
  };

  if (props.emitPayload && !props.revisit) {
    emit('task', payload);
    return;
  }
  await makeParallelAPIReq(payload);

  await createUpdateService(servicePayload);
  queryClient.invalidateQueries('task-templates');

  if (successRecords.value.length > 0) {
    await showToast({
      severity: 'success',
      summary: 'Create Project Template Task',
      detail: `Total of <strong>${successRecords.value.length}</strong> ${
        successRecords.value.length > 1 ? 'Tasks are' : 'Task is'
      } successfully created.`
    });
    successRecords.value = [];
    queryClient.invalidateQueries(`service-details`);
    // if (!failedRecords.value.length) {
    //   resetForm();
    // }
  }

  if (failedRecords.value.length > 0) {
    const allTasks = [...failedRecords.value, ...successRecords.value];
    const teamTasks = allTasks.filter(t => t.entityType === 'TASK');
    const clientTasks = allTasks.filter(t => t.entityType === 'CLIENTTASK');
    await showToast({
      severity: 'error',
      summary: 'Create Task Template',
      detail: `Total of <strong>${failedRecords.value.length}</strong> ${
        failedRecords.value.length > 1 ? 'records are' : 'record'
      } failed to create task template.`
    });
    await setValues({
      teamTasks: [...teamTasks],
      clientTasks: [...clientTasks]
    });
    failedRecords.value = [];
    successRecords.value = [];
  }
  if (props.revisit)
    router.push({ name: 'admin-services' });
});

async function confirmRemoveTask(val?: Record<string, any>) {
  await removeTaskTemplate({
    serviceId: serviceId.value as string,
    id: val?.id as string
  });

  // queryClient.invalidateQueries('task-templates');
  removeTaskFromFieldArray();
  initToast({
    actionType: 'Delete',
    title: 'Task Template',
    actionObj: selectedTaskToRemove.value
  });
}

async function handleRemoveTaskAttachment(index: number,
  taskType: TaskType,
  attachmentId: string) {
  if ((values[`${taskType}s`][index] as TaskTemplatePayload).id) {
    await removeTaskAttachment({
      serviceId: serviceId.value as string,
      id: (values[`${taskType}s`][index] as TaskTemplatePayload).id,
      attachmentId
    });
  }
  const attachmentIndex = taskAttachmentsList.value.findIndex(
    item => item.id === attachmentId
  );
  if (attachmentIndex !== -1) {
    taskAttachmentsList.value.splice(attachmentIndex, 1);
    updateAttachment(
      index,
      taskType,
      !!(values[`${taskType}s`][index] as TaskTemplatePayload).id,
      taskAttachmentsList.value as unknown as AttachmentResponse[],
      true,
      attachmentId
    );
  }
}

function handleRemoveAttachment(id: string) {
  handleRemoveTaskAttachment(
    attachmentToRemove.value?.index as number,
    attachmentToRemove.value?.taskType as TaskType,
    id
  );
}

watch(
  () => props.apiKey,
  (newVal, oldVal) => {
    if (oldVal !== newVal) {
      queryClient.invalidateQueries('task-templates');
    }
  }
);

watch(
  () => props.taskTemplates,
  (val) => {
    if (val) {
      filterTaskTemplates(val);
    }
  },
  {
    deep: true
  }
);

const reRenderKey = ref(0);
function updateRenderKey(val: number) {
  reRenderKey.value = val;
}
</script>

<template>
  <form v-bind="$attrs" @submit="onSubmit">
    <div class="grid px-3">
      <div class="col-12">
        <h4 class="text-lg">
          Team Task
        </h4>
        <!-- <ServiceTaskNotes /> -->

        <ServiceAddTaskTable
          :key="`teamTask_${reRenderKey}`"
          :fields="teamTaskFields"
          :values="values"
          :errors="errors"
          task-type="teamTask"
          :current-service="serviceDetails"
          class="border-1 border-round default-border-color"
          @remove-field-error="removeFieldError"
          @push-task="pushTask"
          @remove-task="removeTask"
          @update-attachment="updateAttachment"
          @remove-attachment="prepareRemoveTaskAttachment"
          @show-attachments="showAttachments"
          @update-render-key="updateRenderKey"
        />
        <!-- <ServiceDraggableTableExample /> -->
      </div>
      <div class="col-12">
        <h4 class="text-lg">
          Client Request
        </h4>
        <!-- <ServiceTaskNotes /> -->

        <ServiceAddTaskTable
          :key="`clientTask_${reRenderKey}`"
          :fields="clientTaskFields"
          :values="values"
          :errors="errors"
          task-type="clientTask"
          :current-service="serviceDetails"
          @remove-field-error="removeFieldError"
          @push-task="pushTask"
          @remove-task="removeTask"
          @update-attachment="updateAttachment"
          @remove-attachment="prepareRemoveTaskAttachment"
          @show-attachments="showAttachments"
        />
      </div>
    </div>
    <div v-if="!props.back" class="flex align-items-center px-3 pt-3">
      <i class="pi pi-clock text-5xl" />
      <div class="p-inputtext p-component ml-2 px-3">
        Budgeted Time Required
        <strong class="text-lg">{{
          convertMinsToHrsMins(estimatedTaskDurations)
        }}</strong>
        to Complete
        <strong>{{ serviceDetails?.name }}</strong>
      </div>
    </div>

    <div class="flex justify-content-between mt-4">
      <Button
        v-if="props.back"
        label="Back"
        icon="pi pi-chevron-left"
        class="p-button-text"
        @click="emit('back')"
      />
      <div v-if="canDo('services', 'edit')" class="space-x-2.5 ml-auto">
        <Button
          v-if="props.back && !props.template"
          v-tooltip.bottom="
            !revisit ? 'Create Project Template without Task templates' : ''
          "
          label="Skip"
          :loading="loading"
          @click="emit('skip')"
        />
        <span
          v-tooltip.bottom="{
            value: 'Create Project Template with minimum 1 Team task template',
            disabled: showSubmitTooltip,
          }"
          class="inline-block"
        >
          <Button
            label="Submit"
            :disabled="!meta.valid"
            :loading="submittingForm"
            type="submit"
          />
        </span>
      </div>
    </div>
  </form>
  <Dialog
    v-model:visible="attachmentsListDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="taskAttachmentsList = []"
  >
    <ol
      v-if="taskAttachmentsList.length"
      class="project-clients-list pl-3 p-0 m-0 formgrid"
    >
      <li
        v-for="(item, index) in taskAttachmentsList"
        :key="index"
        class="col py-1"
      >
        <div class="flex">
          <a
            :href="getAttachmentUrl(item.path)"
            target="_blank"
            class="flex flex-1 align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
          >
            {{ item.name }}
          </a>
          <Button
            type="button"
            icon="pi pi-trash"
            aria-label="remove-attachment"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="
              prepareRemoveTaskAttachment(
                currentAttachmentRef?.index as number,
                currentAttachmentRef?.taskType as TaskType,
                item,
              )
            "
          />
        </div>
      </li>
    </ol>
    <template v-else>
      No attachments available
    </template>
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="selectedTaskToRemove && confirmRemoveTaskDialog"
    :visible="confirmRemoveTaskDialog"
    :record-to-remove="(selectedTaskToRemove as Record<string, any>)"
    title="Confirm Delete Task Template"
    @confirm="confirmRemoveTask"
    @hide="confirmRemoveTaskDialog = false"
  />
  <CommonConfirmRemoveDialog
    v-if="attachmentToRemove && confirmRemoveAttachmentDialog"
    :visible="confirmRemoveAttachmentDialog"
    :record-to-remove="{ name: attachmentToRemove.name }"
    title="Confirm Delete Attachment"
    @confirm="handleRemoveAttachment(attachmentToRemove?.id as string)"
    @hide="confirmRemoveAttachmentDialog = false"
  />
</template>
