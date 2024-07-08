<script setup lang="ts">
import { useMutation, useQueryClient } from 'vue-query';
import type { User } from '@/types/teams.type';
import type { Ref } from 'vue';

const { canDo } = usePermissions();
const toasts = useToasts();
const { fullName } = useVueFilters();
const router = useRouter();
const queryClient = useQueryClient();
const createTeamMemberDialog = ref(false);

const { defaultBreakpoints } = useCommonBreakPoints();
const selectedUser = ref<User>();
const actionType = ref();
const deleteUserDialog = ref(false);
const disableTeamMemberDialog = ref(false);
const { resendVerificationLink } = useAuthVerify();
const email = ref<string>();
const verificationUser = ref(false);

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
function showToast() {
  toasts.showToast({
    severity: actionType.value === 'Delete' ? 'error' : 'success',
    summary: `${actionType.value} User`,
    detail: `User <strong>${
      email.value
    }</strong> ${actionType.value.toLowerCase()}d successfully`
  });
}
function handleRemove() {
  actionType.value = 'Delete';
  handleOperation(deleteUserDialog, showToast);
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
  <CommonPage title="Team Members">
    <!-- <template>
      <div class="w-full max-w-26rem ml-auto mb-6">
        <a
          href="#"
          class="font-medium flex justify-content-end align-items-center"
        >
          <i
            class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
          />
          <span>Help</span>
        </a>
      </div>
    </template> -->
    <!-- <template #helpActions>
      <Button
        label="Need"
        icon="pi pi-youtube"
        class="p-button"
        @click="$router.push({ name: '' })"
      />
    </template> -->
    <template #actions>
      <!-- <Button
        icon="pi"
        class="p-button-rounded"
        @click="createTeamMemberDialog = true"
        v-tooltip.top="'Invite Team Member'"
      >
        <Icon class="flex-none text-xl" icon="fa6-solid:plus" />
      </Button> -->
      <Button
        v-if="canDo('users', 'create')"
        v-tooltip.left="'Add Team Members'"
        icon="pi pi-plus"
        class="p-button-rounded ml-2"
        @click="router.push({ name: 'admin-teams-invite' })"
      />
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
  <Dialog
    v-model:visible="createTeamMemberDialog"
    :modal="true"
    append-to="body"
    header="Create Team Memeber"
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
