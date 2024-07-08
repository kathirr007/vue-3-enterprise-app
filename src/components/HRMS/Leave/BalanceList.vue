<script setup lang="ts">
// import type { HRHolidayFilterInput } from '@/types/hrms.type';
import type { APIActions } from '@/types/common.type';
import type { HRLeaveBalance, HRLeaveType } from '@/types/hrms.type';
import type { User } from '@/types/teams.type';
import dayjs from 'dayjs';
import { useQuery, useQueryClient } from 'vue-query';

const props = defineProps<{
  // filters?: HRHolidayFilterInput[];
  multiSelect?: boolean;
  hideActions?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'update:leavebalance',
    value: { data: HRLeaveBalance; action: APIActions }
  ): void;
  (
    e: 'delete:leavebalance',
    value: { data: HRLeaveBalance; action: APIActions }
  ): void;
}>();

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
const { getAll: getAllLeaveBalances } = useHrmsLeaveBalance();
const { canDo } = usePermissions();
const { fullName } = useVueFilters();
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
const lastThreeYears = computed(() => {
  const currentYear = dayjs().year();
  const previousYear = currentYear - 1;
  const nextYear = currentYear + 1;
  const lastThreeYears = [currentYear, previousYear, nextYear];
  return lastThreeYears;
});
const selectedLeaveType = ref<HRLeaveType[]>();
const selectedUsers = ref<User[]>();
const selectedYear = ref(lastThreeYears.value[0]);

const { isFetching: loadingLeaveBalance, data: leaveBalances } = useQuery(
  [
    'leavebalance-list',
    ...queryKeys,
    selectedUsers,
    selectedYear,
    selectedLeaveType
  ],
  () => {
    applyFilter('Is Active', undefined);
    applyFilter(
      'userId',
      selectedUsers.value
        ? selectedUsers.value.map((user: User) => user.id)
        : null
    );
    applyFilter(
      'leaveTypeId',
      selectedLeaveType.value
        ? selectedLeaveType.value.map((type: HRLeaveType) => type.id)
        : null
    );
    applyFilter('Year', [selectedYear.value]);

    const leavebalanceFilters = useEncodeFilterData(filterData);
    return getAllLeaveBalances({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: leavebalanceFilters,
      sortBy: querySortBy.value
    });
  }
);

watchEffect(() => {
  if (usersList.value) {
    // selectedUsers.value = [usersList.value[0]];
  }
});
</script>

<template>
  <div class="flex align-items-center pb-3 gap-2">
    <MultiSelect
      v-model="selectedUsers"
      option-label="name"
      :options="usersList"
      :loading="loadingUsers"
      placeholder="Select a user"
      :max-selected-labels="2"
      show-clear
      filter
    />
    <MultiSelect
      v-model="selectedLeaveType"
      option-label="name"
      :options="leaveTypes"
      :loading="loadingLeaveTypes"
      placeholder="Select a leave type"
      :max-selected-labels="2"
      show-clear
      filter
    />
    <Dropdown
      v-model="selectedYear"
      :options="lastThreeYears"
      placeholder="Select a year"
    />
  </div>
  <DataTable
    data-key="id"
    :total-records="leaveBalances?.total"
    :value="leaveBalances?.results"
    :loading="loadingLeaveBalance"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <Column header="Team Member">
      <template #body="{ data }">
        {{ fullName(data.user) }}
      </template>
    </Column>
    <Column header="Leave Type">
      <template #body="{ data }: { data: HRLeaveBalance }">
        {{ `${data.type.name} (${data.type.code})` }}
      </template>
    </Column>
    <Column header="Total Balance" class="text-center" field="days" />
    <Column v-if="canDo('leave', 'edit')" class="text-center w-2">
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
            @click="
              emit('update:leavebalance', {
                data: slotProps.data,
                action: 'Update',
              })
            "
          />
          <!-- <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="
              emit('delete:leavebalance', {
                data: slotProps.data,
                action: 'Remove',
              })
            "
          /> -->
        </div>
      </template>
    </Column>
    <template #empty>
      <div class="text-center">
        No Leave Balance Found
      </div>
    </template>
  </DataTable>
</template>
