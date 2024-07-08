<script setup lang="ts">
import type { Project } from '@/types/project.type';
import { useMutation } from 'vue-query';
import { object, string } from 'yup';
import dayjs from 'dayjs';

const props = defineProps<{
  projects: Project[];
  updateField: string | number;
  statusValue?: string;
  minDueDate?: Date | undefined;
  maxStartDate?: Date | undefined;
}>();

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const selectedStatus = ref<string>();
const { isPortalUser } = useCurrentUserData();

const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { usersListOptions } = useUserListOptions(
  !isPortalUser.value
  && (props.updateField === 'projectManagerId'
  || props.updateField === 'reviewerId'),
  initialFilters
);

const statusOptions = ref<string[] | any>([
  {
    label: 'Archived',
    value: 'Archived'
  },
  {
    label: 'Scheduled',
    value: 'Scheduled'
  }
]);

const filteredStatusOptions = computed(() => {
  switch (props.statusValue as string) {
    case 'Scheduled':
      selectedStatus.value = props.statusValue;
      break;
    case 'Active':
      selectedStatus.value = 'Scheduled';
      break;
    case 'Archived':
      selectedStatus.value = 'Archived';
      break;
    case 'Completed':
      selectedStatus.value = 'Scheduled';
      break;
    default:
      break;
  }
  if (selectedStatus.value) {
    const statusValue = statusOptions.value.filter(
      (val: any) => val.value !== selectedStatus.value
    );
    return statusValue;
  }
});

const validationSchemas: Record<string, unknown> = {
  projectManagerId: object({
    projectManagerId: string().required().label('Project Manager')
  }),
  status: object({
    status: string().required().label('Status')
  }),
  reviewerId: object({
    reviewerId: string().required().label('Reviewer')
  }),
  startDate: object({
    startDate: string().required().label('Start Date')
  }),
  dueDate: object({
    dueDate: string().required().label('Due Date')
  })
};

const { handleSubmit, errors, validate } = useForm({
  validationSchema: validationSchemas[props.updateField]
});

const { value: projectManagerId } = useField<string>('projectManagerId');
const { value: status } = useField<string>('status');
const { value: reviewerId } = useField<string>('reviewerId');
const { value: dueDate } = useField<string>('dueDate');
const { value: startDate } = useField<string>('startDate');

const { mutateAsync: updateProject, isLoading } = useMutation(
  ['project-update'],
  (data: any) => {
    return useProjectBulkUpdate(
      props.projects.map((t) => {
        return t.id;
      }),
      `${props.updateField}`,
      data[props.updateField]
    );
  },
  {
    onSuccess: () => {
      emits('success');
    }
  }
);

const onSubmit = handleSubmit(async (values) => {
  await updateProject({
    [props.updateField]: values[props.updateField]
  } as any);
});
</script>

<template>
  <div class="p-4">
    <form class="grid p-fluid formgrid" @submit="onSubmit">
      <div
        v-if="updateField === 'projectManagerId'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Product Manager
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          v-model="projectManagerId"
          class="flex-1"
          :options="usersListOptions"
          option-label="name"
          option-value="id"
          auto-focus
          @blur="validate()"
        />
        <p v-if="errors.projectManagerId" class="p-error">
          {{ errors.projectManagerId }}
        </p>
      </div>
      <div
        v-if="updateField === 'status'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Status
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          v-model="status"
          class="flex-1"
          :options="filteredStatusOptions"
          option-label="label"
          option-value="value"
          auto-focus
          @blur="validate()"
        />
        <p v-if="errors.status" class="p-error">
          {{ errors.status }}
        </p>
      </div>
      <div
        v-if="updateField === 'reviewerId'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Reviewer
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          v-model="reviewerId"
          class="flex-1"
          :options="usersListOptions"
          option-label="name"
          option-value="id"
          auto-focus
          @blur="validate()"
        />
        <p v-if="errors.reviewerId" class="p-error">
          {{ errors.reviewerId }}
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
          :disabled="isPortalUser"
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
