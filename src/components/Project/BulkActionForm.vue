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
  !isPortalUser.value &&
    (props.updateField === 'projectManagerId' ||
      props.updateField === 'reviewerId'),
  initialFilters
);

const statusOptions = ref<string[] | any>([
  {
    label: 'Archived',
    value: 'Archived',
  },
  {
    label: 'Scheduled',
    value: 'Scheduled',
  },
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
    projectManagerId: string().required().label('Project Manager'),
  }),
  status: object({
    status: string().required().label('Status'),
  }),
  reviewerId: object({
    reviewerId: string().required().label('Reviewer'),
  }),
  startDate: object({
    startDate: string().required().label('Start Date'),
  }),
  dueDate: object({
    dueDate: string().required().label('Due Date'),
  }),
};

const { handleSubmit, errors, validate } = useForm({
  validationSchema: validationSchemas[props.updateField],
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
    },
  }
);

const onSubmit = handleSubmit(async (values) => {
  await updateProject({
    [props.updateField]: values[props.updateField],
  } as any);
});
</script>

<template>
  <div class="p-4">
    <form @submit="onSubmit" class="grid p-fluid formgrid">
      <div
        v-if="updateField === 'projectManagerId'"
        class="field col-12 md:col-12 sm:col-12"
      >
        <label class="text-900 font-semibold">
          Product Manager
          <span class="text-red-600">*</span>
        </label>
        <Dropdown
          class="flex-1"
          v-model="projectManagerId"
          :options="usersListOptions"
          optionLabel="name"
          optionValue="id"
          autoFocus
          @blur="validate()"
        />
        <p class="p-error" v-if="errors.projectManagerId">
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
          class="flex-1"
          v-model="status"
          :options="filteredStatusOptions"
          optionLabel="label"
          optionValue="value"
          autoFocus
          @blur="validate()"
        />
        <p class="p-error" v-if="errors.status">
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
          class="flex-1"
          v-model="reviewerId"
          :options="usersListOptions"
          optionLabel="name"
          optionValue="id"
          autoFocus
          @blur="validate()"
        />
        <p class="p-error" v-if="errors.reviewerId">
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
          :tabindex="0"
          @blur="validate()"
          class="w-full"
          name="dueDate"
          id="dueDate"
          placeholder="Select Due Date"
          v-model="dueDate"
          :disabled="isPortalUser"
          :minDate="maxStartDate"
        />
        <p class="p-error" v-if="errors.dueDate">
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
          :tabindex="0"
          @blur="validate()"
          class="w-full"
          name="startDate"
          id="startDate"
          placeholder="Select Start Date"
          v-model="startDate"
          :disabled="isPortalUser"
          :minDate="dayjs().toDate()"
          :max-date="minDueDate"
        />
        <p class="p-error" v-if="errors.startDate">
          {{ errors.startDate }}
        </p>
      </div>
      <div class="col-12">
        <Button
          class="p-button-primary w-8rem ml-auto block"
          type="submit"
          label="Submit"
          :loading="isLoading"
        ></Button>
      </div>
    </form>
  </div>
</template>
