<script setup lang="ts">
import type { EntityType, Task } from '@/types/tasks.type';
import { useMutation } from 'vue-query';
import { object, string } from 'yup';
import dayjs from 'dayjs';

const props = defineProps<{
  tasks: Task[];
  updateField?: string | number;
  entityType?: EntityType;
  value?: string;
  minDueDate?: Date;
  maxStartDate?: Date;
}>();

const emits = defineEmits<{
  (e: 'success'): void;
  (e: 'cancel'): void;
}>();

const { isPortalUser } = useCurrentUserData();

const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { usersListOptions } = useUserListOptions(
  !isPortalUser.value && props.updateField === 'assignedUserId',
  initialFilters
);

const { getEntityStatuses, getEntityPriorityList } = useCommonListQueries();

const { data: statusOptions } = getEntityStatuses({
  key: 'entity-status-options',
  type: props.entityType as EntityType,
  isPortal: isPortalUser.value,
  enabled: props.updateField === 'entityStatusId'
});
const { data: priorityOptions } = getEntityPriorityList({
  key: 'entity-priority-options',
  type: props.entityType as EntityType,
  isPortal: isPortalUser.value,
  enabled: props.updateField === 'entityPriorityId'
});

const validationSchemas: Record<string, unknown> = {
  assignedUserId: object({
    assignedUserId: string().required().label('Assign User')
  }),
  entityStatusId: object({
    entityStatusId: string().required().label('Status')
  }),
  entityPriorityId: object({
    entityPriorityId: string().required().label('Priority')
  }),
  dueDate: object({
    dueDate: string().required().label('Due Date')
  }),
  startDate: object({
    startDate: string().required().label('Start Date')
  })
};

const { handleSubmit, errors, validate } = useForm({
  validationSchema: validationSchemas[props.updateField as string]
});

const { value: assignedUserId } = useField<string>('assignedUserId');
const { value: entityStatusId } = useField<string>('entityStatusId');
const { value: entityPriorityId } = useField<string>('entityPriorityId');
const { value: dueDate } = useField<string>('dueDate');
const { value: startDate } = useField<string>('startDate');

const { mutateAsync: updateTask, isLoading } = useMutation(
  ['task-update'],
  (data: any) => {
    return useTaskBulkUpdate({
      ids: props.tasks.map((t) => {
        return t.id;
      }),
      entityType: props.entityType as EntityType,
      field: `${props.updateField as string}`,
      value: data[props.updateField as string],
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: () => {
      emits('success');
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await updateTask({
    [props.updateField as string]: values[props.updateField as string]
  } as any);
});
</script>

<template>
  <div class="p-4">
    <form class="grid p-fluid formgrid" @submit="onSubmit">
      <div
        v-if="updateField === 'entityStatusId'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Status
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          v-model="entityStatusId"
          class="flex-1"
          :options="statusOptions"
          option-label="name"
          option-value="id"
          auto-focus
          @blur="validate()"
        />
        <p v-if="errors.entityStatusId" class="p-error">
          {{ errors.entityStatusId }}
        </p>
      </div>
      <div
        v-if="updateField === 'assignedUserId'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Assign User
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          v-model="assignedUserId"
          class="flex-1"
          :options="usersListOptions"
          option-label="name"
          option-value="id"
          auto-focus
          @blur="validate()"
        />
        <p v-if="errors.assignedUserId" class="p-error">
          {{ errors.assignedUserId }}
        </p>
      </div>
      <div
        v-if="updateField === 'entityPriorityId'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Priority
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          v-model="entityPriorityId"
          class="flex-1"
          :options="priorityOptions"
          option-label="name"
          option-value="id"
          auto-focus
          @blur="validate()"
        />
        <p v-if="errors.entityPriorityId" class="p-error">
          {{ errors.entityPriorityId }}
        </p>
      </div>
      <div
        v-if="updateField === 'dueDate'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Due Date
          <span class="text-red-600">*</span>
        </label>
        <Calendar
          id="dueDate"
          v-model="dueDate"
          :tabindex="0"
          class="w-full"
          name="dueDate"
          placeholder="Select Due Date"
          :disabled="isPortalUser"
          :min-date="maxStartDate"
          @blur="validate()"
        />
        <p v-if="errors.dueDate" class="p-error">
          {{ errors.dueDate }}
        </p>
      </div>
      <div
        v-if="updateField === 'startDate'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Start Date
          <span class="text-red-600">*</span>
        </label>
        <Calendar
          id="startDate"
          v-model="startDate"
          :tabindex="0"
          class="w-full"
          name="startDate"
          placeholder="Select Start Date"
          :min-date="dayjs().toDate()"
          :max-date="minDueDate"
          @blur="validate()"
        />
        <p v-if="errors.startDate" class="p-error">
          {{ errors.startDate }}
        </p>
      </div>
      <div class="col-12">
        <Button
          class="p-button-primary w-8rem ml-auto block"
          type="submit"
          label="Submit"
          :loading="isLoading"
        />
      </div>
    </form>
  </div>
</template>
