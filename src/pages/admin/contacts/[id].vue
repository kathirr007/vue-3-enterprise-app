<script lang="ts" setup>
import type {
  APIActions,
  FileObject,
  FullNameObject,
  MetaObj,
  UploadFilesPayload
} from '@/types/common.type';
import { useRouteQuery } from '@vueuse/router';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type {
  ContactAddClientsPayload,
  UserContact
} from '@/types/contacts.type';
import type { Client } from '@/types/client.type';

const pictureId = ref<string>();
const queryTaskType = useRouteQuery<string>('entityType');
// const activeIndex = useRouteQuery<string>('activeIndex');
const randomKey = ref(Math.floor(Math.random() * 100));
const updateContactDialog = ref(false);
const removeTeamMemberDialog = ref(false);
const disableTeamMemberDialog = ref(false);
const openRemoveUserPicDialog = ref(false);
const removeContactClientDialog = ref(false);
const selectedClientToRemove = ref<Partial<Client>>();
const addClientsDialog = ref(false);
const userPictureId = ref<string>('');
const disabledTooltip = ref(`${$tConfig('CONTACT')} is disabled, Please enable the ${$tConfig('CONTACT').toLowerCase()}.`);

const { canDo } = usePermissions();
const { currentUser } = useCurrentUserData();
const queryClient = useQueryClient();
const route = useRoute();
const contactId = ref(route.params.id as string);
const { initToast } = useToasts();
const { resendVerificationLink } = useAuthVerify();
const { defaultBreakpoints } = useCommonBreakPoints();
const { fullName, initials } = useVueFilters();
const { getGettingStartedSteps } = useCommonListQueries();
const { activeTabIndex, activeIndex, handleStep, handleTabChange, tabRef }
  = useSteps('admin-contacts-id');
const { updateBreadcrumb } = useBreadcrumbs();
const {
  createAttachment,
  uploadFileRef,
  showFileErrorMessages,
  createFilePayload,
  fileSelected,
  getAttachmentUrl
} = useAttachments();
const { handleTooltip } = useTooltip();
const {
  getOne: getContactDetails,
  detachClients,
  addPicture,
  removePicture
} = useContacts();

function showProfilePictureToast(actionType: APIActions) {
  initToast({
    actionType,
    title: `${$tConfig('CONTACT')} Picture`,
    detail: `${$tConfig('CONTACT')} picture ${actionType.toLowerCase()}d successfully.`
  });
}
const canBeDisabled = computed(() => {
  // return Math.floor(Math.random() * 100) % 2 === 0 ? true : false;
  return (
    (
      Object.values(
        contactDetails.value?._count as { [s: string]: number }
      ) as number[]
    ).reduce((prev, curr) => prev + curr, 0) === 0
  );
});
/* const replacingUsersList = computed(() => {
  return usersListOptions.value?.filter(
    (user: UserContact) => user.id !== contactDetails.value?.id
  );
}); */

const {
  data: contactDetails,
  isLoading: loadingContact,
  isFetching: fetchingContact
} = useQuery<UserContact>(
  'contact-details',
  async () => {
    return getContactDetails(contactId.value);
  },
  {
    onSuccess: (data: UserContact) => {
      if (data) {
        updateBreadcrumb({
          breadcrumbs: [
            { label: `My ${$tConfig('CLIENT')}` },
            {
              label: `${$tConfig('CONTACT')}s`,
              to: { name: 'admin-contacts', query: { activeIndex: 0 } }
            },
            { label: fullName(data) as string }
          ]
        });
      }
    }
  }
);

const canDoActions = computed(() => contactDetails.value?.isActive);
const activeStatus = computed(() => {
  return contactDetails.value?.isActive ? 'Deactivate' : 'Activate';
});
const isUserVerified = computed(() => contactDetails.value?.isVerified);
const userClientsData = computed(() => {
  if (contactDetails.value) {
    return contactDetails.value?.userClients.map(({ client }) => {
      const clonedClient = { ...client };
      if (clonedClient.meta && clonedClient.meta.length > 0) {
        clonedClient.meta.forEach((meta: MetaObj) => {
          clonedClient[meta.metaKey] = meta.metaValue;
        });
      }
      return clonedClient;
    });
  }
  return [];
});

provide('disabledTooltip', disabledTooltip);
provide('canDoActions', canDoActions);

function handleAction(data: UserContact, actionType: APIActions) {
  initToast({
    actionType,
    title: 'Team Member',
    actionObj: { ...data },
    detail: `Team Member <strong>${fullName(
      contactDetails.value as unknown as FullNameObject
    )}</strong> ${activeStatus.value}d successfully`
  });
  queryClient.invalidateQueries('contact-details');
}

function userDisableMessage(countProp: string, countValue: number) {
  switch (countProp) {
    case 'watchingEntities':
      return countValue > 1
        ? 'tasks, he/she is reviewing.'
        : 'task, he/she is reviewing.';
    case 'assignedEntities':
      return countValue > 1 ? 'tasks assigned.' : 'task assigned.';
    case 'managingClients':
      return countValue > 1
        ? `${$tConfig('CLIENT').toLowerCase()}s, he/she is managing.`
        : `${$tConfig('CLIENT').toLowerCase()}, he/she is managing.`;
    case 'assignedClients':
      return countValue > 1
        ? `${$tConfig('CLIENT').toLowerCase()}s, he/she is a working team member.`
        : `${$tConfig('CLIENT').toLowerCase()}, he/she is a working team member.`;
    case 'managingProjects':
      return countValue > 1
        ? 'projects, he/she is managing.'
        : 'project, he/she is managing.';
    case 'reportees':
      return countValue > 1
        ? 'users reporting to him/her.'
        : 'user reporting to him/her.';
    default:
      return '';
  }
}

/* const { mutateAsync: userDisable, isLoading: disablingUser } = useMutation(
  'userDisable',
  async ({
    id,
    payload,
  }: {
    id: string;
    payload?: DisableTeamMemberPayload;
  }) => {
    return useUserDisable({ id, payload });
  },
  {
    onSuccess: (data: UserContact) => handleAction(data, 'Update'),
  }
); */
const { mutateAsync: userDelete } = useMutation(
  'userDelete',
  async (id: string) => {
    return useUserRemove(id);
  },
  {
    onSuccess: (data: UserContact) => handleAction(data, 'Delete')
  }
);
/* const { mutateAsync: userEnable } = useMutation(
  'UserEnable',
  async (id: string | null) => {
    return useUserEnable(id);
  },
  {
    onSuccess: (data: UserContact) => handleAction(data, 'Update'),
  }
); */
const { mutateAsync: removeContactPicture, isLoading: removingContactPicture }
  = useMutation(
    'contactPictureDelete',
    async (pictureId: string) => {
      return removePicture(contactId.value as string, pictureId);
    },
    {
      onSuccess: () => {
        showProfilePictureToast('Remove');
        queryClient.invalidateQueries('contact-details');
      }
    }
  );

/* const handleActivation = async (
  status: string,
  payload?: DisableTeamMemberPayload
) => {
  if (status === 'Activate') {
    await userEnable(contactId.value as string);
    queryClient.invalidateQueries('contact-details');
  } else {
    await userDisable({ id: contactId.value as string, payload });
    queryClient.invalidateQueries('contact-details');
  }
}; */

const { value: replacingUserId } = useField<string>('replacingUserId');

/* const onSubmit = handleSubmit(async (values) => {
  await handleActivation(activeStatus.value, {
    replacingUserId: values.replacingUserId as string,
  });
  resetForm();
  disableTeamMemberDialog.value = false;
}); */

async function handleDelete() {
  await userDelete(contactId.value as string);
  queryClient.invalidateQueries('contact-details');
}

const { mutateAsync: resendVerification, isLoading: sendingLink } = useMutation(
  (payload: { email: string }) => resendVerificationLink(payload),
  {
    onSuccess: (data) => {
      initToast({
        actionType: 'Update',
        summary: 'Resend Verification Link',
        detail: `Verification link has been sent to <strong>${contactDetails.value?.email}</strong> successfully`
      });
    }
  }
);
const { mutateAsync: addContactPicture } = useMutation(
  async (pictureId: string) => {
    return addPicture(contactId.value as string, pictureId);
  }
);

async function handelDeleteProfile(value: string) {
  userPictureId.value = value;
  openRemoveUserPicDialog.value = true;
}
async function handleContactPictureDelete() {
  await removeContactPicture(userPictureId.value as string);
  queryClient.invalidateQueries('contact-details');
}

async function handleUpdateContactPicture() {
  await addContactPicture(pictureId.value as string);
  showProfilePictureToast('Update');
}

async function handlePostAttachment(data: AttachmentResponse) {
  pictureId.value = data.id;
  await handleUpdateContactPicture();
  queryClient.invalidateQueries('contact-details');
}

const { mutateAsync: contactAttachments, isLoading: uploadingPicture }
  = useMutation(
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

const { mutateAsync: removeContactClient, isLoading: removingClient }
  = useMutation(
    ['detach-clients'],
    ({ id, payload }: { id: string; payload: ContactAddClientsPayload }) =>
      detachClients({ id, payload }),
    {
      onSuccess: (data: any) => {
        if (data) {
          initToast({
            actionType: 'Remove',
            severity: 'error',
            summary: `Remove ${$tConfig('CLIENT')}`,
            detail: `${$tConfig('CLIENT')} <strong>${selectedClientToRemove.value
              ?.name}</strong> removed from <strong>${fullName(
              contactDetails.value as FullNameObject
            )}</strong>`
          });
          selectedClientToRemove.value = undefined;
        }
        queryClient.invalidateQueries('contact-details');
      }
    }
  );

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await contactAttachments({ payload, file: fileSelected.value });
}

function prepareRemoveClient(data: Client) {
  selectedClientToRemove.value = data;
  removeContactClientDialog.value = true;
}

async function handleRemoveClient() {
  await removeContactClient({
    id: contactDetails.value?.id as string,
    payload: {
      clientIds: [selectedClientToRemove.value?.id as string]
    }
  });
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
          size="large"
          shape="circle"
          :class="{ 'bg-primary': !contactDetails?.picture }"
        >
          <template v-if="contactDetails?.picture">
            <img
              class="text-sm"
              :src="`${getAttachmentUrl(
                (contactDetails?.picture as Attachment).path,
              )}`"
              style="vertical-align: middle;"
              :alt="`${fullName(contactDetails)} Picture`"
            >
            <div
              v-tooltip.top="
                `${canDoActions ? `Update ${$tConfig('CONTACT')} Picture` : disabledTooltip}`
              "
              :class="{ disabled: !canDoActions }"
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
                :upload-icon="
                  uploadingPicture ? 'pi pi-spin pi-spinner' : 'pi pi-pencil'
                "
                class="p-button-icon-only p-button-rounded"
                :class="{ 'pointer-events-none': !canDoActions }"
                @uploader="uploadFile"
                @file-error-messages="showFileErrorMessages"
              />
            </div>
            <div
              v-tooltip.top="
                `${canDoActions ? 'Delete Profile Picture' : disabledTooltip}`
              "
              class="remove-profile-pic"
              :class="{ disabled: !canDoActions }"
            >
              <Button
                :disabled="!canDoActions"
                type="button"
                :icon="
                  removingContactPicture
                    ? 'pi pi-spin pi-spinner'
                    : 'pi pi-trash'
                "
                class="p-button-rounded p-button-danger"
                aria-label="Delete"
                @click="
                  handelDeleteProfile(
                    (contactDetails?.picture as Attachment)?.id as string,
                  )
                "
              />
            </div>
          </template>
          <template v-else>
            {{ initials(fullName(contactDetails as FullNameObject) as string) }}
            <div
              v-tooltip.top="
                `${canDoActions ? `Upload ${$tConfig('CONTACT')} Picture` : disabledTooltip}`
              "
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
                :upload-icon="
                  uploadingPicture ? 'pi pi-spin pi-spinner' : 'pi pi-upload'
                "
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
              {{ fullName(contactDetails as FullNameObject) }}
            </h1>
          </div>
          <div
            v-if="contactDetails?.mobile || contactDetails?.email"
            class="flex-column md:flex-row w-full inline-flex align-items-start md:align-items-center space-y-2.5 md:space-y-0 md:space-x-2.5"
          >
            <div
              v-if="contactDetails?.email"
              class="inline-flex align-items-center"
            >
              <a
                :href="`mailto:${contactDetails?.email}`"
                class="flex align-items-center space-x-2.5"
                :aria-label="contactDetails?.email"
              >
                <Icon
                  class="text-2xl text-primary w-2rem"
                  icon="fa6-solid:envelope"
                />
                <span class="text-gray-800 text-lg break-all flex-1">{{
                  contactDetails?.email
                }}</span>
              </a>
            </div>
          </div>
          <div
            v-if="contactDetails?.mobile"
            class="inline-flex align-items-center mr-2"
          >
            <a
              :href="`tel:${contactDetails?.mobile}`"
              class="flex align-items-center space-x-2.5"
              :aria-label="contactDetails?.mobile"
            >
              <Icon
                class="text-2xl text-primary w-2rem"
                icon="fa6-solid:mobile-screen-button"
              />
              <span class="text-gray-800 text-lg flex-1">{{
                contactDetails?.mobile
              }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full md:w-5 flex justify-content-end gap-1">
      <div
        v-tooltip.top="handleTooltip(!!canDoActions, 'Edit', disabledTooltip)"
        style="height: 2.357rem;"
      >
        <Button
          v-if="canDo('contacts', 'edit') && contactDetails"
          v-tooltip.top="'Edit'"
          :disabled="!canDoActions"
          icon="pi pi-pencil"
          class="p-button-sm p-button-rounded"
          aria-label="Edit"
          @click="updateContactDialog = true"
        />
      </div>
      <div
        v-if="contactDetails?.userClients.length && !isUserVerified"
        v-tooltip.top="
          handleTooltip(
            !!canDoActions,
            'Send verification link',
            disabledTooltip,
          )
        "
        style="height: 2.357rem;"
      >
        <Button
          :disabled="!canDoActions || sendingLink"
          icon="pi"
          class="p-button-sm p-button-rounded p-button"
          :loading="sendingLink"
          @click="resendVerification({ email: `${contactDetails?.email}` })"
        >
          <i v-if="sendingLink" class="pi pi-spin pi-spinner" />
          <Icon
            v-else
            class="flex-none text-base"
            icon="fa6-solid:share-from-square"
          />
        </Button>
      </div>
      <!-- <Button
        v-if="canDo('users', 'delete')"
        :icon="canDoActions ? 'pi pi-ban' : 'pi pi-check-circle'"
        class="p-button-sm p-button-rounded"
        :class="canDoActions ? 'p-button-danger' : 'p-button-success'"
        @click="disableTeamMemberDialog = true"
        v-tooltip.top="activeStatus"
        :aria-label="activeStatus"
      />
      <Button
        icon="pi pi-trash"
        class="p-button-sm p-button-rounded p-button-danger"
        @click="removeTeamMemberDialog = true"
        v-tooltip.top="'Delete'"
        aria-label="Delete"
      /> -->
    </div>
  </div>
  <div>
    <TabView
      ref="tabRef"
      v-model:activeIndex="activeTabIndex"
      lazy
      @tab-change="handleTabChange"
    >
      <TabPanel :header="`${$tConfig('CLIENT')}s`">
        <div class="flex justify-content-between mb-4">
          <h2 class="text-3xl text-primary">
            Assigned {{ `${$tConfig('CLIENT')}` }}s
          </h2>
          <Button
            v-if="canDo('contacts', 'edit')"
            v-tooltip.left="`Add ${$tConfig('CLIENT')}s`"
            icon="pi pi-plus"
            class="p-button-sm p-button-rounded"
            @click="addClientsDialog = true"
          />
        </div>
        <ClientsList
          :clients-list="(userClientsData as Client[])"
          hide-filters
          is-contact-list
          @delete:client="prepareRemoveClient"
          @create:client="addClientsDialog = true"
        />
      </TabPanel>
    </TabView>
  </div>
  <CommonConfirmRemoveDialog
    v-if="contactDetails && removeTeamMemberDialog"
    :visible="removeTeamMemberDialog"
    :record-to-remove="(contactDetails as Record<string, any>)"
    title="Remove Team Member"
    @confirm="handleDelete"
    @hide="removeTeamMemberDialog = false"
  />
  <CommonConfirmRemoveDialog
    v-if="removeContactClientDialog"
    :visible="removeContactClientDialog"
    :record-to-remove="(selectedClientToRemove as Record<string, any>)"
    :title="`Remove ${$tConfig('CLIENT')}`"
    class="remove-dialog"
    :is-remove="true"
    @confirm="handleRemoveClient"
    @hide="removeContactClientDialog = false"
  />
  <CommonConfirmRemoveDialog
    v-if="openRemoveUserPicDialog"
    :visible="openRemoveUserPicDialog"
    :record-to-remove="{
      name: (contactDetails?.picture as Attachment)?.name as string,
    }"
    :title="`Confirm Remove User${$tConfig('CONTACT')} Profile Picture`"
    @confirm="handleContactPictureDelete"
    @hide="openRemoveUserPicDialog = false"
  >
    <div>
      Are you sure you want to {{ 'Remove' }} the profile picture for
      <strong>{{ fullName(contactDetails as FullNameObject) }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
  <!-- <CommonConfirmRemoveDialog
    v-if="contactDetails && disableTeamMemberDialog"
    :visible="disableTeamMemberDialog"
    :hideButtons="!canBeDisabled && activeStatus !== 'Activate'"
    :recordToRemove="
      { ...contactDetails, name: fullName(contactDetails) } as Record<
        string,
        any
      >
    "
    :title="`Confirm ${
      activeStatus === 'Activate' ? 'Enable' : 'Disable'
    } Team Member`"
    class="remove-dialog"
    @confirm="handleActivation(activeStatus)"
    @hide="disableTeamMemberDialog = false"
  >
    <div v-if="canBeDisabled || activeStatus === 'Activate'">
      Are you sure you want to
      {{ activeStatus }}
      <strong> {{ fullName(contactDetails) }}</strong
      >?
    </div>
    <div v-else>
      <div>
        <strong> {{ fullName(contactDetails) }} </strong> has following
        dependencies:
        <ul>
          <template
            v-for="(value, key, index) in contactDetails._count"
            :key="index"
          >
            <li v-if="value">
              There {{ value > 1 ? 'are' : 'is' }}
              <strong> {{ value }} </strong>
              {{ userDisableMessage(key, value) }}
            </li>
          </template>
        </ul>

        <p>
          To disable <strong>{{ fullName(contactDetails) }}</strong
          >, please select alternate team member to whom you want to assign all
          the above liablilities.
        </p>
      </div>
      <form @submit="onSubmit" class="text-left mt-4">
        <div class="field">
          <label for="replacingUserId" class="block font-medium text-900">
            Choose from current team
            <span class="text-red-600">*</span>
          </label>
          <Dropdown
            class="w-20rem"
            v-model="replacingUserId"
            optionLabel="name"
            optionValue="id"
            :options="replacingUsersList"
            placeholder="Select a team member"
            showClear
            filter
            :class="{ 'p-invalid': errors['replacingUserId'] }"
            @blur="validate()"
          >
          </Dropdown>
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              :success-class="'font-medium'"
              :errors="errors"
              :values="values"
              :feedback="false"
              :errorKey="'replacingUserId'"
            />
          </transition>
        </div>
        <div class="flex justify-content-between">
          <Button
            label="Submit"
            :disabled="!meta.valid"
            :loading="disablingUser"
            type="submit"
            class="ml-auto"
          ></Button>
        </div>
      </form>
    </div>
  </CommonConfirmRemoveDialog> -->

  <Dialog
    v-model:visible="updateContactDialog"
    modal
    append-to="body"
    :header="`Update ${$tConfig('CONTACT')}`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="updateContactDialog = false"
  >
    <ContactsAddDetailsForm
      :key="randomKey"
      :contact-details="contactDetails"
      @modal-close="updateContactDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="addClientsDialog"
    modal
    append-to="body"
    :header="`Add ${$tConfig('CLIENT')}s`"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '35vw' }"
    content-class="border-round-bottom-md"
    @hide="addClientsDialog = false"
  >
    <ContactsAddClientForm
      :key="randomKey"
      :contact-details="contactDetails"
      :add-client="false"
      hide-skip
      @modal-close="addClientsDialog = false"
    />
  </Dialog>
</template>

<style lang="scss" scoped>
:deep(*) {
  .comments-container {
    max-height: calc(20rem - 55px) !important;
    overflow-y: auto !important;
  }
}
</style>
