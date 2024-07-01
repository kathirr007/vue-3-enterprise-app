<script lang="ts" setup>
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type { FileObject, UploadFilesPayload } from '@/types/common.type';
import type {
  FullNameObj,
  UpdateTeamMemberPayload,
  User
} from '@/types/teams.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';

const createLeaveDialog = ref(false);
const showHolidayListDialog = ref(false);
const createTeamMemberDialog = ref(false);
const openRemoveUserPicDialog = ref(false);
const userPictureId = ref('');
const notificationToggle = ref<boolean>(true);

const { getCurrentUser } = useMe();
const { canDo } = usePermissions();
const { defaultBreakpoints } = useCommonBreakPoints();
const { currentUser, isPortalUser, updateUserToken } = useCurrentUserData();
const { fullName, initials } = useVueFilters();
const queryClient = useQueryClient();
const { initToast } = useToasts();
const {
  createAttachment,
  uploadFileRef,
  showFileErrorMessages,
  createFilePayload,
  fileSelected,
  getAttachmentUrl
} = useAttachments();
const { activeTabIndex, tabRef, handleTabChange } = useSteps('myaccount');
const { metaFilter } = useUtilityFns();
const { isFeatureIntegrated, allOrgIntegrationIds } = usePermissions(true);

function showToast() {
  initToast({
    actionType: 'Update',
    title: 'Profile Picture',
    actionObj: { ...userDetails.value },
    detail: `Profile Picture has been updated successfully`
  });
}

const { data: userDetails, isLoading: fetchingUser, isFetching } = useQuery<User>(
  'user-details',
  async () => {
    const currentUserData = await getCurrentUser(currentUser.value?.type === 'CLIENT_USER');
    updateUserToken(currentUserData);
    return currentUserData.user as User;
    // return useUserDetails(currentUser.value.id, isPortalUser.value);
  }, {
    onSuccess: (data) => {
      notificationToggle.value = data.isPushNotificationsEnabled;
    }
  }
);
const { data: userDetailsData, isLoading: fetchingUserDetails } = useQuery<User>(
  'user-details',
  async () => {
    // const currentUserData = await getCurrentUser(currentUser.value?.type === 'CLIENT_USER');
    // updateUserToken(currentUserData);
    // return currentUserData.user as User;
    return useUserDetails(currentUser.value.id, isPortalUser.value);
  }
);

async function handlePushNotifications(value: boolean) {
  const payload = {
    email: userDetails?.value?.email as string,
    isPushNotificationsEnabled: value };
  await userUpdate(payload as unknown as UpdateTeamMemberPayload);
  initToast({
    actionType: 'Update',
    title: 'Push Notifications',
    detail: `Push Notifications has been updated successfully`
  });
  queryClient.invalidateQueries('user-details');
}

async function handleUpdateUser() {
  const payload = {
    email: userDetails?.value?.email as string,
    orgUserRoleId: userDetails?.value?.orgUserRoleId as string,
    designationId: userDetails?.value?.designationId as string,
    picture: userPictureId.value as string
  };
  await userUpdate(payload as unknown as UpdateTeamMemberPayload);
  showToast();
}

async function handlePostAttachment(data: AttachmentResponse) {
  userPictureId.value = data.id;
  await handleUpdateUser();
  queryClient.invalidateQueries('user-details');

  if (currentUser.value?.id === userDetails.value?.id) {
    queryClient.invalidateQueries('logged-in-user');
  }
}

const { mutateAsync: userAttachments } = useMutation(
  async (data: { payload: CreateAttachment; file: UploadFilesPayload }) => {
    return createAttachment({
      payloadData: data,
      fileUploadRef: uploadFileRef
    });
  },
  {
    onSuccess: (data: { res: AttachmentResponse; file: File }) => {
      handlePostAttachment(data.res);
    }
  }
);
const { mutateAsync: removeUserProfilePicture } = useMutation(
  'userProfileDelete',
  async ({ id, pictureId }: { id: string; pictureId: string }) => {
    return useUserProfilePicRemove({
      id,
      pictureId,
      isPortal: isPortalUser.value
    });
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Profile Picture Update',
        detail: `Profile picture Deleted successfully`
      });
    }
  }
);
const { mutateAsync: userUpdate } = useMutation(
  async (payload: UpdateTeamMemberPayload) => {
    return useUserUpdateDetails(
      userDetails.value?.id as string,
      payload,
      isPortalUser.value
    );
  }
);

async function handelDeleteProfile(value: string) {
  userPictureId.value = value;
  openRemoveUserPicDialog.value = true;
}
async function handleUserProfileDelete() {
  await removeUserProfilePicture({
    id: userDetails.value?.id as string,
    pictureId: userPictureId.value as string
  });
  queryClient.invalidateQueries('user-details');
  if (currentUser.value?.id === userDetails.value?.id) {
    queryClient.invalidateQueries('logged-in-user');
  }
}

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await userAttachments({ payload, file: fileSelected.value });
}
function handleSuccess() {
  createLeaveDialog.value = false;
  initToast({
    actionType: 'Create',
    severity: 'success',
    summary: 'Leave Apply ',
    title: 'Leave Apply Sucessfully',
    detail: `Leave has been created sucessfully.`
  });
  queryClient.invalidateQueries('leaves-list');
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="flex flex-column md:flex-row card align-items-end">
    <div class="w-full md:w-7 mb-2 md:mb-0">
      <div class="flex align-items-center">
        <Avatar
          class="mr-2 p-avatar-xxl relative"
          :class="{ 'bg-primary': !userDetails?.picture }"
          size="large"
          shape="circle"
        >
          <template v-if="userDetails?.picture">
            <img
              class="text-sm"
              :src="getAttachmentUrl((userDetails?.picture as Attachment).path)"
              style="vertical-align: middle;"
              :alt="`${fullName(userDetails)}-Profile Picture`"
            >
            <div
              v-tooltip.top="'Update Profile Picture'"
              class="edit-profile-pic"
            >
              <CommonFileUpload
                mode="basic"
                accept="image/*"
                :custom-upload="true"
                hide-choose-button-label
                hide-file-upload-messages
                :multiple="false"
                :auto="true"
                upload-icon="pi pi-pencil"
                class="p-button-icon-only p-button-rounded"
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
            <Button
              v-tooltip.top="'Delete Profile Picture'"
              type="button"
              icon="pi pi-trash"
              class="p-button-rounded p-button-danger -mt-4 remove-profile-pic"
              aria-label="Delete"
              @click="
                handelDeleteProfile(
                  (userDetails?.picture as Attachment)?.id as string,
                )
              "
            />
          </template>
          <template v-else>
            {{ initials(fullName(userDetails as FullNameObj) as string) }}
            <div
              v-tooltip.top="'Upload Profile Picture'"
              class="edit-profile-pic"
            >
              <CommonFileUpload
                mode="basic"
                accept="image/*"
                :custom-upload="true"
                hide-file-upload-messages
                hide-choose-button-label
                :multiple="false"
                :auto="true"
                class="p-button-icon-only p-button-rounded"
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
          </template>
        </Avatar>

        <div class="ml-2 space-y-0.5 flex-1">
          <div>
            <h1 class="text-3xl text-primary mb-0">
              {{ fullName(userDetails as FullNameObj) }}
            </h1>
            <div class="flex flex-column md:flex-row text-base mt-1 mb-2">
              <span
                v-if="userDetails?.invitedBy"
                class="pr-2 border-gray-400 md:border-right-2 text-sm"
              >
                Invited By:
                {{ userDetails?.invitedBy }}
              </span>
              <!-- <span class="hidden md:inline-block mx-2">|</span> -->
              <span v-if="userDetails?.manager" class="md:pl-2 text-sm">
                Report To:
                {{ fullName(userDetails?.manager as FullNameObj) }}
              </span>
            </div>
          </div>
          <div
            v-if="userDetails?.orgRole"
            class="w-full inline-flex align-items-center space-x-2.5"
          >
            <Icon
              icon="fa6-solid:user-tie"
              class="text-2xl text-primary w-2rem"
            />
            <span class="text-gray-800 text-lg flex-1">
              {{ userDetails?.orgRole?.name }}
            </span>
          </div>
          <div
            v-if="userDetails?.designation"
            class="w-full inline-flex align-items-center space-x-2.5"
          >
            <Icon
              class="text-2xl text-primary w-2rem"
              icon="fa6-solid:graduation-cap"
            />
            <span class="text-gray-800 text-lg flex-1">
              {{ userDetails?.designation?.name }}
            </span>
          </div>
          <div
            v-if="isPortalUser && userDetails?.userClients"
            class="w-full inline-flex align-items-center"
          >
            <a
              class="flex align-items-center space-x-2.5"
              :aria-label="userDetails?.userClients[0]?.client?.name"
            >
              <Icon
                class="text-2xl text-primary w-2rem"
                icon="fa6-solid:sitemap"
              />

              <span class="text-gray-800 text-lg flex-1">{{
                userDetails?.userClients[0]?.client?.name
              }}</span>
            </a>
          </div>
          <div
            v-if="
              userDetails?.mobile || userDetails?.phone || userDetails?.email
            "
            class="flex-column md:flex-row w-full inline-flex align-items-start md:align-items-center space-y-2.5 md:space-y-0 md:space-x-2.5"
          >
            <div
              v-if="userDetails?.mobile"
              class="inline-flex align-items-center mr-2"
            >
              <a
                :href="`tel:${userDetails?.mobile}`"
                class="flex align-items-center space-x-2.5"
                :aria-label="userDetails?.mobile"
              >
                <Icon
                  class="text-2xl text-primary w-2rem"
                  icon="fa6-solid:mobile-screen-button"
                />
                <span class="text-gray-800 text-lg flex-1">{{
                  userDetails?.mobile
                }}</span>
              </a>
            </div>
            <div
              v-else-if="userDetails?.phone"
              class="inline-flex align-items-center mr-2"
            >
              <a
                :href="`tel:${userDetails?.phone}`"
                class="flex align-items-center space-x-2.5"
                :aria-label="userDetails?.phone"
              >
                <Icon
                  class="text-2xl text-primary w-2rem"
                  icon="fa6-solid:phone"
                />
                <span class="text-gray-800 text-lg flex-1">{{
                  userDetails?.phone
                }}</span>
              </a>
            </div>

            <div
              v-if="userDetails?.email"
              class="inline-flex align-items-center"
            >
              <a
                :href="`mailto:${userDetails?.email}`"
                class="flex align-items-center space-x-2.5"
                :aria-label="userDetails?.email"
              >
                <Icon
                  class="text-2xl text-primary w-2rem"
                  icon="fa6-solid:envelope"
                />
                <span class="text-gray-800 text-lg flex-1 break-all">{{
                  userDetails?.email
                }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full md:w-5 flex justify-content-end">
      <Button
        v-if="userDetails"
        v-tooltip.top="'Edit'"
        icon="pi pi-pencil"
        class="p-button-sm p-button-rounded"
        aria-label="Edit"
        @click="createTeamMemberDialog = true"
      />
    </div>
  </div>
  <div>
    <TabView
      ref="tabRef"
      v-model:activeIndex="activeTabIndex"
      @tab-change="handleTabChange"
    >
      <TabPanel header=" Details">
        <h2 class="text-3xl text-primary">
          Contact Details
        </h2>
        <TeamsUpdateContactForm :user-id="currentUser.id" />
      </TabPanel>
      <!-- <TabPanel header="Bussiness Hours">

      </TabPanel> -->
      <TabPanel header="Security">
        <h2 class="text-3xl text-primary">
          Security Setting
        </h2>
        <FormTitle title="Change Password" remove-divider class="mb-3" />
        <MyAccountChangePasswordForm />
        <template v-if="!isPortalUser">
          <!-- <Divider />
          <FormTitle
            title="Set Auto Logout Interval"
            remove-divider
            class="mb-3"
          />

          <CommonLoading v-if="fetchingUser" />
          <MyAccountAutoLogoutForm
            v-else-if="userDetails"
            :interval="
              userDetails?.meta
                ? metaFilter(userDetails?.meta, 'autoLogoutInterval')
                : null
            "
            :user-id="currentUser.id"
          /> -->
          <template v-if="!userDetails?.isGoogleUser">
            <Divider />
            <FormTitle
              title="MFA Security"
              subtitle="Enable OTP-based Multi-factor authentication to keep your account
              safe and secure."
              remove-divider
              class="mb-3"
            />
            <CommonLoading v-if="fetchingUser" />
            <div v-else-if="userDetails" class="grid formgrid">
              <div class="col-12 py-2 md:col-6">
                <SecurityMFA :user-details="{ ...userDetails }" />
              </div>
            </div>
          </template>
        </template>
      </TabPanel>
      <template v-if="!isPortalUser">
        <TabPanel
          v-if="isFeatureIntegrated(['hrms'], allOrgIntegrationIds)"
          header="Leaves"
        >
          <CommonPage title="Leaves">
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
            </template>
            <HRMSLeaveList
              v-if="canDo('leave', 'list')"
              :user-id="currentUser.id"
            />
            <p v-else class="text-center font-medium text-xl">
              You don't have access of the Leave list.
            </p>
          </CommonPage>
        </TabPanel>
        <TabPanel
          v-if="isFeatureIntegrated(['hrms'], allOrgIntegrationIds)"
          header="Timesheet"
        >
          <CommonPage title="Timesheet">
            <template #actions>
              <CommonCheckInCheckOut
                class="flex align-items-center justify-content-end"
                show-button
                show-timer
              />
            </template>
            <HRMSTimesheetList
              v-if="canDo('attendance', 'list')"
              my-account
            />
            <p v-else class="text-center font-medium text-xl">
              You don't have access of the Timesheet list.
            </p>
          </CommonPage>
        </TabPanel>
        <TabPanel header="Notifications">
          <FormTitle
            title="Push Notifications"
            subtitle="Enable push notifications for instant updates and a seamless app experience."
            remove-divider
            class="mb-3"
          />
          <CommonLoading v-if="fetchingUser || isFetching" />
          <div v-else-if="userDetails" class="grid formgrid">
            <div class="col-12 py-2 md:col-6">
              <div class="field flex align-items-center">
                <label
                  for="toggleMFA"
                  class="cursor-pointer mb-0 mr-3 font-medium text-900 text-base"
                >
                  {{
                    `${
                      userDetails.isPushNotificationsEnabled
                        ? 'Push Notifications are enabled for your device'
                        : 'Enable Push Notifications'
                    }`
                  }}
                </label>
                <span class="inline-flex cursor-pointer">
                  <InputSwitch
                    v-model="notificationToggle"
                    @input="handlePushNotifications"
                  />
                </span>
              </div>
            </div>
          </div>
        </TabPanel>
      </template>
    </TabView>
  </div>
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
    modal
    append-to="body"
    header="Update Team Memeber"
    class="invite-team-member"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="createTeamMemberDialog = false"
  >
    <TeamsCreateUpdateForm
      :user="userDetails"
      :user-id="currentUser.id"
      @modal-close="createTeamMemberDialog = false"
    />
  </Dialog>
  <CommonConfirmRemoveDialog
    v-if="openRemoveUserPicDialog"
    :visible="openRemoveUserPicDialog"
    :record-to-remove="{
      name: (userDetails?.picture as Attachment)?.name as string,
    }"
    title="Confirm Delete User Profile Picture"
    @confirm="handleUserProfileDelete"
    @hide="openRemoveUserPicDialog = false"
  >
    <div>
      Are you sure you want to Delete the profile picture for
      <strong>{{ fullName(userDetails as FullNameObj) }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>
