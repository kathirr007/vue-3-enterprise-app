<script setup lang="ts">
import type { User } from '@/types/teams.type';
import type { HRLeave, LeaveStatus } from '@/types/hrms.type';
import { useQuery, useQueryClient } from 'vue-query';
import type { APIActions } from '@/types/common.type';

const props = defineProps<{
  multiSelect?: boolean;
  userId?: string;
}>();
const emits = defineEmits(['metaChange']);
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
const { canDo, canAccessAllMenu } = usePermissions();
const { initToast } = useToasts();
const { defaultBreakpoints } = useCommonBreakPoints();
const { getUsers } = useCommonListQueries();
const { getAll } = useHrmsLeaves();
const { fullName, dateToHumanShort, titleCase } = useVueFilters();
const { data: filterData, applyFilter: applyFilterLeave } = useFilterColumns();

const { data: filterDataUser, applyFilter: applyFilterUser }
  = useFilterColumns();

const { currentUser } = useCurrentUserData();

applyFilterUser('Is Active', 'true');
const initialFilterUser = useEncodeFilterData(filterDataUser);
const {
  data: usersList,
  myTeamUsers,
  isLoading: loadingUsers
} = getUsers(false, true, initialFilterUser);

const usersListData = computed(() => {
  if (canAccessAllMenu.value) {
    if (usersList.value && usersList.value.length > 0) {
      const data = usersList?.value.filter(
        user => user.id !== currentUser.value?.id
      );
      return data;
    }
  }
  else {
    if (myTeamUsers.value && myTeamUsers.value.length > 0) {
      const data = myTeamUsers?.value.filter(
        teamUser => teamUser.id !== currentUser.value?.id
      );
      return data;
    }
  }
});

const actionButtonLabel = ref<LeaveStatus>();
const isStatusDialog = ref<boolean>(false);
const selectedCurrentUser = ref<string>();
const selectedUsers = ref<User[]>();
const selectedId = computed(() => {
  if (selectedCurrentUser.value)
    return selectedCurrentUser.value;
  return '';
});
const selectedAPIAction = computed<APIActions>(() => {
  return actionButtonLabel.value === 'APPROVED'
    ? 'Approve'
    : actionButtonLabel.value === 'CANCELLED'
      ? 'Cancel'
      : 'Reject';
});

const { isLoading: loadingLeaves, data: leaves } = useQuery(
  ['leaves-list', ...queryKeys, selectedUsers],
  () => {
    if (props.userId)
      applyFilterLeave('userId', [props.userId]);
    if (selectedUsers.value)
      applyFilterLeave(
        'userId',
        selectedUsers.value
          ? selectedUsers.value.map((user: User) => user)
          : null
      );

    const initialFilters = useEncodeFilterData(filterData);
    return getAll({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: initialFilters,
      sortBy: querySortBy.value
    });
  }
);

function handleCancel(data: HRLeave) {
  selectedCurrentUser.value = data.id;
  isStatusDialog.value = true;
  actionButtonLabel.value = 'CANCELLED';
}
function handleReject(data: HRLeave) {
  selectedCurrentUser.value = data.id;
  isStatusDialog.value = true;
  actionButtonLabel.value = 'REJECTED';
}

function handleApproved(data: HRLeave) {
  selectedCurrentUser.value = data.id;
  isStatusDialog.value = true;
  actionButtonLabel.value = 'APPROVED';
}
function handleSuccess() {
  isStatusDialog.value = false;
  initToast({
    actionType: selectedAPIAction.value,
    title: 'Leave',
    detail: `Leave status updated to <strong>${titleCase(
      actionButtonLabel.value as string
    )}</strong> sucessfully.`
  });
  queryClient.invalidateQueries('leaves-list');
}

const dialogHeader = computed(() => {
  if (actionButtonLabel.value) {
    if (actionButtonLabel.value === 'CANCELLED')
      return 'Cancel Leave';
    if (actionButtonLabel.value === 'APPROVED')
      return 'Approve Leave';
    if (actionButtonLabel.value === 'REJECTED')
      return 'Reject Leave';
  }
});
watchEffect(() => {
  if (usersList.value) {
    // selectedUsers.value = usersList.value[0];
  }
});
</script>

<template>
  <div v-if="!userId" class="flex align-items-center pb-3 gap-2">
    <MultiSelect
      v-model="selectedUsers"
      option-label="name"
      option-value="id"
      :options="usersListData"
      :loading="loadingUsers"
      placeholder="Select a user"
      filter
      :max-selected-labels="2"
    />
  </div>
  <DataTable
    data-key="id"
    :total-records="leaves?.total"
    :value="leaves?.results"
    :loading="loadingLeaves"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <Column v-if="!userId" header="Team Member">
      <template #body="{ data }">
        {{ fullName(data.user) }}
      </template>
    </Column>
    <Column header="From">
      <template #body="{ data }">
        {{ dateToHumanShort(data.startDate) }}
      </template>
    </Column>
    <Column header="To">
      <template #body="{ data }">
        {{ dateToHumanShort(data.endDate) }}
      </template>
    </Column>
    <Column header="Type">
      <template #body="{ data }">
        {{ data.leaveType.name }} ({{ data.leaveType.code }})
      </template>
    </Column>
    <Column header="Reason" field="description" />
    <Column header="Status" field="status" />
    <Column header="Applied On">
      <template #body="{ data }">
        {{ dateToHumanShort(data.createdAt) }}
      </template>
    </Column>
    <Column header="Approved On">
      <template #body="{ data }">
        {{ data.approvedAt ? dateToHumanShort(data.approvedAt) : ' No Date ' }}
      </template>
    </Column>
    <Column header="Reviewed By">
      <template #body="{ data }">
        <span v-if="data.approvedBy">
          {{ fullName(data.approvedBy as User) }}
        </span>
        <span v-else>-</span>
      </template>
    </Column>

    <Column
      v-if="canDo('leave', 'edit')"
      header="Actions"
      class="text-center w-2"
    >
      <template #body="slotProps">
        <div class="flex justify-content-center gap-2">
          <Button
            v-if="
              currentUser.isOwner || slotProps.data.user.id !== currentUser.id
            "
            v-tooltip.top="'Approve'"
            icon="pi pi-check"
            class="p-button-sm p-button-rounded p-button-primary"
            :disabled="
              slotProps.data.status !== 'PENDING'
                || (!canAccessAllMenu && slotProps.data.user.id === currentUser.id)
            "
            @click="handleApproved(slotProps.data)"
          />
          <Button
            v-if="
              currentUser.isOwner || slotProps.data.user.id !== currentUser.id
            "
            v-tooltip.top="'Reject'"
            icon="pi pi-file-excel"
            class="p-button-sm p-button-rounded p-button-danger"
            :disabled="
              slotProps.data.status !== 'PENDING'
                || (!canAccessAllMenu && slotProps.data.user.id === currentUser.id)
            "
            @click="handleReject(slotProps.data)"
          />
          <Button
            v-tooltip.top="'Cancel'"
            icon="pi pi-times"
            class="p-button-sm p-button-rounded p-button-danger"
            :disabled="slotProps.data.status !== 'PENDING'"
            @click="handleCancel(slotProps.data)"
          />
        </div>
      </template>
    </Column>
    <template #empty>
      <div class="text-center">
        No Leaves found
      </div>
    </template>
  </DataTable>
  <Dialog
    v-model:visible="isStatusDialog"
    modal
    append-to="body"
    :header="dialogHeader"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
    @hide="isStatusDialog = false"
  >
    <HRMSLeaveUpdateStatus
      :current-leave-id="selectedId"
      :status="actionButtonLabel as LeaveStatus"
      @success="handleSuccess"
    />
  </Dialog>
</template>
