<script setup lang="ts">
// import { toTypedSchema } from '@vee-validate/zod';
import { useField, useForm } from 'vee-validate';
import type { HRHoliday, HRLeaveCreateInput } from '@/types/hrms.type';
import { HRLeaveCreateInputSchema } from '@/types/hrms.type';
import { useMutation, useQuery } from 'vue-query';
import type { PaginatedResponse } from '@/types/common.type';

const props = defineProps<{
  userId?: string;
}>();

const emits = defineEmits(['success', 'close']);

const remainingLeaveBalance = ref<number>(0);

const { handleSubmit, errors, meta, setFieldValue, validate, validateField }
  = useForm({
    validationSchema: HRLeaveCreateInputSchema
  });
const { createOne, getAllType, createLeaveBalance } = useHrmsLeaves();
const { getAll: getAllHolidays } = useHrmsHolidays();
const { data: filterData, applyFilter } = useFilterColumns();

const { value: startDate } = useField<Date>('startDate');
const { value: endDate } = useField<Date>('endDate');
const { value: description } = useField<string>('description');
const { value: leaveTypeId } = useField<string>('leaveTypeId');

const canFetchHolidays = computed(() => !!(startDate.value && endDate.value));

const { data: leaveTypesData } = useQuery(['leave-type-list'], () => {
  return getAllType();
});
const { data: holidaysList } = useQuery(
  ['holidays-list', startDate, endDate],
  () => {
    applyFilter('Date', [startDate.value, endDate.value]);
    const initialFilters = useEncodeFilterData(filterData);
    return getAllHolidays({ filters: initialFilters });
  },
  {
    onSuccess: (data: PaginatedResponse<HRHoliday>) => {
      setFieldValue('holidaysInSelectedRange', data?.total);
    },
    enabled: canFetchHolidays
  }
);
const { mutateAsync: createLeave, isLoading } = useMutation(
  (data: HRLeaveCreateInput) => {
    return createOne(data);
  },
  {
    onSuccess: () => {
      emits('success');
    }
  }
);
const { mutateAsync: applyLeaveBalance } = useMutation(
  (data: { leaveTypeId: string; userId: string }) => {
    return createLeaveBalance(data);
  },
  {
    onSuccess: (data) => {
      remainingLeaveBalance.value = data?.remainingLeaveBalance;
      setFieldValue('remainingLeaves', data?.remainingLeaveBalance);
    }
  }
);

function handleClose() {
  emits('close');
}
const onSubmit = handleSubmit(async (values) => {
  const paylaod = values;
  createLeave(paylaod as HRLeaveCreateInput);
});

const getRemainingLeaveBalanceValue = computed(() => {
  if (remainingLeaveBalance.value !== 0) {
    return false;
  }
  else return true;
});
watch(
  () => leaveTypeId.value,
  (data) => {
    if (data) {
      const paylaod: { leaveTypeId: string; userId: string } = {
        leaveTypeId: data,
        userId: props.userId as string
      };
      applyLeaveBalance(paylaod);
    }
  }
);
</script>

<template>
  <form class="grid p-fluid formgrid" @submit="onSubmit">
    <div class="field col-12 md-2">
      <label for="leaveTypeId" class="block font-medium text-900">
        Leave Type
        <span class="text-red-600">*</span>
        <span v-if="leaveTypeId" class="text-sm font-semibold">
          (Remaining Leaves - {{ remainingLeaveBalance }} )
        </span>
      </label>
      <Dropdown
        id="leaveTypeId"
        v-model="leaveTypeId"
        :options="leaveTypesData"
        option-label="name"
        option-value="id"
        placeholder="Leave Type"
        class="w-full"
        :class="{ 'p-invalid': errors.leaveTypeId }"
        @blur="validateField('leaveTypeId')"
      >
        <template #option="slotProps">
          <div class="flex align-items-center">
            <div>{{ slotProps.option.name }} ({{ slotProps.option.code }})</div>
          </div>
        </template>
      </Dropdown>
      <p v-if="errors.leaveTypeId" class="p-error">
        {{ errors.leaveTypeId }}
      </p>
    </div>
    <div class="field col-12 md:col-6">
      <label for="startDate" class="text-900 font-semibold">
        From
        <span class="text-red-600">*</span>
      </label>
      <Calendar
        id="startDate"
        v-model="startDate"
        :tabindex="0"
        class="w-full"
        name="startDate"
        placeholder="Select Start Date"
        :max-date="endDate"
        :disabled="!leaveTypeId"
      />
      <p v-if="errors.startDate" class="p-error">
        {{ errors.startDate }}
      </p>
    </div>

    <div class="field col-12 md:col-6">
      <label for="endDate" class="text-900 font-semibold">
        To
        <span class="text-red-600">*</span>
      </label>
      <Calendar
        id="endDate"
        v-model="endDate"
        :tabindex="0"
        class="w-full"
        name="endDate"
        placeholder="Select End Date"
        :min-date="startDate"
        :disabled="!leaveTypeId"
        @blur="validateField('leaveTypeId')"
      />
      <p v-if="errors.endDate" class="p-error">
        {{ errors.endDate }}
      </p>
    </div>

    <div class="field col-12 md:col-12">
      <label for="description" class="block font-medium text-900">
        Reason
        <span class="text-red-600">*</span>
      </label>
      <Textarea
        id="description"
        v-model="description"
        type="name"
        class="w-full"
        rows="5"
        :class="{ 'p-invalid': errors.description }"
      />
    </div>

    <div class="flex justify-content-between ml-auto col-12">
      <Button
        label="Cancel"
        class="p-button w-5rem block p-button-danger"
        @click="handleClose"
      />
      <Button
        class="p-button-primary w-8rem block"
        type="submit"
        label="Submit"
        :disabled="!meta.valid || getRemainingLeaveBalanceValue"
        :loading="isLoading"
      />
    </div>
  </form>
</template>
