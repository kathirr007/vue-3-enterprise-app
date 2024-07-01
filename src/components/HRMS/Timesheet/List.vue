<script setup lang="ts">
import dayjs from 'dayjs/esm';
import type { HRAttendance } from '@/types/hrms.type';
import { useQuery, useQueryClient } from 'vue-query';
import { useHrmsAttendance } from '@/composables/hrms';
import type { APIActions } from '@/types/common.type';

const props = defineProps<{
  myAccount?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'update:attendance',
    value: { data: HRAttendance; action: APIActions }
  ): void;
}>();

const { currentUser } = useCurrentUserData();
const queryClient = useQueryClient();
const {
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  currentLimit,
  currentPage,
  queryFilters,
  querySortBy,
  queryKeys
} = useDataTableUtils();
const { getAllTimesheets } = useHrmsAttendance();
const { dateToHumanShort, dateToDateTime, convertMinsToHrsMins }
  = useVueFilters();
const { canDo, canAccessAllMenu } = usePermissions();
const { fullName } = useVueFilters();
const { getUsers } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const {
  data: usersList,
  myTeamUsers,
  isLoading: loadingUsers
} = getUsers(true, true, initialFilters);

const selectedUser = ref();
const selectedDateRange = ref<Date[]>([
  dayjs().subtract(7, 'days').startOf('day').toDate(),
  dayjs().endOf('day').toDate()
]);

function getTotalTaskLink(data: HRAttendance) {
  return {
    name: 'admin-time-log',
    query: {
      filters: useEncodeFilterData({
        'Assigned To': {
          column: 'assignees',
          operator: 'in',
          value: [data.user.id as string]
        },
        'CreatedAt': {
          column: 'createdAt',
          operator: 'between',
          value: [
            dayjs(data.createdAt).startOf('day').toISOString(),
            dayjs(data.createdAt).endOf('day').toISOString()
          ]
        }
      })
    }
  };
}

const { isFetching: loadingTimesheets, data: timesheets } = useQuery(
  ['timesheets-list', ...queryKeys, selectedUser, selectedDateRange],
  () => {
    const selectedUserId = props.myAccount
      ? [currentUser.value?.id]
      : selectedUser.value
        ? [selectedUser.value.id]
        : null;
    applyFilter('Is Active', undefined);
    applyFilter('userId', selectedUserId);
    applyFilter(
      'Checked In Date',
      selectedDateRange.value[1] === null
        ? [selectedDateRange.value[0], selectedDateRange.value[0]]
        : selectedDateRange.value
    );
    const attendanceFilters = useEncodeFilterData(filterData);
    return getAllTimesheets({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: attendanceFilters,
      sortBy: querySortBy.value
    });
  }
);
</script>

<template>
  <div class="flex align-items-center pb-3 gap-2">
    <Calendar
      v-model="selectedDateRange"
      selection-mode="range"
      :manual-input="false"
    />
    <Dropdown
      v-if="!myAccount"
      v-model="selectedUser"
      option-label="name"
      :options="canAccessAllMenu ? usersList : myTeamUsers"
      :loading="loadingUsers"
      placeholder="Select a user"
      filter
      show-clear
    />
  </div>
  <DataTable
    data-key="id"
    :total-records="timesheets?.total"
    :value="timesheets?.results"
    :loading="loadingTimesheets"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <Column v-if="!myAccount" header="Team Member">
      <template #body="{ data }">
        {{ fullName(data.user) }}
      </template>
    </Column>
    <Column header="Date">
      <template #body="{ data }: { data: HRAttendance }">
        {{ dateToHumanShort(data.checkIn) }}
      </template>
    </Column>
    <Column header="Check In Time">
      <template #body="{ data }: { data: HRAttendance }">
        {{
          `${dateToDateTime(data.checkIn).date} ${
            dateToDateTime(data.checkIn).time
          }`
        }}
      </template>
    </Column>
    <Column header="Check Out Time">
      <template #body="{ data }: { data: HRAttendance }">
        {{
          data.checkOut
            ? `${dateToDateTime(data.checkOut).date} ${
              dateToDateTime(data.checkOut).time
            }`
            : 'NA'
        }}
      </template>
    </Column>
    <Column header="Total Time">
      <template #body="{ data }: { data: HRAttendance }">
        {{
          data.checkIn && data.checkOut
            ? convertMinsToHrsMins(
              dayjs(data.checkOut).diff(dayjs(data.checkIn), 'm'),
            )
            : 'NA'
        }}
      </template>
    </Column>
    <Column header="Total Task">
      <template #body="{ data }: { data: HRAttendance }">
        <router-link
          v-if="data.totalTask"
          :to="getTotalTaskLink(data)"
          class="text-gray-900 cursor-pointer"
        >
          {{ data.totalTask ? data.totalTask : '0' }}
        </router-link>
      </template>
    </Column>
    <Column header="Actual Time Spent">
      <template #body="{ data }: { data: HRAttendance }">
        {{
          data.actualTimeSpent
            ? convertMinsToHrsMins(Number(data.actualTimeSpent))
            : convertMinsToHrsMins(0)
        }}
      </template>
    </Column>
    <Column
      v-if="canDo('attendance', 'edit') && !myAccount"
      class="text-center w-2"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            :disabled="
              !canAccessAllMenu && slotProps.data.user.id === currentUser.id
            "
            @click="
              emit('update:attendance', {
                data: slotProps.data,
                action: 'Update',
              })
            "
          />
        </div>
      </template>
    </Column>
    <template #empty>
      <div class="text-center">
        No Timesheet found
      </div>
    </template>
  </DataTable>
</template>
