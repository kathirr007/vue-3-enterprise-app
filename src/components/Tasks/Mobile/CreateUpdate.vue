<script setup lang="ts">
import type {
  EntityType,
  Task,
  TaskCreateUpdateSchemaPayload,
  TaskUserAddPayload,
  TaskUserRemovePayload,
  UpdateTask,
  UpdateTaskPayload
} from '@/types/tasks.type';
import { taskCreateUpdateSchemaPayload } from '@/types/tasks.type';
import { Field as VField } from 'vee-validate';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Editor from 'primevue/editor';
import type { EntityPriority, EntityStatus } from '@/types/status-entity.type';
import type { UploadFilesPayload } from '@/types/common.type';
import type { AttachmentResponse } from '@/types/attachment.type';
import dayjs from 'dayjs';

const props = defineProps<{
  entityType?: EntityType;
  taskId?: string;
  clientId?: string;
  task?: Task;
  isSupportTask?: boolean;
  firmSupportTask?: boolean;
}>();
const emit = defineEmits(['close']);
const selectedClientId = ref<string>();
const selectedAttachments = ref<File[]>();
const { initToast } = useToasts();
const { getClients, getEntityPriorityList, getEntityStatuses, getUsers }
  = useCommonListQueries();
const { arrDiff } = useUtilityFns();
const { isPortalUser } = useCurrentUserData();
const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  if (selectedClientId.value) {
    applyFilter('Client', [selectedClientId.value]);
    return useEncodeFilterData(filterData);
  }
});

const { onUpload, isSupportTask: isSupportTaskAttachment } = useAttachments();
isSupportTaskAttachment.value = true;

function statusSuccessFn(data: EntityStatus[]) {
  if (!props.taskId && data.length > 0) {
    setFieldValue('entityStatus' as never, data[0].name as never);
  }
}
function prioritySuccessFn(data: EntityPriority[]) {
  if (!props.taskId && data.length > 0) {
    setFieldValue('entityPriority' as never, data[0].name as never);
  }
}

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
  isPortal: isPortalUser.value,
  successFn: statusSuccessFn
});
const { data: taskPriorites } = getEntityPriorityList({
  key: 'task-entity-priorities',
  type: 'TASK',
  isPortal: isPortalUser.value,
  successFn: prioritySuccessFn
});

const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();
applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);
const { data: users } = getUsers(true, !isPortalUser.value, userFilters);

const { data: filterDataClient, applyFilter: applyFilterClient }
  = useFilterColumns();
applyFilterClient('Is Active', 'true');
const clientFilters = useEncodeFilterData(filterDataClient);
const { data: clients } = getClients(!isPortalUser.value, clientFilters);

const { data: projects } = useQuery(
  ['project-client-list', selectedClientId, props.task],
  async () => {
    const data = await useProjectListV2({
      responseStatus:
        props.task?.status?.status === 3 ? undefined : 'ScheduledAndActive',
      filters: initialFilters.value
    });
    return data.results;
  },
  {
    enabled: !isPortalUser.value
  }
);
const { ISODatestringToDate } = useVueFilters();
const queryClient = useQueryClient();

onMounted(() => {
  if (props.taskId) {
    if (props.task?.projectId) {
      const selectedProject = projects?.value?.find(
        p => p.id === props.task?.projectId
      );
      if (selectedProject && selectedProject?.client?.id) {
        setFieldValue('clientId' as never, selectedProject?.client.id as never);
        selectedClientId.value = selectedProject?.client?.id;
        return;
      }
    }
    if (props.task?.clientId) {
      selectedClientId.value = props.task?.clientId;
    }
  }
});

const { meta, values, errors, setFieldValue } = useForm({
  validationSchema: taskCreateUpdateSchemaPayload,
  initialValues:
    props.taskId && props.task
      ? { ...props.task, isClientTask: props.task.type === 'CLIENTTASK', firmSupportTask: props.firmSupportTask }
      : { isClientTask: props.entityType === 'CLIENTTASK', firmSupportTask: props.firmSupportTask },
  validateOnMount: false
});

async function onSubmit(e: Event) {
  e.preventDefault();
  const payload: UpdateTaskPayload | UpdateTask = {
    ...values
  } as unknown as UpdateTaskPayload | UpdateTask;
  payload.type = props.isSupportTask
    ? 'SUPPORTTASK'
    : props.task?.project || props.task?.client?.id
      ? payload.type
      : props.entityType || 'TASK';

  payload.title = payload.name as string;
  delete payload.name;
  payload.description = {
    content: (payload.description as unknown as string) || ''
  };
  if (props.clientId) {
    payload.clientId = props.clientId;
  }
  if (payload.isNotificationEnabled !== undefined) {
    payload.isNotificationEnabled = `${payload.isNotificationEnabled}`;
  }
  else payload.isNotificationEnabled = 'false';
  if (payload.isBillingEnabled) {
    payload.isBillingEnabled = String(payload.isBillingEnabled);
  }
  else payload.isBillingEnabled = 'false';
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
          : props.task?.project || props.task?.client?.id
            ? payload.type
            : props.entityType || 'TASK'
      },
      id: props.taskId
    });
    return;
  }
  await createTask({ data: payload });
}
function handleDropDownChange(value: Task, name: string) {
  if (name === 'clientId') {
    selectedClientId.value = value.clientId;
    setFieldValue('projectId' as never, undefined as never);
    return;
  }
  if (name === 'projectId') {
    const selectedProject = projects?.value?.find(
      p => p.id === value.projectId
    );
    if (selectedProject && selectedProject?.client?.id) {
      setFieldValue('clientId' as never, selectedProject?.client.id as never);
      selectedClientId.value = selectedProject?.client?.id;
    }
  }
}

const dueDateChecker = computed(() => {
  return (values as TaskCreateUpdateSchemaPayload).dueDate;
});

const managerChecker = computed(() => {
  const assigneeUserId = Array.isArray(
    (values as TaskCreateUpdateSchemaPayload).assignees
  )
    ? (
        (values as TaskCreateUpdateSchemaPayload).assignees as unknown as any[]
      )[0].id
    : (values as TaskCreateUpdateSchemaPayload).assignees;
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

// mutations
const { mutateAsync: addTaskUser } = useMutation(
  'addTaskUser',
  async ({ id, userType, clientId, userId }: TaskUserAddPayload) => {
    return useTaskUserAdd(
      { id, userType, clientId, userId },
      (props.task?.type as EntityType) || (props.entityType as EntityType)
    );
  }
);

const { mutateAsync: removeTaskUser } = useMutation(
  'removeTaskUser',
  async (payload: TaskUserRemovePayload) => {
    return useTaskUserDelete(
      payload,
      (props.task?.type as EntityType) || (props.entityType as EntityType)
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
      payload.data.type || (props.entityType as EntityType),
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
    const { assignees } = tempData;
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
          // if (itemType === 'watchers') {
          //   payload = {
          //     id: props.taskId as string,
          //     watcherId: item,
          //   };
          //   await removeTaskUser(payload);
          // }
          if (itemType === 'assignees') {
            payload = {
              id: props.taskId as string,
              assigneeId: item
            };
            await removeTaskUser(payload);
          }
          // if (itemType === 'clientUsers') {
          //   payload = {
          //     id: props.taskId as string,
          //     userId: item,
          //     clientId: props.clientId,
          //   };
          //   await removeTaskUser(payload);
          // }
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
          // if (itemType === 'clientUsers') {
          //   payload = {
          //     id: props.taskId as string,
          //     userId: item,
          //     clientId: props.clientId,
          //     userType: 'clientUser',
          //   };
          //   await addTaskUser(payload);
          // }
        });
      }
    };

    // if (watchers && watchers.length > 0) {
    //   addRemoveItem(
    //     watchers,
    //     props.task?.watchers as unknown as string[],
    //     'watchers'
    //   );
    // }
    if (assignees && assignees.length > 0) {
      addRemoveItem(
        assignees as string[],
        // ([props.task?.assignees] || []) as unknown as string[],
        props.task?.assignees !== undefined
          ? ([props.task?.assignees] as unknown as string[])
          : [],
        'assignees'
      );
    }
    else
      addRemoveItem(
        [],
        props.task?.assignees !== undefined
          ? ([props.task?.assignees] as unknown as string[])
          : [],
        'assignees'
      );
    // if (clientUsers && clientUsers.length > 0) {
    //   addRemoveItem(
    //     clientUsers,
    //     props.task?.clientUsers as string[],
    //     'clientUsers'
    //   );
    // }

    return useTaskUpdate({
      payload: payloadData,
      entityType: payloadData.type as EntityType,
      id,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: (data: Task) => {
      initToast({
        actionType: 'Update',
        severity: 'success',
        summary: 'Success',
        detail: 'Task Updated Successfully'
      });
      emit('close', data);
    }
  }
);

function handleFiles(files: UploadFilesPayload) {
  selectedAttachments.value = files.files as File[];
}
</script>

<template>
  <form class="grid formgrid">
    <div v-if="firmSupportTask" class="col-12 py-2">
      <div class="field mb-0">
        <label for="clientId" class="block font-medium text-900">
          <span>{{ `${$tConfig('CLIENT')}` }}
            <span
              class="text-red-500"
            >{{ ' *' }}</span></span>
        </label>
        <div class="w-full">
          <VField v-slot="{ handleChange, value, validate }" name="clientId">
            <Dropdown
              id="clientId"
              :tabindex="0"
              class="w-full"
              name="clientId"
              :model-value="value"
              :options="clients"
              option-label="name"
              option-value="id"
              :placeholder="`Select ${$tConfig('CLIENT')}`"
              :show-clear="true"
              @update:model-value="handleChange"
              @change="handleDropDownChange(values as Task, 'clientId')"
              @blur="validate()"
            />
          </VField>
        </div>
      </div>
    </div>
    <div class="col-12 py-2">
      <div class="field mb-0">
        <label for="title" class="block font-medium text-900">
          <span>Title</span>
          <span class="text-red-500">{{ ' *' }}</span>
        </label>
        <div class="w-full">
          <VField
            id="name"
            name="name"
            class="w-full"
            :as="InputText"
            placeholder="Title"
          />
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="name"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="col-12 py-2">
      <div class="field mb-0">
        <label for="description4" class="block font-medium text-900">
          <span v-if="firmSupportTask">Message</span>
          <span v-else>Description</span>
        </label>
        <div class="w-full">
          <VField v-slot="{ handleChange, value }" name="description">
            <Editor
              :model-value="`${value ? value : ''}`"
              editor-style="height: 150px"
              @update:model-value="handleChange"
              @text-change="(e: any) => handleChange(e.htmlValue, true)"
            >
              <template #toolbar>
                <span class="ql-formats">
                  <button class="ql-bold" />
                  <button class="ql-italic" />
                </span>
              </template>
            </Editor>
          </VField>
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="description"
          :feedback="false"
        />
      </transition>
    </div>
    <template v-if="!isSupportTask">
      <div class="col-12 py-2">
        <div class="field mb-0">
          <label for="entityStatus" class="block font-medium text-900">
            <span>Status</span>
          </label>
          <div class="w-full">
            <VField
              v-slot="{ handleChange, value, validate }"
              name="entityStatus"
            >
              <Dropdown
                id="entityStatus"
                :tabindex="0"
                class="w-full"
                name="entityStatus"
                :model-value="value"
                :options="taskStatuses"
                option-label="name"
                option-value="name"
                placeholder="Select Status"
                :show-clear="true"
                @update:model-value="handleChange"
                @change="handleDropDownChange(values as Task, 'entityStatus')"
                @blur="validate()"
              />
            </VField>
          </div>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="entityStatus"
            :feedback="false"
          />
        </transition>
      </div>
      <div class="col-12 py-2">
        <div class="field mb-0">
          <label for="entityPriority" class="block font-medium text-900">
            <span>Priority</span>
          </label>
          <div class="w-full">
            <VField
              v-slot="{ handleChange, value, validate }"
              name="entityPriority"
            >
              <Dropdown
                id="entityPriority"
                :tabindex="0"
                class="w-full"
                name="entityPriority"
                :model-value="value"
                :options="taskPriorites"
                option-label="name"
                option-value="name"
                placeholder="Select Priority"
                :show-clear="true"
                :disabled="isPortalUser"
                @update:model-value="handleChange"
                @change="handleDropDownChange(values as Task, 'entityPriority')"
                @blur="validate()"
              />
            </VField>
          </div>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="entityPriority"
            :feedback="false"
          />
        </transition>
      </div>
      <div class="col-12 py-2">
        <div class="field mb-0">
          <label for="dueDate" class="block font-medium text-900">
            <span>Due Date</span>
          </label>
          <div class="w-full">
            <VField v-slot="{ handleChange, value, validate }" name="dueDate">
              <Calendar
                id="dueDate"
                :tabindex="0"
                class="w-full"
                name="dueDate"
                :model-value="ISODatestringToDate(value as string)"
                placeholder="Select Due Date"
                :disabled="isPortalUser"
                :min-date="dayjs().toDate()"
                @update:model-value="handleChange"
                @change="handleDropDownChange(values as Task, 'dueDate')"
                @blur="validate()"
              />
            </VField>
            <span
              v-if="
                !isPortalUser
                  && !(checkingAvailability || fetchingAvailability)
                  && !isAvailableCheckQuery
              "
              class="font-normal text-orange-500"
            >Leaves/Holidays are conflicting with Task's Due date</span>
          </div>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="dueDate"
            :feedback="false"
          />
        </transition>
      </div>
    </template>
    <template v-if="!isPortalUser && !firmSupportTask">
      <div class="col-12 py-2">
        <div class="field mb-0">
          <label for="assignees" class="block font-medium text-900">
            <span>Assign to team</span>
          </label>
          <div class="w-full">
            <VField v-slot="{ handleChange, value, validate }" name="assignees">
              <Dropdown
                id="assignees"
                :tabindex="0"
                class="w-full"
                name="assignees"
                :model-value="value"
                :options="users"
                option-label="name"
                option-value="id"
                placeholder="Select Assignees"
                :max-selected-labels="2"
                @update:model-value="handleChange"
                @change="handleDropDownChange(values as Task, 'assignees')"
                @blur="validate()"
              />
            </VField>
          </div>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="assignees"
            :feedback="false"
          />
        </transition>
      </div>
      <div class="col-12 py-2">
        <div class="field mb-0">
          <label for="clientId" class="block font-medium text-900">
            <span>{{ `${$tConfig('CLIENT')}` }}
              <span
                v-if="
                  entityType === 'CLIENTTASK' || task?.type === 'CLIENTTASK'
                "
                class="text-red-500"
              >{{ ' *' }}</span></span>
          </label>
          <div class="w-full">
            <VField v-slot="{ handleChange, value, validate }" name="clientId">
              <Dropdown
                id="clientId"
                :tabindex="0"
                class="w-full"
                name="clientId"
                :model-value="value"
                :options="clients"
                option-label="name"
                option-value="id"
                :placeholder="`Select ${$tConfig('CLIENT')}`"
                :disabled="isSupportTask || props.task?.status?.status === 3"
                :show-clear="true"
                @update:model-value="handleChange"
                @change="handleDropDownChange(values as Task, 'clientId')"
                @blur="validate()"
              />
            </VField>
          </div>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="clientId"
            :feedback="false"
          />
        </transition>
      </div>
      <div class="col-12 py-2">
        <div class="field mb-0">
          <label for="projectId" class="block font-medium text-900">
            <span>Project</span>
          </label>
          <div class="w-full">
            <VField v-slot="{ handleChange, value, validate }" name="projectId">
              <Dropdown
                id="projectId"
                :tabindex="0"
                class="w-full"
                name="projectId"
                :model-value="value"
                :options="projects"
                option-label="name"
                option-value="id"
                placeholder="Select Project"
                :show-clear="true"
                :disabled="props.task?.status?.status === 3"
                @update:model-value="handleChange"
                @change="handleDropDownChange(values as Task, 'projectId')"
                @blur="validate()"
              />
            </VField>
          </div>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="projectId"
            :feedback="false"
          />
        </transition>
      </div>
      <div v-if="props.taskId" class="col-6 py-2">
        <div class="field mb-0 flex space-x-1.5">
          <div>
            <VField
              v-slot="{ handleChange, value }"
              name="isNotificationEnabled"
            >
              <Checkbox
                :tabindex="0"
                class="w-full"
                name="isNotificationEnabled"
                :model-value="value"
                :binary="true"
                input-id="isNotificationEnabled"
                @update:model-value="handleChange"
              />
            </VField>
          </div>
          <label for="isNotificationEnabled" class="block font-medium text-900">
            <span>Notification</span>
          </label>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="isNotificationEnabled"
            :feedback="false"
          />
        </transition>
      </div>
      <div v-if="props.taskId" class="col-6 py-2">
        <div class="field mb-0 flex space-x-1.5">
          <div>
            <VField v-slot="{ handleChange, value }" name="isBillingEnabled">
              <Checkbox
                :tabindex="0"
                class="w-full"
                name="isBillingEnabled"
                :model-value="value"
                :binary="true"
                input-id="isBillingEnabled"
                @update:model-value="handleChange"
              />
            </VField>
          </div>
          <label for="isBillingEnabled" class="block font-medium text-900">
            <span>Billing</span>
          </label>
        </div>
        <transition mode="out-in" name="field-slide-down">
          <FormFeedbackMessage
            :errors="errors"
            :values="values"
            error-key="isBillingEnabled"
            :feedback="false"
          />
        </transition>
      </div>
    </template>
    <div v-if="isSupportTask && !taskId" class="col-12 py-2">
      <div class="field mb-0">
        <label for="description4" class="block font-medium text-900">
          <span>Attachments</span>
        </label>
        <div class="w-full">
          <VField name="attachments">
            <CommonFileUpload
              id="attachments"
              name="attachments"
              custom-upload
              multiple
              :show-upload-button="false"
              @select="handleFiles"
              @remove="handleFiles"
            />
          </VField>
        </div>
      </div>
      <transition mode="out-in" name="field-slide-down">
        <FormFeedbackMessage
          :errors="errors"
          :values="values"
          error-key="description"
          :feedback="false"
        />
      </transition>
    </div>
    <div class="flex w-full justify-content-between mt-3 ml-auto col-12">
      <Button
        class="max-w-max ml-auto"
        :disabled="!meta.valid"
        type="submit"
        label="Submit"
        :loading="createIsLoading || updateIsLoading"
        @click="onSubmit"
      />
    </div>
  </form>
</template>

<style lang="scss" scoped></style>
