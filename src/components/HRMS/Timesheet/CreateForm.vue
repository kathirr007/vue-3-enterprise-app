<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import type { SchemaForm } from '@/types/schemaform.type';
import Dropdown from 'primevue/dropdown';
import Calendar from 'primevue/calendar';
import { useMutation, useQueryClient } from 'vue-query';
import dayjs from 'dayjs';
import type { HRAttendance, HRAttendanceCreateInput } from '@/types/hrms.type';
import { HRAttendanceCreateInputSchema } from '@/types/hrms.type';

const props = defineProps<{
  attendance?: HRAttendance;
}>();

const emit = defineEmits<{
  (e: 'success', data: HRAttendance): void;
  (e: 'update', data: HRAttendance): void;
}>();

const queryClient = useQueryClient();
const { canAccessAllMenu } = usePermissions();
const { initToast } = useToasts();
const { getUsers } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const {
  data: usersList,
  myTeamUsers,
  isFetching: loadingUsers,
} = getUsers(true, true, initialFilters);
const { createAttendance, updateAttendance } = useHrmsAttendance();

const showToast = (type: APIActions, data: HRAttendance) => {
  initToast({
    actionType: type,
    title: 'Attendance',
    actionObj: data,
  });
};

const { mutateAsync: createUpdateLeaveBalance, isLoading } = useMutation(
  (payload: HRAttendanceCreateInput) => {
    if (props.attendance) {
      return updateAttendance(props.attendance.id, payload);
    }
    return createAttendance(payload);
  },
  {
    onSuccess: (data) => {
      if (props.attendance) {
        showToast('Update', data);
      } else {
        showToast('Create', data);
      }
      emit('success', data);
      queryClient.invalidateQueries('timesheets-list');
    },
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
      options: canAccessAllMenu.value
        ? usersList.value?.slice(props.attendance ? 0 : 1)
        : myTeamUsers.value?.slice(props.attendance ? 0 : 1),
      optionLabel: 'name',
      optionValue: 'id',
      placeholder: 'Select a user',
      disabled: !!props.attendance,
      loading: loadingUsers.value,
    },
    {
      as: Calendar,
      type: 'calender',
      name: 'checkIn',
      label: 'Check In Time',
      required: true,
      showTime: true,
      hourFormat: '12',
      maxDate: dayjs().toDate(),
    },
    {
      as: Calendar,
      type: 'calender',
      name: 'checkOut',
      label: 'Check Out Time',
      showTime: true,
      hourFormat: '12',
      required: true,
      maxDate: dayjs().toDate(),
    },
  ],
  validationSchema: HRAttendanceCreateInputSchema,
  initialValues: props.attendance
    ? {
        userId: props.attendance.user.id,
        checkIn: props.attendance.checkIn,
        checkOut: props.attendance.checkOut,
      }
    : undefined,
  btnText: props.attendance ? 'Update' : 'Submit',
}));

const onSubmit = async (values: Record<string, any>) => {
  await createUpdateLeaveBalance({
    userId: values.userId,
    checkIn: values.checkIn,
    checkOut: values.checkOut,
  } as HRAttendanceCreateInput);
};
</script>

<template>
  <CommonSchemaForm
    :data="formData"
    @submit="onSubmit"
    :primary-btn-loading="isLoading"
  ></CommonSchemaForm>
</template>
