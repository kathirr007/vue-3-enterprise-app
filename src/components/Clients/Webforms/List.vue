<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import type { Webform, WebformType } from '@/types/webforms.type';
import { WebformStatus } from '@/types/webforms.type';
import type { APIActions } from '@/types/common.type';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { Attachment } from '@/types/attachment.type';

const props = defineProps<{
  webformType: WebformType;
}>();

const emit = defineEmits<{
  (e: 'update:webform', data: Webform): void;
  (e: 'delete:webform', data: Webform): void;
  (e: 'select:webform', data: Webform): void;
  (e: 'esign:webform', data: Webform): void;
  (e: 'view:webform', data: Webform): void;
}>();

const disabledTooltip = inject<string>('disabledTooltip');
const canDoActions = inject<boolean>('canDoActions');
const clientDetails = inject<any>('clientDetails', () => null);

const route = useRoute();
const router = useRouter();
const { filters } = useDatatableFilters();
const { fullName, dateToHumanShort, initials, titleCase } = useVueFilters();
const { getAttachmentUrl, downloadFileAs } = useAttachments();
const { canDo, canDoSome } = usePermissions();
const { getAll, remove, remind, update, requestUpdate } = useWebforms();
const { getAttachmentIds } = useWebformTemplates();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  queryKeys,
  querySortBy,
  tableRecords,
  toggleFilters
} = useDataTableUtils();
const { defaultBreakpoints, styles } = useCommonBreakPoints();
const { initToast } = useToasts();
const queryClient = useQueryClient();

const currentInstance = getCurrentInstance();
const attachmentsListDialog = ref(false);
const removeWebformDialog = ref(false);
const cancelWebformDialog = ref(false);
const approveWebformDialog = ref(false);
const requestESignDialog = ref(false);
const updateWebformDialog = ref(false);
const updateStatusDialog = ref(false);
const sendToClient = ref(false);
const isRequestUpdate = ref(false);
const updateType = ref<'approve' | 'cancel' | 'reject'>();
const selectedAttachments = ref<Record<string, any>[]>([]);
const selectedWebform = ref<Webform>();
const actionMenus = ref([
  {
    label: 'Edit',
    action: 'edit',
    icon: 'pi pi-pencil',
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'View Form',
    action: 'view',
    icon: 'pi pi-eye',
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'Send Reminder',
    action: 'remind',
    icon: 'pi pi-undo'
  },
  {
    label: 'Send To Client',
    action: 'sendToClient',
    icon: 'pi pi-send'
  },
  {
    label: 'Approve',
    action: 'approve',
    icon: 'pi pi-check',
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'Reject',
    action: 'reject',
    icon: 'pi pi-ban',
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'Request eSignature',
    action: 'requestESignature',
    icon: 'tabler:signature',
    iconify: true,
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'Sign Now',
    action: 'signNow',
    icon: 'tabler:signature',
    iconify: true,
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'View & Download',
    action: 'viewDownload',
    icon: 'tabler:signature',
    iconify: true,
    iconClass: 'text-xl mr-1'
  },
  {
    label: 'Request Update',
    action: 'requestUpdate',
    iconify: true,
    icon: 'fluent-mdl2:message-friend-request',
    iconClass: 'text-lg mr-2'
  },
  {
    label: 'Cancel',
    action: 'cancel',
    icon: 'pi pi-times'
  },
  {
    label: 'Remove',
    action: 'remove',
    icon: 'pi pi-trash'
  }
]);

function filterActionMenus(item: Webform) {
  const menusToFilter = [
    'requestUpdate',
    'approve',
    'requestESignature',
    'signNow',
    'reject',
    'sendToClient',
    'viewDownload'
  ];
  const menusToInclude = ['view', 'remove'];
  const approvedMenus = ['remove'];
  const signedRequestedMenus = ['remove'];
  const signedMenus = ['remove'];
  const filledMenus = [
    'remind',
    'requestESignature',
    'signNow',
    'sendToClient',
    'viewDownload'
  ];

  if (props.webformType === 'CONTRACT') {
    approvedMenus.push('requestESignature');
    signedRequestedMenus.push('signNow');
    signedMenus.push('viewDownload');
  }

  const filteredActions = computed(() => {
    return actionMenus.value.filter(
      (menu: MenuItem) => !menusToFilter.includes(menu.action)
    );
  });

  switch (item.status) {
    case 'APPROVED':
      return actionMenus.value.filter((menu: MenuItem) =>
        approvedMenus.includes(menu.action)
      );
    case 'ESIGN_REQUESTED':
    case 'PARTIALLY_SIGNED':
      return actionMenus.value.filter((menu: MenuItem) =>
        signedRequestedMenus.includes(menu.action)
      );
    case 'SIGNED':
      return actionMenus.value.filter((menu: MenuItem) =>
        signedMenus.includes(menu.action)
      );
    case 'FILLED':
    case 'UPDATE_REQUESTED':
      return actionMenus.value.filter(
        (menu: MenuItem) => !filledMenus.includes(menu.action)
      );
    case 'CANCELLED':
      return actionMenus.value.filter((menu: MenuItem) =>
        menusToInclude.includes(menu.action)
      );
    case 'REJECTED':
      menusToInclude.push('requestUpdate');
      return actionMenus.value.filter((menu: MenuItem) =>
        menusToInclude.includes(menu.action)
      );
    case 'DRAFT':
      menusToFilter.splice(
        menusToFilter.findIndex((menu: string) => menu === 'sendToClient'),
        1
      );
      menusToFilter.push('remind');
      return filteredActions.value;
    default:
      return filteredActions.value;
  }
}
function handleOperation(actionType: APIActions) {
  updateWebformDialog.value = false;
  initToast({
    actionType,
    title: 'Webform',
    actionObj: { ...selectedWebform.value }
  });
  if (actionType === 'Update') {
    router.push({
      query: {
        ...route.query,
        isUpdateWebform: 'true',
        webformId: selectedWebform.value?.id
      }
    });
  }
  else if (
    actionType === 'Approve'
    && selectedWebform.value?.type === 'CONTRACT'
  ) {
    requestESignDialog.value = true;
  }
  else {
    selectedWebform.value = undefined;
    queryClient.invalidateQueries('webforms-list');
  }
}

function toggleMenu(event: Event, ref: string) {
  const foundMenu = Array.isArray(
    currentInstance?.refs[ref] as InstanceType<typeof Menu>
  )
    ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
    : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);

  foundMenu && foundMenu.toggle(event);
}

function prepareRequestUpdate() {
  isRequestUpdate.value = true;
  updateWebformDialog.value = true;
}
function prepareUpdateClose() {
  isRequestUpdate.value = false;
  updateWebformDialog.value = false;
  queryClient.invalidateQueries('webforms-list');
}

function menuClick(item: MenuItem, data: Webform) {
  selectedWebform.value = { ...data, isClientWebform: true };
  switch (item.action) {
    case 'edit':
      updateWebformDialog.value = true;
      break;
    case 'view':
      emit('view:webform', data);
      break;
    case 'approve':
    case 'cancel':
    case 'reject':
      updateType.value = item.action;
      updateStatusDialog.value = true;
      break;
    case 'remind':
      handleRemindWebform();
      break;
    case 'sendToClient':
      sendToClient.value = true;
      handleUpdateWebformStatus(data.status as string, 'Remind');
      break;
    case 'requestUpdate':
      prepareRequestUpdate();
      break;
    case 'requestESignature':
    case 'signNow':
    case 'viewDownload':
      emit('esign:webform', data);
      break;
    case 'remove':
      removeWebformDialog.value = true;
      break;

    default:
      break;
  }
  // menuItem.command && menuItem.command(menuItem as MenuItemCommandEvent);
}

const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  applyFilter('Client', clientDetails.value ? [clientDetails.value?.id] : []);
  applyFilter('Type', [props.webformType || '']);

  const initialFiltersString = useEncodeFilterData(filterData);
  return initialFiltersString;
});

const {
  isLoading: loadingWebforms,
  isFetching: fetchingWebforms,
  data: webformsList
} = useQuery(
  ['webforms-list', initialFilters, ...queryKeys],
  () => {
    return getAll({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters.value,
      sortBy: querySortBy.value
    });
  },
  {
    onSuccess: (data) => {
      tableRecords.value = data;
    }
  }
);

const { mutateAsync: remindWebform, isLoading: remindingWebform } = useMutation(
  (id: string) => remind(id),
  {
    onSuccess: () => {
      handleOperation('Remind');
    }
  }
);

const { mutateAsync: requestUpdateWebform, isLoading: requestingUpdate }
  = useMutation((id: string) => requestUpdate(id), {
    onSuccess: () => {
      initToast({
        actionType: 'Update',
        summary: 'Request Update',
        detail: `A request for update sent successfully.`
      });
    }
  });

const { mutateAsync: removeWebform, isLoading: removingWebform } = useMutation(
  (id: string) => remove(id),
  {
    onSuccess: () => {
      handleOperation('Remove');
    }
  }
);
const { mutateAsync: updateWebform, isLoading: updatingWebform } = useMutation(
  ({
    id,
    payload,
    actionType
  }: {
    id: string;
    payload: Partial<Webform>;
    actionType: APIActions;
  }) => update({ id, payload, sendToClient: sendToClient.value }),
  {
    onSuccess: (data, variables) => {
      sendToClient.value = false;
      handleOperation(variables.actionType);
    }
  }
);

async function handleRemoveWebform() {
  await removeWebform(selectedWebform.value?.id as string);
}

async function handleRemindWebform() {
  await remindWebform(selectedWebform.value?.id as string);
}

async function handleRequestUpdateWebform() {
  await requestUpdateWebform(selectedWebform.value?.id as string);
}

async function handleUpdateWebform(isUpdateRequested?: boolean) {
  if (isUpdateRequested) {
    await handleRequestUpdateWebform();
    updateWebformDialog.value = false;
    isRequestUpdate.value = false;
    return;
  }
  handleOperation('Update');
}

async function handleUpdateWebformStatus(statusValue: string,
  actionType: APIActions) {
  const attachments: Attachment[] = selectedWebform.value?.attachments
    ? (selectedWebform.value?.attachments as Attachment[])
    : [];
  await updateWebform({
    id: selectedWebform.value?.id as string,
    payload: {
      ...selectedWebform.value,
      attachments: attachments?.length
        ? (getAttachmentIds(attachments as Attachment[]) as string[])
        : [],
      status: statusValue as WebformStatus
    },
    actionType
  });
}

const enumKeyMap = Object.entries(WebformStatus).reduce((acc, [key, value]) => {
  (acc as any)[value] = key;
  return acc;
}, {} as WebformStatus);

function getStatus(status: WebformStatus) {
  return (enumKeyMap as any)[status];
}

function selectOrViewWebform(data: Webform) {
  if (!canDo('webform', 'single'))
    return;
  data.status === 'APPROVED' && props.webformType === 'ORGANIZER'
    ? emit('view:webform', data)
    : emit('select:webform', data);
}
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="loadingWebforms" />
  <DataTable
    v-bind="tableAttrs"
    v-model:filters="filters"
    :value="webformsList?.results"
    :total-records="webformsList?.total"
    :loading="fetchingWebforms"
    data-key="id"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-between">
        <CommonListSearchInput
          :placeholder="`Search ${titleCase(
            webformType === 'ORGANIZER' ? 'Request' : webformType,
          )}s`"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No webforms found.
      </div>
    </template>
    <Column field="name" header="Name" class="w-3">
      <template #body="{ data }">
        <span
          role="link"
          tabindex="0"
          data-if="!canDo('webforms', 'single')"
          class="flex align-items-center font-medium text-primary"
          :class="{
            'cursor-pointer hover:text-gray-600 hover:underline': canDo(
              'webform',
              'single',
            ),
          }"
          @click="selectOrViewWebform(data)"
        >
          <span class="user-name">{{ data.name }}</span>
        </span>
      </template>
    </Column>
    <Column field="createdAt" header="Request Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.createdAt) }}
      </template>
    </Column>
    <Column field="description" header="Description" />
    <Column field="status" header="Status">
      <template #body="{ data }">
        {{ getStatus(data.status) || 'NA' }}
      </template>
    </Column>
    <Column
      v-if="webformType === 'CONTRACT'"
      field="eSignDate"
      header="ESign Date"
    >
      <template #body="{ data }: { data: Webform }">
        {{
          data.signatureRequest?.length
            ? dateToHumanShort(data.signatureRequest[0]?.updatedAt as string)
            : 'NA'
        }}
      </template>
    </Column>
    <Column
      v-if="webformType === 'ORGANIZER'"
      field="attachments"
      class="w-3rem text-center"
    >
      <template #header>
        <i v-tooltip.top="'Documents'" class="pi pi-paperclip text-xl" />
      </template>
      <template #body="{ data }">
        <span
          v-if="data.attachments?.length > 0"
          class="underline font-medium cursor-pointer hover:text-gray-600 text-blue-500"
          @click="
            selectedAttachments = data.attachments;
            attachmentsListDialog = true;
          "
        >
          View
        </span>
        <span v-else>0</span>
      </template>
    </Column>
    <Column
      class="text-center w-3rem"
      data-v-if="canDoSome('webforms', ['delete', 'edit'])"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="{ data }">
        <div class="flex justify-content-center gap-2">
          <Button
            icon="pi pi-ellipsis-v"
            class="p-button-sm p-button-secondary p-button-rounded bg-primary"
            aria-haspopup="true"
            :aria-controls="`overlay_menu_${data.id}`"
            @click.stop="toggleMenu($event, `menu-${data.id}` as string)"
          >
            <i
              v-if="
                data.id === selectedWebform?.id
                  && (removingWebform
                    || updatingWebform
                    || remindingWebform
                    || requestingUpdate)
              "
              class="pi pi-spin pi-spinner"
            />
          </Button>
          <Menu
            :id="`overlay_menu_${data.id}`"
            :ref="`menu-${data.id}`"
            :model="filterActionMenus(data as Webform)"
            :popup="true"
          >
            <template #item="{ item }">
              <span
                class="p-menuitem-link"
                role="menuitem"
                @click="menuClick(item, data)"
              >
                <Icon
                  v-if="item.iconify"
                  class="flex-none"
                  :icon="item.icon"
                  :class="item.iconClass"
                />
                <span
                  v-else
                  class="p-menuitem-icon pi"
                  :class="item.icon"
                />
                <span class="p-menuitem-text">
                  {{ item.label }}
                </span>
              </span>
            </template>
          </Menu>
        </div>
      </template>
    </Column>
  </DataTable>

  <Dialog
    v-model:visible="attachmentsListDialog"
    :modal="true"
    append-to="body"
    header="Attachments"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '45vw' }"
    content-class="border-round-bottom-md"
    @hide="selectedAttachments = []"
  >
    <ol
      v-if="selectedAttachments.length"
      class="project-clients-list pl-3 p-0 m-0 formgrid"
    >
      <li
        v-for="(item, index) in selectedAttachments"
        :key="index"
        class="col py-1"
      >
        <div class="flex">
          <a
            target="_blank"
            class="flex flex-1 align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
            @click="downloadFileAs(getAttachmentUrl(item.path), item.name)"
          >
            {{ item.name }}
          </a>
        </div>
      </li>
    </ol>
    <template v-else>
      No attachments available
    </template>
  </Dialog>

  <Dialog
    v-model:visible="updateWebformDialog"
    :modal="true"
    append-to="body"
    :header="
      isRequestUpdate ? `Request Update` : `Update ${selectedWebform?.name}`
    "
    :breakpoints="defaultBreakpoints"
    :style="isRequestUpdate ? { width: '45vw' } : styles"
    content-class="border-round-bottom-md"
    @hide="prepareUpdateClose"
  >
    <WebformsCreateUpdateForm
      :webform-type="webformType"
      :webform-details="selectedWebform"
      hide-attachment
      :is-request-update="isRequestUpdate"
      @update="handleUpdateWebform"
      @back="updateWebformDialog = false"
    />
  </Dialog>

  <CommonConfirmRemoveDialog
    v-if="selectedWebform && removeWebformDialog"
    :visible="removeWebformDialog"
    :record-to-remove="selectedWebform as Record<string, any>"
    title="Remove Webform"
    class="remove-dialog"
    :is-remove="true"
    @confirm="handleRemoveWebform"
    @hide="removeWebformDialog = false"
  />
  <CommonConfirmRemoveDialog
    v-if="selectedWebform && updateStatusDialog"
    :visible="updateStatusDialog"
    :record-to-remove="selectedWebform as Record<string, any>"
    :title="`${titleCase(updateType as string)} ${titleCase(
      webformType === 'ORGANIZER' ? 'Request' : webformType,
    )}`"
    class="remove-dialog"
    :is-remove="true"
    @confirm="
      handleUpdateWebformStatus(
        `${
          updateType === 'approve'
            ? 'APPROVED'
            : updateType === 'cancel'
              ? 'CANCELLED'
              : 'REJECTED'
        }`,
        `${titleCase(updateType as string)}` as APIActions,
      )
    "
    @hide="updateStatusDialog = false"
  >
    <div>
      <p v-if="updateType === 'approve'">
        Once the {{ webformType.toLowerCase() }} is approved, it can't be
        edited, or cancelled.
      </p>
      <div>
        Are you sure you want to {{ updateType }}
        <strong>{{ selectedWebform.name }}</strong>?
      </div>
    </div>
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="selectedWebform && requestESignDialog"
    :visible="requestESignDialog"
    :record-to-remove="selectedWebform as Record<string, any>"
    title="eSignature Request"
    class="remove-dialog"
    :is-remove="true"
    @confirm="emit('esign:webform', selectedWebform)"
    @hide="requestESignDialog = false"
  >
    <div>
      <p>
        Since the contract is approved you can now raise eSignature request.
      </p>
      <div>
        Would you like to raise eSignature request for
        <strong>{{ selectedWebform.name }}</strong>?
      </div>
    </div>
  </CommonConfirmRemoveDialog>
</template>
