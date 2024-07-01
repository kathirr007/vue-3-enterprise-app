<script setup lang="ts">
import type {
  HRAttendanceCheckInInput,
  HRAttendanceCheckOutInput,
  UserCheckInStatus
} from '@/types/hrms.type';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    showTimer?: boolean;
    showButton?: boolean;
  }>(),
  {
    showTimer: false,
    showButton: false
  }
);

const queryClient = useQueryClient();
const { initToast } = useToasts();
const { featureSubscribed, canDo } = usePermissions();
const { checkStatus, checkIn, checkOut } = useHrmsAttendance();
const { defaultBreakpoints, styles } = useCommonBreakPoints();

const subscribeDialog = ref(false);
const showNoAccessDialog = ref(false);

const { data: checkInStatus, isLoading: checkingStatus }
  = useQuery<UserCheckInStatus>(
    'user-check-in-status',
    async () => {
      return checkStatus();
    },
    {
      enabled: !!canDo('attendance', 'create')
    }
  );

const { mutateAsync: userCheckInCheckOut } = useMutation(
  async (
    payload: (HRAttendanceCheckInInput | HRAttendanceCheckOutInput) & {
      id: string;
    }
  ) => {
    const { id, ...rest } = payload;
    if (id)
      return checkOut(id, {
        ...(rest as unknown as HRAttendanceCheckOutInput)
      });
    return checkIn(rest as unknown as HRAttendanceCheckInInput);
  }
);

async function handleCheckInCheckOut() {
  if (!canDo('attendance', 'create')) {
    showNoAccessDialog.value = true;
    return;
  }
  if (featureSubscribed('hrms', 'attendance') === false) {
    subscribeDialog.value = true;
    return;
  }
  const payload: any = {};
  if (checkInStatus.value?.status === 'NOT_AVAILABLE')
    payload.checkIn = dayjs().toISOString();
  if (checkInStatus.value?.status === 'CHECKED_IN') {
    payload.checkOut = dayjs().toISOString();
    payload.id = checkInStatus.value?.attendance.id;
  }
  await userCheckInCheckOut(payload);
  queryClient.invalidateQueries('user-check-in-status');
  queryClient.invalidateQueries('timesheets-list');
  initToast({
    actionType: 'Update',
    summary: `User ${payload.id ? 'Check Out' : 'Check In'}`,
    detail: `You've successfully <strong>${
      payload.id ? 'Checked Out' : 'Checked In'
    }</strong>`
  });
}
</script>

<template>
  <div v-bind="$attrs">
    <CommonTimer
      v-if="showTimer && checkInStatus?.status === 'CHECKED_IN'"
      class="align-items-center inline-flex border-round-lg border-solid px-3 py-1 bg-primary text-white"
      :check-in-timer-data="checkInStatus"
      hide-controls
      units
    />
    <template v-if="showButton">
      <Button
        v-tooltip.left="
          checkInStatus?.status === 'CHECKED_IN' ? 'Check Out' : 'Check In'
        "
        icon="pi pi-plus"
        class="ml-2 p-button-rounded"
        :disabled="checkInStatus?.status === 'CHECKED_OUT'"
        :severity="checkInStatus?.status === 'CHECKED_IN' ? 'danger' : ''"
        @click="handleCheckInCheckOut"
      >
        <Icon
          :icon="
            checkInStatus?.status === 'CHECKED_IN'
              ? 'fa:sign-out'
              : 'fa:sign-in'
          "
          class="flex-none"
        />
      </Button>
    </template>
    <template v-else>
      <Icon
        v-tooltip.bottom="
          checkInStatus?.status === 'CHECKED_IN' ? 'Check Out' : 'Check In'
        "
        :icon="
          checkInStatus?.status === 'CHECKED_IN' ? 'fa:sign-out' : 'fa:sign-in'
        "
        class="flex-none cursor-pointer outline-none"
        :class="[
          checkInStatus?.status === 'CHECKED_OUT'
            ? 'pointer-events-none opacity-50'
            : checkInStatus?.status === 'CHECKED_IN'
              ? 'text-red-500'
              : '',
        ]"
        @click="handleCheckInCheckOut"
      />
    </template>
  </div>
  <Dialog
    v-model:visible="showNoAccessDialog"
    :modal="true"
    append-to="body"
    header="Access Denied"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="showNoAccessDialog = false"
  >
    You don't have permission to access Attendance.
  </Dialog>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="check in"
    @hide="subscribeDialog = false"
  />
</template>

<style lang="scss" scoped></style>
