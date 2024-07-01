<script setup lang="ts">
import { Field as VField } from 'vee-validate';
import { useMutation } from 'vue-query';
import Dropdown from 'primevue/dropdown';
import type { User } from '@/types/teams.type';
import type { Ref } from 'vue';
import type { AxiosError } from 'axios';
import type {
  EntityType,
  Task,
  TaskUserAddPayload,
  TaskUserRemovePayload,
  UpdateTask
} from '@/types/tasks.type';
import type { MetaObj } from '@/types/common.type';
import { ProjectTaskUpdateSchema } from '@/types/project.type';

interface EmptyRecord {
  title: string;
  entityStatus: string;
  assignees: string;
  error?: string;
}
interface projectTasks { tasks: UpdateTask[] }

const props = withDefaults(
  defineProps<{
    entities: Partial<Task>[];
    hideHeader?: boolean;
    showActions?: boolean;
    showTaskStatus?: boolean;
    entityType?: string;
    isLoading?: boolean;
    isUpdatingProject?: boolean;
  }>(),
  {
    entities: () => [],
    showActions: true,
    showTaskStatus: false
  }
);

const emit = defineEmits<{
  (e: 'update:project-task', data: Task): void;
  (e: 'remove:project-delete', data: Task): void;
  (e: 'bulk-update', data: Task[]): void;
  (e: 'cancel'): void;
}>();

const emptyRecord = {
  title: '',
  status: '',
  error: ''
};

const failedRecords = ref<Partial<EmptyRecord>[]>([]);
const successRecords = ref<Partial<EmptyRecord>[]>([]);
const confirmResetDialog = ref(false);
const refetchKey = ref(0);
const { metaFilter, arrDiff, getDifferenceByIndex } = useUtilityFns();
const { titleCase } = useVueFilters();
const { isMedium, isLarge } = useCommonBreakPoints();
const { isPortalUser, currentUser } = useCurrentUserData();
const { initToast } = useToasts();
const { getEntityStatuses } = useCommonListQueries();
const { canAccessAllMenu } = usePermissions();

function canUpdateTask(task: Task) {
  const isCurrentUserIsAssignee = task.assignees?.findIndex(
    (user: User) => user.id === currentUser.value?.id
  );
  const isCurrentUserIsProjectManager
    = task.project?.projectManagerId === currentUser.value?.id;

  return (
    canAccessAllMenu.value
    || isCurrentUserIsAssignee !== -1
    || isCurrentUserIsProjectManager
  );
}

const { data: clientTaskStatuses } = getEntityStatuses({
  key: 'client-entity-statuses',
  type: 'CLIENTTASK',
  isPortal: isPortalUser.value
});
const { data: taskStatuses } = getEntityStatuses({
  key: 'task-entity-statuses',
  type: 'TASK',
  isPortal: isPortalUser.value
});

const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();

applyFilterUser('Is Active', 'true');
const userFilters = useEncodeFilterData(filterDataUser);

const { usersListOptions } = useUserListOptions(
  !isPortalUser.value,
  userFilters
);

const { handleSubmit, meta, values, errors, setValues, resetForm, validate }
  = useForm({
    validationSchema: ProjectTaskUpdateSchema,
    validateOnMount: false,
    initialValues: {
      tasks: props.entities ? [...props.entities] : [{ ...emptyRecord }]
    }
  });

const { fields } = useFieldArray('tasks');

const { mutateAsync: addTaskUser } = useMutation(
  'addTaskUser',
  async ({ id, userType, clientId, userId }: TaskUserAddPayload) => {
    return useTaskUserAdd(
      { id, userType, clientId, userId },
      props.entityType as EntityType
    );
  }
);

const { mutateAsync: removeTaskUser } = useMutation(
  'removeTaskUser',
  async (payload: TaskUserRemovePayload) => {
    return useTaskUserDelete(payload, props.entityType as EntityType);
  }
);

const { mutateAsync: updateTask, isLoading: updateBulkIsLoading } = useMutation(
  'updateTask',
  async ({ payload, id }: { payload: UpdateTask; id: string }) => {
    const { type, data: tempData } = payload;
    const { assignees } = tempData;
    const valuesToExtract = [
      'id',
      'assignees',
      'assigneesOld',
      'entityPriority',
      'entityStatus',
      'projectId',
      'startDate',
      'dueDate',
      'title',
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
          if (itemType === 'assignees') {
            payload = {
              id: payloadData.data.id as string,
              assigneeId: item
            };
            await removeTaskUser(payload);
          }
        });
      }
      if (itemsToAdd.length > 0) {
        itemsToAdd.map(async (item) => {
          let payload: TaskUserAddPayload;
          if (itemType === 'assignees') {
            payload = {
              id: tempData.id as string,
              userId: item,
              userType: 'assignee'
            };
            await addTaskUser(payload);
          }
        });
      }
    };

    if (assignees && assignees.length > 0) {
      addRemoveItem(
        assignees as string[],
        (tempData.assigneesOld as string[]).length
          ? [...(tempData.assigneesOld as string[])]
          : [],
        'assignees'
      );
    }
    else
      addRemoveItem(
        [],
        (tempData.assigneesOld as string[]).length
          ? [...(tempData.assigneesOld as string[])]
          : [],
        'assignees'
      );

    return useTaskUpdate({
      payload: payloadData,
      entityType: payloadData.type as EntityType,
      id,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: async (data: Task, variables) => {
      successRecords.value?.push({ ...variables, error: '' });
    },
    onError: (err: AxiosError<any, any>, variables) => {
      failedRecords.value?.push({
        ...variables,
        error: err.response?.data.message
          ? err.response?.data.message
          : err.message
      });
    }
  }
);

async function makeParallelAPIReq(payloadArr: Record<string, unknown>[]) {
  if (payloadArr.length === 0) {
    return;
  }
  const updatedTasks = (await Promise.allSettled(
    payloadArr.map(async (item) => {
      const { error, ...payload } = item;
      const updatedTask = await updateTask({
        id: payload.id as string,
        payload: payload as UpdateTask
      });
      return updatedTask;
    })
  )) as { status: string; value: Task }[];
  return updatedTasks.map(item => item.value);
}

function removeFieldError(field: Ref<EmptyRecord>): void {
  if (!field.value.error)
    return;
  field.value.error = '';
}

const onSubmit = handleSubmit(async (val: unknown) => {
  const modifiedTasks = getDifferenceByIndex(
    props.entities,
    (val as unknown as projectTasks).tasks
  );
  const payloadArr = modifiedTasks
    .filter((task: Task) => canUpdateTask(task))
    .map((task: Partial<Task>) => ({
      data: {
        id: task.id,
        entityStatus: task.status?.name,
        type: task.type,
        assignees: task.assignees
          ?.filter((assignee: User) => assignee.id)
          ?.map((assignee: User) => assignee.id),
        assigneesOld: props.entities.length
          ? props.entities
            ?.find((entity: Partial<Task>) => entity.id === task.id)
            ?.assignees?.map((assignee: User) => assignee.id)
          : [],
        title: metaFilter(task.meta as MetaObj[], 'title')
      },
      type: task.type,
      id: task.id
    }));

  const tasks = await makeParallelAPIReq(payloadArr);
  refetchKey.value++;

  if (successRecords.value.length > 0) {
    initToast({
      actionType: 'Update',
      summary: 'Update Project Tasks',
      detail: `Total of <strong>${successRecords.value.length}</strong> ${
        successRecords.value.length > 1 ? 'Tasks are' : 'Task'
      } successfully updated.`
    });
    successRecords.value = [];
  }
  const updatedTaskIds = tasks?.map(task => task.id);
  const allTasks = props.entities.map((entity) => {
    if (updatedTaskIds?.includes(entity.id as string))
      return tasks?.find(task => task.id === entity.id);
    else return entity;
  });
  emit('bulk-update', allTasks as Task[]);
});

watchEffect(() => {
  if (props.entities) {
    refetchKey.value++;
  }
});
</script>

<template>
  <form @submit.stop="onSubmit">
    <div class="p-datatable p-component p-datatable-responsive-scroll">
      <div class="p-datatable-wrapper overflow-x-auto">
        <table
          class="bulk-create-table p-datatable-table w-full"
          role="table"
          cellspacing="0"
          cellpadding="0"
        >
          <thead class="bg-gray-50 p-datatable-thead" role="rowgroup">
            <tr>
              <th role="cell">
                Title <span class="text-red-600">*</span>
              </th>
              <th role="cell">
                Type
              </th>
              <th role="cell">
                Assigned To
              </th>
              <th role="cell">
                Status <span class="text-red-600">*</span>
              </th>
            </tr>
          </thead>
          <tbody class="p-datatable-tbody relative" role="rowgroup">
            <template v-if="isLoading">
              <tr>
                <td colspan="4" class="text-center">
                  <CommonLoading />
                </td>
              </tr>
            </template>
            <template v-else-if="entities.length">
              <tr
                v-for="(field, idx) in fields"
                :key="field.key"
                role="row"
                class="relative"
                :class="[
                  {
                    'border-red-400 border-2': (
                      field.value as unknown as EmptyRecord
                    ).error,
                  },
                ]"
              >
                <td
                  role="cell"
                  valign="middle"
                  :class="[
                    {
                      'pb-4':
                        (field.value as unknown as EmptyRecord).error
                        && isMedium,
                    },
                  ]"
                >
                  <!-- {{ field }} -->
                  {{
                    metaFilter(
                      (field.value as unknown as Task).meta as MetaObj[],
                      'title',
                    )
                  }}
                </td>
                <td role="cell" valign="middle">
                  <!-- {{ field }} -->
                  {{
                    useTaskTypeHumanMap[(field.value as unknown as Task).type]
                  }}
                </td>
                <td role="cell" valign="top">
                  <label
                    :for="`assignee_${idx}`"
                    class="mb-2"
                    :class="isMedium ? 'hidden' : 'block'"
                  >Assigned To</label>
                  <VField
                    :id="`assignee_${idx}`"
                    v-slot="{ handleChange, value, validate }"
                    :name="`tasks[${idx}].assignees[0].id`"
                  >
                    <span
                      v-tooltip.top="
                        `${
                          !canUpdateTask(field.value as Task)
                            ? `You don't have permission to update this task`
                            : ''
                        }`
                      "
                      class="inline-block"
                    >
                      <Dropdown
                        class="w-full"
                        :model-value="value"
                        :options="usersListOptions"
                        option-label="name"
                        option-value="id"
                        placeholder="Select Assignee"
                        :disabled="
                          !canUpdateTask(
                            field.value as unknown as Task,
                          ) as unknown as boolean
                        "
                        @update:model-value="handleChange"
                        @blur="validate()"
                        @change="
                          removeFieldError(field as unknown as Ref<EmptyRecord>)
                        "
                      />
                    </span>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="errors"
                        :values="values"
                        :error-key="`tasks[${idx}].entityStatus`"
                      />
                    </transition>
                  </VField>
                </td>
                <td role="cell" valign="top">
                  <label
                    :for="`status_${idx}`"
                    class="mb-2"
                    :class="isMedium ? 'hidden' : 'block'"
                  >Status</label>
                  <VField
                    :id="`status_${idx}`"
                    v-slot="{ handleChange, value, validate }"
                    :name="`tasks[${idx}].status.name`"
                  >
                    <span
                      v-tooltip.top="
                        `${
                          !canUpdateTask(field.value as Task)
                            ? `You don't have permission to update this task`
                            : ''
                        }`
                      "
                      class="inline-block"
                    >
                      <Dropdown
                        class="w-full"
                        :model-value="value"
                        :options="
                          (field as unknown as Task).type === 'TASK'
                            ? taskStatuses
                            : clientTaskStatuses
                        "
                        option-label="name"
                        option-value="name"
                        placeholder="Select a Status"
                        :disabled="
                          !canUpdateTask(
                            field.value as unknown as Task,
                          ) as unknown as boolean
                        "
                        @update:model-value="handleChange"
                        @blur="validate()"
                        @change="
                          removeFieldError(field as unknown as Ref<EmptyRecord>)
                        "
                      />
                    </span>
                    <transition mode="out-in" name="field-slide-down">
                      <FormFeedbackMessage
                        :errors="errors"
                        :values="values"
                        :error-key="`tasks[${idx}].entityStatus`"
                      />
                    </transition>
                  </VField>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="4" class="text-center" valign="middle">
                No {{ entityType === 'CLIENTTASK' ? 'Client' : '' }} Task(s)
                available.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex justify-content-between mt-4">
      <Button label="Cancel" class="p-button-danger" @click="$emit('cancel')" />
      <Button
        label="Submit"
        type="submit"
        class="p-button ml-2"
        :disabled="!meta.valid || isLoading"
        :loading="updateBulkIsLoading || isUpdatingProject"
      />
    </div>
  </form>
  <CommonConfirmRemoveDialog
    v-if="confirmResetDialog"
    :visible="confirmResetDialog"
    title="Confirm Reset Form"
    @confirm="resetForm"
    @hide="confirmResetDialog = false"
  >
    Are you sure you want to reset the form? You will lose all entered Team
    Member data.
  </CommonConfirmRemoveDialog>
</template>
