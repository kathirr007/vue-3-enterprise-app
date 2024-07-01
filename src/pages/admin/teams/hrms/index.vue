<script setup lang="ts">
import type { APIActions } from '@/types/common.type';
import type { HRAttendance, HRLeave } from '@/types/hrms.type';
import { useMutation, useQueryClient } from 'vue-query';
import TabView from 'primevue/tabview';
import type { User } from '@/types/teams.type';

const createLeaveDialog = ref(false);
const showHolidayListDialog = ref(false);
const isCreateUpdateAttendanceDialog = ref(false);
const selectedAttendance = ref<HRAttendance>();
const createTeamMemberDialog = ref(false);
const selectedUser = ref<User>();
const actionType = ref();
const deleteUserDialog = ref(false);
const disableTeamMemberDialog = ref(false);
const email = ref<string>();

const { isLarge } = useCommonBreakPoints();
const { isPortalUser } = useCurrentUserData();
const { allOrgIntegrationIds, isFeatureIntegrated, featureSubscribed }
  = usePermissions(true);
const router = useRouter();
const { fullName } = useVueFilters();
const { initToast } = useToasts();
function showToast(data: HRLeave | HRAttendance,
  title: string,
  actionType: APIActions,
  detail?: string) {
  initToast({
    actionType,
    title,
    actionObj: { ...data },
    detail
  });
}
const { activeTabIndex, tabRef, handleTabChange }
  = useSteps('admin-teams-hrms');
const { canDo } = usePermissions();

const { defaultBreakpoints, styles } = useCommonBreakPoints();
const queryClient = useQueryClient();
const { currentUser } = useCurrentUserData();
function prepareForAttendanceActions(data: {
  data: HRAttendance;
  action: APIActions;
}) {
  selectedAttendance.value = data.data;
  if (data.action === 'Update')
    isCreateUpdateAttendanceDialog.value = true;
}

/* const { data: teamLimits } = useQuery('team-limit', () => {
  return getResourceLimits({ resource: ResourceType['team member'] });
});

const teamResource = computed(() => {
  const limitComputed = teamLimits.value?.[0].limit === -1 ? 0 : teamLimits.value?.[0].limit;
  const usageComputed = teamLimits.value?.[0].orgSubscriptionResourceUsages ? teamLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: teamResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'team-limit',
  resource: 'team member'
});

function handleSuccess() {
  createLeaveDialog.value = false;
  initToast({
    actionType: 'Create',
    severity: 'success',
    summary: 'Leave Apply ',
    title: 'Leave Apply Successfully',
    detail: `Leave has been created successfully.`
  });
  queryClient.invalidateQueries('leaves-list');
}

function prepareForRemove(data: User) {
  selectedUser.value = data;
  deleteUserDialog.value = true;
}
function handleDisable(data: User) {
  selectedUser.value = data;
  disableTeamMemberDialog.value = true;
}
function handleResendVerify(data: User) {
  email.value = data.email;
}
function handleOperation(dialog: Ref<boolean>, toastFn: () => void) {
  dialog.value = false;
  if (toastFn && typeof toastFn === 'function') {
    toastFn();
  }
  selectedUser.value = undefined;
  queryClient.invalidateQueries('teams-list');
}
function showTeamToast() {
  initToast({
    actionType: actionType.value,
    severity: actionType.value === 'Delete' ? 'error' : 'success',
    summary: `${actionType.value} User`,
    detail: `User <strong>${
      email.value
    }</strong> ${actionType.value.toLowerCase()}d successfully`
  });
}
function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteUserDialog, showTeamToast);
}
function closeConfirmRemoveDialog() {
  deleteUserDialog.value = false;
}
const { mutateAsync: userDelete } = useMutation(
  'userDelete',
  async (id: string | null) => {
    return useUserRemove(id as string);
  },
  {
    onSuccess: () => handleRemove()
  }
);
function deleteUser() {
  if (selectedUser.value !== undefined) {
    userDelete(selectedUser.value.id);
  }
}
const { mutateAsync: userDisable } = useMutation(
  'userDisable',
  async (id: string) => {
    return useUserDisable({ id });
  }
);
const { mutateAsync: userEnable } = useMutation(
  'UserEnable',
  async (id: string | null) => {
    return useUserEnable(id);
  }
);

async function handleActivation() {
  if (selectedUser.value?.isActive) {
    await userDisable(selectedUser.value?.id as string);
    queryClient.invalidateQueries('teams-list');
  }
  else {
    await userEnable(selectedUser.value?.id as string);
    queryClient.invalidateQueries('teams-list');
  }
}
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
    @tab-click="handleTabChange"
  >
    <TabPanel header="Team">
      <CommonPage title="Team Members">
        <template #actions>
          <span
            v-tooltip.left="`${teamResource.limit && (teamResource.usage >= teamResource.limit) ? `Can't create more than available limit ${teamResource.limit}` : teamResource.limit && (teamResource.usage >= teamResource.limit) ? `Available limit of ${teamResource.limit} team members already created` : 'Add Team Members'}`"
          >

            <Button
              v-if="canDo('users', 'create')"
              icon="pi pi-plus"
              class="p-button-rounded ml-2"
              :disabled="teamResource.limit && (teamResource.usage >= teamResource.limit)"
              @click="router.push({ name: 'admin-teams-invite' })"
            />
          </span>
        </template>
        <TeamsList
          v-if="canDo('users', 'list')"
          @delete:user="prepareForRemove"
          @disable:user="handleDisable"
          @resend-verify:user="handleResendVerify"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Team Members list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel header="Outsourced Team">
      <Common426
        v-if="featureSubscribed('hrms', 'contractual_team') === false"
        feature="Outsourced team"
      />
      <CommonPage v-else title="Outsourced Team Members">
        <template #actions>
          <Button
            v-if="canDo('users', 'create')"
            v-tooltip.left="'Add Outsourced Team Members'"
            icon="pi pi-plus"
            class="p-button-rounded ml-2"
            @click="router.push({ name: 'admin-outsourced-teams-invite' })"
          />
        </template>
        <TeamsList
          v-if="canDo('users', 'list')"
          is-contractual-teams
          @delete:user="prepareForRemove"
          @disable:user="handleDisable"
          @resend-verify:user="handleResendVerify"
        />
        <div v-else class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Outsourced Team Members list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel
      v-if="isLarge && isFeatureIntegrated(['hrms'], allOrgIntegrationIds)"
      header="Attendance"
    >
      <Common426
        v-if="featureSubscribed('hrms', 'attendance') === false"
        feature="attendance"
      />
      <CommonPage v-else title="Attendance">
        <template #actions>
          <Button
            v-if="canDo('attendance', 'create')"
            v-tooltip.left="'Create Attendance'"
            icon="pi pi-plus"
            class="ml-2 p-button-rounded"
            @click="isCreateUpdateAttendanceDialog = true"
          />
          <a
            href="https://brightreturn.com/kb/hrms-management-for-cpa-firm"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a>
        </template>
        <div class="card">
          <HRMSTimesheetList
            v-if="canDo('attendance', 'list')"
            @update:attendance="prepareForAttendanceActions"
          />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Attendance list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel
      v-if="isLarge && isFeatureIntegrated(['hrms'], allOrgIntegrationIds)"
      header="My Leaves"
    >
      <Common426 v-if="featureSubscribed('hrms', 'leaves') === false" feature="leaves" />
      <CommonPage v-else title="My Leaves">
        <template #actions>
          <Button
            class="p-button mr-2"
            label="Holiday List"
            @click="showHolidayListDialog = true"
          />
          <Button
            v-if="canDo('leave', 'create')"
            class="p-button"
            label="Apply For Leave"
            @click="createLeaveDialog = true"
          />
          <a
            href="https://brightreturn.com/kb/hrms-management-for-cpa-firm"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a>
        </template>
        <div class="card">
          <HRMSLeaveList
            v-if="canDo('leave', 'list')"
            :user-id="currentUser.id"
          />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Leave list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel
      v-if="isLarge && isFeatureIntegrated(['hrms'], allOrgIntegrationIds)"
      header="Approvals"
    >
      <Common426
        v-if="featureSubscribed('hrms', 'holiday') === false"
        feature="approvals"
      />
      <CommonPage v-else title="Approvals">
        <template #actions>
          <a
            href="https://brightreturn.com/kb/hrms-management-for-cpa-firm"
            target="_blank"
          >
            <Button
              v-tooltip.top="'Need Help'"
              type="button"
              icon="pi pi-question-circle text-lg"
              class="p-button-icon-only p-button-rounded ml-2"
            />
          </a>
        </template>
        <div class="card">
          <HRMSLeaveList v-if="canDo('leave', 'list')" />
          <p v-else class="text-center font-medium text-xl">
            You don't have access of the Leave list.
          </p>
        </div>
      </CommonPage>
    </TabPanel>
  </TabView>

  <Dialog
    v-model:visible="isCreateUpdateAttendanceDialog"
    :modal="true"
    append-to="body"
    :header="selectedAttendance ? 'Update Attendance' : 'Create Attendance'"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="selectedAttendance = undefined"
  >
    <HRMSTimesheetCreateForm
      :attendance="selectedAttendance"
      @success="isCreateUpdateAttendanceDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="showHolidayListDialog"
    modal
    append-to="body"
    header="Holiday List"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="showHolidayListDialog = false"
  >
    <HRMSHolidayList :hide-actions="true" />
  </Dialog>
  <Dialog
    v-model:visible="createLeaveDialog"
    modal
    append-to="body"
    header="Apply Leave"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '40vw' }"
    content-class="border-round-bottom-md"
    @hide="createLeaveDialog = false"
  >
    <HRMSLeaveCreateForm
      :user-id="currentUser.id"
      @success="handleSuccess"
      @close="createLeaveDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="createTeamMemberDialog"
    :modal="true"
    append-to="body"
    header="Create Team Member"
    class="invite-team-member"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="createTeamMemberDialog = false"
  >
    <TeamsCreateUpdateForm @modal-close="createTeamMemberDialog = false" />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="selectedUser && deleteUserDialog"
    :visible="deleteUserDialog"
    :record-to-remove="selectedUser as Record<string, any>"
    title="Confirm Delete User"
    class="remove-dialog"
    @confirm="deleteUser"
    @hide="closeConfirmRemoveDialog"
  />
  <CommonConfirmRemoveDialog
    v-if="selectedUser && disableTeamMemberDialog"
    :visible="disableTeamMemberDialog"
    :record-to-remove="
      { ...selectedUser, name: fullName(selectedUser) } as Record<string, any>
    "
    title="Confirm Disable Team Member"
    @confirm="handleActivation"
    @hide="disableTeamMemberDialog = false"
  >
    <div>
      Are you sure you want to
      {{ selectedUser.isActive ? 'Deactivate' : 'Activate' }}
      <strong> {{ fullName(selectedUser) }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped></style>
