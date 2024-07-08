<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import type { SchemaForm } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import { useMutation, useQueryClient } from 'vue-query';
import dayjs from 'dayjs';
import type {
  HRLeaveBalance,
  HRLeaveBalanceCreateInput
} from '@/types/hrms.type';
import { HRLeaveBalanceCreateInputSchema } from '@/types/hrms.type';

const props = defineProps<{
  leaveBalance?: HRLeaveBalance;
}>();

const emit = defineEmits<{
  (e: 'success', data: HRLeaveBalance): void;
  (e: 'update', data: HRLeaveBalance): void;
}>();

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { getUsers, getLeaveTypes } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { data: usersList, isLoading: loadingUsers } = getUsers(
  true,
  true,
  initialFilters
);
const { data: leaveTypes, isLoading: loadingLeaveTypes } = getLeaveTypes();

const { createOne: createLeaveBalance, update: updateLeaveBalance }
  = useHrmsLeaveBalance();

const lastThreeYears = computed(() => {
  const currentYear = dayjs().year();
  // const previousYear = currentYear - 1;
  const nextYear = currentYear + 1;
  const lastThreeYears = [currentYear, nextYear];
  return lastThreeYears;
});

function showToast(type: APIActions, data: HRLeaveBalance) {
  initToast({
    actionType: type,
    title: 'Leave Balance',
    actionObj: data
  });
}

const { mutateAsync: createUpdateLeaveBalance, isLoading } = useMutation(
  (payload: HRLeaveBalanceCreateInput) => {
    if (props.leaveBalance) {
      return updateLeaveBalance(props.leaveBalance.id, payload);
    }
    return createLeaveBalance(payload);
  },
  {
    onSuccess: (data) => {
      if (props.leaveBalance) {
        showToast('Update', data);
        // emit('update', data);
      }
      else {
        showToast('Create', data);
      }
      emit('success', data);
      queryClient.invalidateQueries('leavebalance-list');
    }
  }
);

const formData = computed<SchemaForm>(() => ({
  fields: [
    {
      as: Dropdown,
      type: 'dropdown',
      name: 'userId',
      label: 'Team Member',
      required: true,
      options: usersList.value,
      optionLabel: 'name',
      optionValue: 'id',
      placeholder: 'Select a user',
      hide: !!props.leaveBalance
    },
    {
      as: Dropdown,
      type: 'dropdown',
      name: 'typeId',
      label: 'Leave Type',
      required: true,
      optionLabel: 'name',
      optionValue: 'id',
      options: leaveTypes.value,
      disabled: !!props.leaveBalance,
      placeholder: 'Select a leave type'
    },
    {
      as: Dropdown,
      type: 'dropdown',
      name: 'year',
      label: 'Year',
      required: true,
      disabled: !!props.leaveBalance,
      options: lastThreeYears.value as unknown as Record<string, any>[],
      placeholder: 'Select a year'
    },
    {
      as: InputNumber,
      type: 'input-number',
      name: 'days',
      label: 'Number of days',
      required: true
    }
  ],
  validationSchema: HRLeaveBalanceCreateInputSchema,
  initialValues: props.leaveBalance
    ? {
        userId: props.leaveBalance.user.id,
        typeId: props.leaveBalance.type.id,
        year: props.leaveBalance.year,
        days: props.leaveBalance.days
      }
    : undefined,
  btnText: props.leaveBalance ? 'Update' : 'Submit'
}));

async function onSubmit(values: Record<string, any>) {
  await createUpdateLeaveBalance({
    userId: values.userId,
    typeId: values.typeId,
    year: values.year,
    days: values.days
  });
}
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    :primary-btn-loading="isLoading"
    @submit="onSubmit"
  />
</template>
