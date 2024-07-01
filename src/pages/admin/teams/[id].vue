<script lang="ts" setup>
import type {
  APIActions,
  FileObject,
  UploadFilesPayload
} from '@/types/common.type';
import type { Card } from '@/types/dashboard.type';
import type {
  DisableTeamMemberPayload,
  FullNameObj,
  UpdateTeamMemberPayload,
  User
} from '@/types/teams.type';
import { DisableTeamMemberSchema } from '@/types/teams.type';
import { useRouteQuery } from '@vueuse/router';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type {
  Attachment,
  AttachmentResponse,
  CreateAttachment
} from '@/types/attachment.type';
import type { EntityType } from '@/types/tasks.type';
import type { DropdownChangeEvent } from 'primevue/dropdown';

const { overDue } = useOverDueColor();
const { isFeatureIntegrated, allOrgIntegrationIds, featureSubscribed }
  = usePermissions(true);
const pictureId = ref<string>();
const cards = ref<Card[]>([
  {
    id: 'totalCompletedTasks',
    title: 'Total Completed Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'pi pi-check'
  },
  {
    id: 'incompleteTasks',
    title: 'Incomplete Tasks',
    value: '',
    color: '',
    icon: 'clarity:tasks-outline-alerted',
    iconify: true
  },
  {
    id: 'overDueTasks',
    title: 'Over Due Tasks',
    value: '',
    color: '',
    icon: 'ic:outline-priority-high',
    iconify: true
  },
  {
    id: 'totalTasks',
    title: 'Total Tasks',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'ic:round-format-list-bulleted',
    iconify: true
  },
  {
    id: 'totalTimeSpent',
    title: 'Total Time Spent',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
    icon: 'pi pi-clock'
  }
]);
const _data = reactive({
  labels: [] as string[],
  datasets: [
    {
      data: [] as number[],
      backgroundColor: [] as string[]
    }
  ]
});
const colorForChart = ref({
  light: [
    '#FFC3A3',
    '#87D6CD',
    '#EDBEE7',
    '#B8DEB4',
    '#96C9FF',
    '#C4A78D',
    '#9CA2A6',
    '#E6D3B5',
    '#B4B9D9',
    '#FFE3A3',
    '#96C9FF',
    '#B8DEB4',
    '#EDBEE7',
    '#87D6CD',
    '#FFC3A3',
    '#E6F69D',
    '#AADEA7',
    '#F66D44',
    '#9BBFE0',
    '#E8A09A',
    '#C6D68F',
    '#64C2A6',
    '#2D87BB',
    '#FBE29F',
    '#A5C1DC',
    '#FFAB05',
    '#FF6B45',
    '#FF2E7E',
    '#0674C4',
    '#E9F6FA',
    '#77DD77',
    '#7AC142',
    '#F47A1F',
    '#FDBB2F',
    '#007CC3',
    '#E6F69D'
  ]
});
const lightOptions = {
  responsive: true,
  plugins: {
    legend: {
      labels: {
        color: '#495057'
      },
      position: 'bottom'
    }
  }
};

const queryTaskType = useRouteQuery<string>('entityType');
// const activeIndex = useRouteQuery<string>('activeIndex');
const currentStatus = ref<string>();
const randomKey = ref(Math.floor(Math.random() * 100));
const isDialogVisibleQuickStart = ref(false);
const createTeamMemberDialog = ref(false);
const removeTeamMemberDialog = ref(false);
const disableTeamMemberDialog = ref(false);
const openRemoveUserPicDialog = ref(false);
const userPictureId = ref<string>('');
const tasksListRef = ref();
const selectedTaskType = ref<EntityType>(
  queryTaskType.value ? (queryTaskType.value as EntityType) : 'TASK'
);
const taskStatusOptions = ref([
  {
    name: 'Team Tasks',
    value: 'TASK'
  },
  { name: 'Client Request', value: 'CLIENTTASK' }
]);
const disabledTooltip = ref('User is disabled, Please enable the user.');

const { handleSubmit, errors, values, meta, validate, resetForm } = useForm({
  validationSchema: DisableTeamMemberSchema
});
const router = useRouter();
const { canDo } = usePermissions();
const { getTeamDashboard } = useDashboardMatrix();
const { currentUser } = useCurrentUserData();
const queryClient = useQueryClient();
const route = useRoute();
const userId = ref(route.params.id as string);
const { initToast } = useToasts();
const { resendVerificationLink } = useAuthVerify();
const { defaultBreakpoints } = useCommonBreakPoints();
const { fullName, initials } = useVueFilters();
const { getGettingStartedSteps } = useCommonListQueries();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Is Active', 'true');
const initialFilters = useEncodeFilterData(filterData);
const { usersListOptions } = useUserListOptions(
  disableTeamMemberDialog,
  initialFilters
);
const { activeTabIndex, activeIndex, handleStep, handleTabChange, tabRef }
  = useSteps('admin-teams-id');
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

function showToast() {
  initToast({
    actionType: 'Update',
    title: 'Team Member',
    actionObj: { ...userDetails.value }
  });
}
const isCompleteTasks = computed(() => {
  const result = cards.value.find(val => val.id === 'incompleteTasks');
  if ((result?.value as any) === 0) {
    return 'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400';
  }
  else {
    return 'text-3xl text-red-500 bg-white hover:text-white hover:bg-red-500 transition-all transition-duration-400';
  }
});
const isOverDue = ref();
watchEffect(() => {
  isOverDue.value = overDue(cards.value);
});
const isSetupCompleted = computed(() => {
  if (userDetails.value) {
    return !!userDetails.value.isSetupCompleted;
  }
});
const canBeDisabled = computed(() => {
  // return Math.floor(Math.random() * 100) % 2 === 0 ? true : false;
  return (
    (
      Object.values(
        userDetails.value?._count as { [s: string]: number }
      ) as number[]
    ).reduce((prev, curr) => prev + curr, 0) === 0
  );
});
const replacingUsersList = computed(() => {
  return usersListOptions.value?.filter(
    (user: User) => user.id !== userDetails.value?.id
  );
});

const { data: gettingStartedSteps } = getGettingStartedSteps(
  userId.value as string
);

const { data: userDetails } = useQuery<User>(
  'user-details',
  async () => {
    return useUserDetails(userId.value);
  },
  {
    onSuccess: (data: User) => {
      if (data) {
        updateBreadcrumb({
          breadcrumbs: [
            { label: 'HRMS', to: { name: 'admin-teams-hrms' } },
            data.type === 'OUTSOURCED_ORG_USER'
              ? {
                  label: 'Outsourced Team',
                  to: { name: 'admin-teams-hrms', query: { activeIndex: 1 } }
                }
              : {
                  label: 'Team',
                  to: { name: 'admin-teams-hrms', query: { activeIndex: 0 } }
                },
            { label: fullName(data) as string }
          ]
        });
      }
    }
  }
);

const canDoActions = computed(() => userDetails.value?.isActive);
const activeStatus = computed(() => {
  return userDetails.value?.isActive ? 'Deactivate' : 'Activate';
});
const isUserVerified = computed(() => userDetails.value?.isVerified);

provide('disabledTooltip', disabledTooltip);
provide('canDoActions', canDoActions);

function handleAction(data: User, actionType: APIActions) {
  initToast({
    actionType,
    title: 'Team Member',
    actionObj: { ...data },
    detail: `Team Member <strong>${fullName(
      userDetails.value as unknown as FullNameObj
    )}</strong> ${activeStatus.value}d successfully`
  });
  queryClient.invalidateQueries('user-details');
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
        ? 'clients, he/she is managing.'
        : 'client, he/she is managing.';
    case 'assignedClients':
      return countValue > 1
        ? 'clients, he/she is a working team member.'
        : 'client, he/she is a working team member.';
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

const { mutateAsync: userDisable, isLoading: disablingUser } = useMutation(
  'userDisable',
  async ({
    id,
    payload
  }: {
    id: string;
    payload?: DisableTeamMemberPayload;
  }) => {
    return useUserDisable({ id, payload });
  },
  {
    onSuccess: (data: User) => handleAction(data, 'Update')
  }
);
const { mutateAsync: userDelete } = useMutation(
  'userDelete',
  async (id: string) => {
    return useUserRemove(id);
  },
  {
    onSuccess: (data: User) => handleAction(data, 'Delete')
  }
);
const { mutateAsync: userEnable } = useMutation(
  'UserEnable',
  async (id: string | null) => {
    return useUserEnable(id);
  },
  {
    onSuccess: (data: User) => handleAction(data, 'Update')
  }
);
const { mutateAsync: removeUserProfilePicture } = useMutation(
  'userProfileDelete',
  async ({ id, pictureId }: { id: string; pictureId: string }) => {
    return useUserProfilePicRemove({ id, pictureId });
  },
  {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Team Member Profile Picture Update',
        detail: `Team Member <strong>${fullName(
          userDetails.value as unknown as FullNameObj
        )}</strong> profile picture Deleted successfully`
      });
      queryClient.invalidateQueries('user-details');
      if (currentUser.value?.id === userDetails.value?.id) {
        queryClient.invalidateQueries('logged-in-user');
      }
    }
  }
);

async function handleActivation(status: string,
  payload?: DisableTeamMemberPayload) {
  if (status === 'Activate') {
    await userEnable(userId.value as string);
    queryClient.invalidateQueries('user-details');
    queryClient.invalidateQueries('tasks-list');
  }
  else {
    await userDisable({ id: userId.value as string, payload });
    queryClient.invalidateQueries('user-details');
    queryClient.invalidateQueries('tasks-list');
  }
}

const { value: replacingUserId } = useField<string>('replacingUserId');

const onSubmit = handleSubmit(async (values) => {
  await handleActivation(activeStatus.value, {
    replacingUserId: values.replacingUserId as string
  });
  resetForm();
  disableTeamMemberDialog.value = false;
});

async function handleDelete() {
  await userDelete(userId.value as string);
  queryClient.invalidateQueries('user-details');
}

const { mutateAsync: resendVerification, isLoading: sendingLink } = useMutation(
  (payload: { email: string }) => resendVerificationLink(payload),
  {
    onSuccess: (data) => {
      initToast({
        actionType: 'Update',
        summary: 'Resend Verification Link',
        detail: `Verification link has been sent to <strong>${userDetails.value?.email}</strong> successfully`
      });
    }
  }
);
const { mutateAsync: userUpdate } = useMutation(
  async (payload: UpdateTeamMemberPayload) => {
    return useUserUpdateDetails(userId.value, payload);
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
}

async function handleUpdateUser() {
  const payload = {
    email: userDetails?.value?.email as string,
    orgUserRoleId: userDetails?.value?.orgUserRoleId as string,
    designationId: userDetails?.value?.designationId as string,
    picture: pictureId.value as string
  };
  await userUpdate(payload as unknown as UpdateTeamMemberPayload);
  showToast();
}

async function handlePostAttachment(data: AttachmentResponse) {
  pictureId.value = data.id;
  await handleUpdateUser();
  queryClient.invalidateQueries('user-details');

  if (currentUser.value?.id === userDetails.value?.id) {
    queryClient.invalidateQueries('logged-in-user');
  }
}

const { mutateAsync: userAttactments } = useMutation(
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

async function uploadFile(value: FileObject) {
  const { payload } = createFilePayload(value);
  await userAttactments({ payload, file: fileSelected.value });
}

const { isFetching } = useQuery(
  ['dashboard-team', cards, userId],
  () => {
    return getTeamDashboard(userId.value as string);
  },
  {
    onSuccess: (data) => {
      if (data)
        _data.labels = data.getClientDistribution.map(val => val.name);
      _data.datasets[0].data = data.getClientDistribution.map(
        val => val._count.clients
      );
      _data.labels.forEach((el, i) => {
        _data.datasets[0].backgroundColor.push(colorForChart.value.light[i]);
      });
      if (data)
        cards.value = cards.value.map((e, i) => {
          switch (e.id) {
            case 'totalCompletedTasks':
              return {
                ...e,
                value: `${data.totalCompletedTasks} `
              };
            case 'overDueTasks':
              return {
                ...e,
                value: `${data.overDueTasks} `,
                color: `${isOverDue.value}`
              };
            case 'totalTasks':
              return {
                ...e,
                value: `${data.totalTasks} `
              };
            case 'incompleteTasks':
              return {
                ...e,
                value: `${data.incompleteTasks}`,
                color: `${isCompleteTasks.value}`
              };
            case 'totalTimeSpent':
              return {
                ...e,
                value: `${data.totalTimeSpent}`
              };

            default: {
              return {};
            }
          }
        }) as Card[];
    }
  }
);

function handleStatusName(val: string) {
  if (val) {
    currentStatus.value = val;
  }
}

function updateSelectedTaskStatus(e: DropdownChangeEvent) {
  selectedTaskType.value = e.value;
  router.push({
    query: {
      activeIndex: activeIndex.value ? activeIndex.value : undefined,
      entityType: selectedTaskType.value
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
          :class="{ 'bg-primary': !userDetails?.picture }"
        >
          <template v-if="userDetails?.picture">
            <img
              class="text-sm"
              :src="`${getAttachmentUrl(
                (userDetails?.picture as Attachment).path,
              )}`"
              style="vertical-align: middle;"
              :alt="`${fullName(userDetails)}-Profile Picture`"
            >
            <template v-if="canDo('users', 'edit')">
              <div
                v-tooltip.top="
                  `${canDoActions ? 'Update Profile Picture' : disabledTooltip}`
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
                  upload-icon="pi pi-pencil"
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
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-danger"
                  aria-label="Delete"
                  @click="
                    handelDeleteProfile(
                      (userDetails?.picture as Attachment)?.id as string,
                    )
                  "
                />
              </div>
            </template>
          </template>
          <template v-else>
            {{ initials(fullName(userDetails as FullNameObj) as string) }}
            <div
              v-if="canDo('users', 'edit')"
              v-tooltip.top="
                `${canDoActions ? 'Upload Profile Picture' : disabledTooltip}`
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
                Invited By: {{ userDetails?.invitedBy }}
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
                <span class="text-gray-800 text-lg flwx-1">{{
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
                <span class="text-gray-800 text-lg break-all flex-1">{{
                  userDetails?.email
                }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="w-full md:w-5 flex justify-content-end gap-1">
      <a
        href="https://brightreturn.com/kb/manage-project-team-in-cpa-firm"
        target="_blank"
      >
        <Button
          v-tooltip.top="'Need Help'"
          type="button"
          icon="pi pi-question-circle text-lg"
          class="p-button-icon-only p-button-rounded"
        />
      </a>
      <Button
        v-if="isSetupCompleted && canDoActions"
        v-tooltip.top="'Quick Start'"
        icon="pi "
        class="p-button-sm p-button-rounded"
        aria-label="Quick Start"
        @click="isDialogVisibleQuickStart = true"
      >
        <Icon icon="mdi:hand-coin" class="flex-none text-xl" />
      </Button>
      <div
        v-tooltip.top="handleTooltip(!!canDoActions, 'Edit', disabledTooltip)"
        style="height: 2.357rem;"
      >
        <Button
          v-if="canDo('users', 'edit') && userDetails"
          v-tooltip.top="'Edit'"
          :disabled="!canDoActions"
          icon="pi pi-pencil"
          class="p-button-sm p-button-rounded"
          aria-label="Edit"
          @click="createTeamMemberDialog = true"
        />
      </div>
      <div
        v-if="!isUserVerified"
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
          class="p-button-sm p-button-rounded ml-2 p-button"
          :loading="sendingLink"
          @click="resendVerification({ email: `${userDetails?.email}` })"
        >
          <i v-if="sendingLink" class="pi pi-spin pi-spinner" />
          <Icon
            v-else
            class="flex-none text-base"
            icon="fa6-solid:share-from-square"
          />
        </Button>
      </div>
      <Button
        v-if="canDo('users', 'delete')"
        v-tooltip.top="activeStatus"
        :icon="canDoActions ? 'pi pi-ban' : 'pi pi-check-circle'"
        class="p-button-sm p-button-rounded ml-2"
        :class="canDoActions ? 'p-button-danger' : 'p-button-success'"
        :aria-label="activeStatus"
        @click="disableTeamMemberDialog = true"
      />
      <!-- <Button
        icon="pi pi-trash"
        disabled
        class="p-button-sm p-button-rounded p-button-danger ml-2"
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
      <TabPanel v-if="!isSetupCompleted" header="Getting Started">
        <h2 class="text-3xl text-primary">
          Getting Started
        </h2>
        <CommonGetStart
          :timeline-steps="gettingStartedSteps"
          @emit-step="handleStep"
        />
      </TabPanel>
      <TabPanel v-if="isSetupCompleted" header="Dashboard">
        <Common426
          v-if="featureSubscribed('team', 'dashboard') === false"
          feature="dashboard"
        />
        <div v-else>
          <h2 class="text-3xl text-primary">
            Dashboard
          </h2>
          <div
            v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
            class="grid mb-4"
          >
            <WidgetCards
              :cards="cards"
              :cards-in-row="5"
              class="col-12"
              :loading="isFetching"
            />
          </div>
          <div class="grid">
            <div class="col col-12 md:col-6 xl:col-4">
              <div
                class="widget-shadow widget-radius card flex flex-column align-items-center"
              >
                <h5 class="align-self-start">
                  {{ `${$tConfig('CLIENT')}` }} Distribution
                </h5>
                <CommonLoading v-if="isFetching" />
                <Chart
                  v-else-if="_data.datasets[0].data.filter((e) => e).length > 0"
                  type="pie"
                  :data="_data"
                  :options="lightOptions"
                />
                <div
                  v-else
                  class="flex justify-content-center align-items-center"
                >
                  No clients assigned
                </div>
              </div>
            </div>
            <div class="col col-12 md:col-6 xl:col-8">
              <div class="widget-shadow widget-radius card mx-auto">
                <h6 class="text-500 font-medium mb-3">
                  Notes
                </h6>
                <Common426
                  v-if="featureSubscribed('team', 'notes') === false"
                  feature="notes"
                />
                <CommonComments
                  v-else
                  resource-type="TEAM_MEMBER"
                  :resource-id="userId"
                />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      <TabPanel
        v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
        header="Assigned Tasks"
      >
        <Common426
          v-if="featureSubscribed('work', 'task') === false"
          feature="tasks"
        />
        <div v-else>
          <div class="flex align-items-center justify-content-between mb-4">
            <div>
              <h2 class="text-3xl text-primary">
                {{
                  ` ${
                    selectedTaskType === 'TASK' ? 'Team' : ' Client Request'
                  } ( ${currentStatus ? currentStatus : ''} )`
                }}
              </h2>
              <div class="justify-content-end mr-auto">
                <Dropdown
                  v-model="selectedTaskType"
                  option-label="name"
                  option-value="value"
                  :options="taskStatusOptions"
                  placeholder="Select a user"
                  @change="updateSelectedTaskStatus"
                />
              </div>
            </div>
          </div>
          <TasksList
            ref="tasksListRef"
            :user-id="userId"
            :disabled-filters="['Project Name', 'Assigned To', 'Start Date']"
            :entity-type="selectedTaskType"
            @task-status-title="handleStatusName"
          />
        </div>
      </TabPanel>
      <TabPanel
        v-if="isFeatureIntegrated(['work'], allOrgIntegrationIds)"
        header="Assigned Projects"
      >
        <Common426
          v-if="featureSubscribed('work', 'project') === false"
          feature="projects"
        />
        <div v-else>
          <h2 class="text-3xl text-primary">
            Assigned Projects
          </h2>
          <TeamsAssignedProjectList :user-id="userId" hide-filters />
        </div>
      </TabPanel>

      <TabPanel header="Assigned Clients">
        <h2 class="text-3xl text-primary">
          Assigned Clients
        </h2>
        <TeamsAssignedClientList :user-id="userId" />
      </TabPanel>
      <TabPanel header="Details">
        <h2 class="text-3xl text-primary">
          Contact Details
        </h2>
        <TeamsUpdateContactForm />
      </TabPanel>

      <!-- <TabPanel header="Contact Details">
        <TeamsUpdateContactForm />
      </TabPanel> -->
      <!-- <TabPanel v-if="isSetupCompleted" header="Quick Start">
        <h2 class="text-3xl text-primary">Quick Start</h2>
        <CommonGetStart
          :timelineSteps="gettingStartedSteps"
          @emitStep="handleStep"
        />
      </TabPanel> -->
    </TabView>
  </div>
  <CommonConfirmRemoveDialog
    v-if="userDetails && removeTeamMemberDialog"
    :visible="removeTeamMemberDialog"
    :record-to-remove="userDetails as Record<string, any>"
    title="Confirm Remove Team Member"
    @confirm="handleDelete"
    @hide="removeTeamMemberDialog = false"
  />
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
      Are you sure you want to {{ 'Delete' }} the profile picture for
      <strong>{{ fullName(userDetails as FullNameObj) }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="userDetails && disableTeamMemberDialog"
    :visible="disableTeamMemberDialog"
    :hide-buttons="!canBeDisabled && activeStatus !== 'Activate'"
    :record-to-remove="
      { ...userDetails, name: fullName(userDetails) } as Record<string, any>
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
      <strong> {{ fullName(userDetails) }}</strong>?
    </div>
    <div v-else>
      <div>
        <strong> {{ fullName(userDetails) }} </strong> has following
        dependencies:
        <ul>
          <template
            v-for="(value, key, index) in userDetails._count"
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
          To disable <strong>{{ fullName(userDetails) }}</strong>, please select alternate team member to whom you want to assign all
          the above liablilities.
        </p>
      </div>
      <form class="text-left mt-4" @submit="onSubmit">
        <div class="field">
          <label for="replacingUserId" class="block font-medium text-900">
            Choose from current team
            <span class="text-red-600">*</span>
          </label>
          <!-- <InputText
            id="replacingUserId"
            v-model="replacingUserId"
            type="replacingUserId"
            class="w-full"
            :class="{ 'p-invalid': errors['replacingUserId'] }"
          /> -->
          <Dropdown
            v-model="replacingUserId"
            class="w-20rem"
            option-label="name"
            option-value="id"
            :options="replacingUsersList"
            placeholder="Select a team member"
            show-clear
            filter
            :class="{ 'p-invalid': errors.replacingUserId }"
            @blur="validate()"
          />
          <transition mode="out-in" name="field-slide-down">
            <FormFeedbackMessage
              success-class="font-medium"
              :errors="errors"
              :values="values"
              :feedback="false"
              error-key="replacingUserId"
            />
          </transition>
        </div>
        <div class="flex justify-content-between">
          <!-- <Button label="Cancel" class="p-button-danger"></Button> -->
          <Button
            label="Submit"
            :disabled="!meta.valid"
            :loading="disablingUser"
            type="submit"
            class="ml-auto"
          />
        </div>
      </form>
    </div>
  </CommonConfirmRemoveDialog>

  <Dialog
    v-model:visible="createTeamMemberDialog"
    modal
    append-to="body"
    :header="`Update ${
      userDetails?.type === 'OUTSOURCED_ORG_USER' ? 'Outsourced' : ''
    }  Team Member`"
    class="invite-team-member"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
    @hide="createTeamMemberDialog = false"
  >
    <ContractualTeamCreateUpdateForm
      v-if="userDetails?.type === 'OUTSOURCED_ORG_USER'"
      :user="userDetails"
      @modal-close="createTeamMemberDialog = false"
    />
    <TeamsCreateUpdateForm
      v-else
      :key="randomKey"
      :user="userDetails"
      @modal-close="createTeamMemberDialog = false"
    />
  </Dialog>
  <Dialog
    v-model:visible="isDialogVisibleQuickStart"
    :modal="true"
    append-to="body"
    header="Quick Start"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <CommonGetStart
      :timeline-steps="gettingStartedSteps"
      @emit-step="handleStep"
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
