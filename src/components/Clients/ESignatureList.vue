<script setup lang="ts">
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import { FilterMatchMode } from 'primevue/api';
import type {
  SignatureRequest,
  SignatureStatuses
} from '@/types/esignature.type';
import type { APIActions } from '@/types/common.type';
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import type { Client } from '@/types/client.type';

const props = withDefaults(
  defineProps<{
    hideActions?: boolean;
    hideFilters?: boolean;
    disabledFilters?: string[];
    client?: Client;
  }>(),
  { disabledFilters: () => [], hideFilters: false }
);

const router = useRouter();
const route = useRoute();
const clientId = ref(route.params.id as string);
const {
  handlePageOrLimitChange,
  handleSortChange,
  toggleFilters,
  filtersRef,
  isFiltersVisible,
  tableAttrs,
  currentLimit,
  currentPage,
  queryFilters,
  querySortBy,
  queryKeys
} = useDataTableUtils();
const queryClient = useQueryClient();
const currentInstance = getCurrentInstance();

const signMenuItems = ref([
  {
    label: 'Sign Now',
    action: 'sign',
    icon: 'tabler:signature',
    iconify: true,
    iconClass: 'text-xl mr-1',
    showPortal: true
  },
  {
    label: 'Send Reminder',
    action: 'remind',
    icon: 'pi pi-undo'
  },
  {
    label: 'Cancel Request',
    action: 'cancel',
    icon: 'pi pi-times'
  }
]);
const signedMenuItems = ref([
  {
    label: 'View & Download',
    action: 'sign',
    icon: 'pi pi-download',
    showPortal: true
  }
]);

function filterSignMenuItems(data: SignatureRequest) {
  return data.status === 'SIGNED'
    ? signedMenuItems.value
    : isPortalUser.value
      ? signMenuItems.value.filter((item: MenuItem) => item.showPortal)
      : signMenuItems.value.map((item: MenuItem) => ({
        ...item,
        disabled:
          item.action !== 'sign'
          && data.requestedBy.id !== currentUser.value?.id
      }));
}

function toggleMenu(event: Event, ref: string) {
  const foundMenu = Array.isArray(
    currentInstance?.refs[ref] as InstanceType<typeof Menu>
  )
    ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
    : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);

  foundMenu && foundMenu.toggle(event);
}

const { getAll, cancelDocumentSignatureRequest, remindDocumentSignature }
  = useDocumentSignature();

const { dateToHumanShort, titleCase } = useVueFilters();
const { initToast } = useToasts();
const { isPortalUser } = useCurrentUserData();

// type SignatureStatuses = (typeof signatureStatuses)[number]['value'];

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const removeSignatureDialog = ref(false);
const selectedSignReq = ref<SignatureRequest>();

function getStatusColor(status: SignatureStatuses) {
  switch (status) {
    case 'SIGNED':
      return 'bg-green-500';
    case 'PARTIALLY_SIGNED':
      return 'bg-orange-500';
    case 'PENDING':
    case 'CANCELLED':
      return 'bg-red-500';
    default:
      return '';
  }
}

function showToast(actionType: APIActions,
  actionTitle: string,
  data?: SignatureRequest) {
  selectedSignReq.value = undefined;
  queryClient.invalidateQueries('document-signature-list');
  initToast({
    actionType,
    title: actionTitle,
    summary: `${actionType} ${actionTitle}`,
    detail:
      actionType === 'Remind'
        ? `Reminder of ${actionTitle} ${
            data ? `for <strong>${data.title}</strong>` : ''
          } sent successfully.`
        : `${actionTitle} ${
            data ? `<strong>${data.title}</strong>` : ''
          } ${actionType}d successfully.`
  });
}

const { data: filterData, applyFilter } = useFilterColumns();

const initialFilters = computed(() => {
  applyFilter(
    'Client',
    isPortalUser.value
      ? [currentUser.value?.client?.id]
      : [clientId.value || props.client?.id]
  );

  const initialFiltersString = useEncodeFilterData(filterData);
  return initialFiltersString;
});

const { isLoading: loadingESignature, data: ESignature } = useQuery(
  ['document-signature-list', ...queryKeys],
  () => {
    return getAll({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters.value,
      sortBy: querySortBy.value,
      isPortal: isPortalUser.value
    });
  }
);

const { mutateAsync: remindDocSignReq, isLoading: remindingSignatureRequest }
  = useMutation(
    ['remind-doc-sign-request'],
    (id: string) => {
      return remindDocumentSignature(id);
    },
    {
      onSuccess: () => {
        showToast('Remind', 'eSignature Request', selectedSignReq.value);
      }
    }
  );
const { mutateAsync: cancelDocSignReq, isLoading: cancellingSignatureRequest }
  = useMutation(
    ['cancel-doc-sign-request'],
    (id: string) => {
      return cancelDocumentSignatureRequest(id);
    },
    {
      onSuccess: () => {
        showToast('Remove', 'eSignature Request', selectedSignReq.value);
      }
    }
  );

function gotoSign(data: SignatureRequest) {
  router.push({
    query: {
      ...route.query,
      signReqId: data.id,
      fileId: data.fileId,
      isDocumentViewer: 'true',
      isSignDoc: 'true',
      isSignReq: 'true',
      isESignWebform: `${!!data.webform}`
    }
  });
}

function prepareCancelReq(data: SignatureRequest) {
  selectedSignReq.value = data;
  removeSignatureDialog.value = true;
}
async function handleCancel() {
  await cancelDocSignReq(selectedSignReq.value?.id as string);
}

async function handleReminder(data: SignatureRequest) {
  selectedSignReq.value = data;
  await remindDocSignReq(data.id);
}

function handleESignature(data: SignatureRequest) {
  console.log(data);
}

function menuClick(item: MenuItem, data: SignatureRequest) {
  selectedSignReq.value = data;
  switch (item.action) {
    case 'sign':
      gotoSign(data);
      break;
    case 'remind':
      handleReminder(data);
      break;
    case 'cancel':
      prepareCancelReq(data);
      break;

    default:
      break;
  }
  // menuItem.command && menuItem.command(menuItem as MenuItemCommandEvent);
}
</script>

<template>
  <DataTable
    v-bind="tableAttrs"
    v-model:filters="filters"
    data-key="id"
    :total-records="ESignature?.total"
    :value="ESignature?.results"
    :loading="loadingESignature"
    :global-filter-fields="['title']"
    filter-display="menu"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-end">
        <CommonListSearchInput
          v-bind="{
            listProps: props,
            placeholder: 'Search eSignature',
          }"
        />
        <Button
          v-if="!hideFilters"
          type="button"
          :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
          class="p-button-icon-only p-button-rounded"
          :class="[{ 'p-button-danger': queryFilters }]"
          @click="toggleFilters(!!queryFilters)"
        />

        <a
          href="https://brightreturn.com/kb/e-signature-software"
          target="_blank"
        >
          <Button
            v-tooltip.top="'Need Help'"
            type="button"
            icon="pi pi-question-circle text-lg"
            class="p-button-icon-only p-button-rounded ml-2"
          />
        </a>
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <ClientsSignatureFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
        />
      </div>
      <!-- <div class="flex justify-content-between">
        <CommonListSearchInput placeholder="Search Signature" />
      </div> -->
    </template>

    <Column
      header="Document Name"
      class="w-2"
      :show-filter-match-modes="false"
      :filter-menu-style="{ width: '14rem' }"
      style="min-width: 14rem;"
      filter-field="title"
      field="title"
      column="title"
    >
      <template #body="{ data }">
        <a
          href="#"
          class="font-medium text-gray-900 cursor-pointer hover:underline"
          tabindex="0"
          @click.prevent="gotoSign(data)"
          @keyup.enter="gotoSign(data)"
        >
          {{ data.title }}
        </a>
      </template>
    </Column>
    <Column header="Status">
      <template #body="{ data }">
        <span
          class="py-1 px-2 inline-block text-white border-round-md text-xs font-medium"
          :class="getStatusColor(data.status)"
        >
          {{ titleCase(data.status, '_') }}
        </span>
      </template>
    </Column>
    <!-- <Column header="Upload Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.uploadDate) }}
      </template>
    </Column> -->
    <Column header="Request Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.createdAt) }}
      </template>
    </Column>

    <Column header="Esign Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.updatedAt) }}
      </template>
    </Column>
    <Column header="Due Date">
      <template #body="{ data }">
        {{ data.dueDate ? dateToHumanShort(data.dueDate) : 'N/A' }}
      </template>
    </Column>

    <Column class="text-center w-6rem" header="Actions">
      <template #body="{ data }">
        <div class="flex justify-content-center gap-2">
          <!-- <Button
            icon="pi pi-times"
            v-tooltip.top="'Cancel'"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="prepareCancelReq(data)"
            :disabled="data.requestedBy.id !== currentUser.id"
          >
            <i
              class="pi pi-spin pi-spinner"
              v-if="cancellingSignatureRequest"
            ></i>
          </Button>
          <Button
            icon="pi pi-undo"
            v-tooltip.top="'Resend'"
            class="p-button-sm p-button-rounded p-button-primary"
            @click="handleReminder(data)"
            :disabled="data.requestedBy.id !== currentUser.id"
          >
            <i
              class="pi pi-spin pi-spinner"
              v-if="remindingSignatureRequest"
            ></i>
          </Button> -->
          <Button
            icon="pi pi-ellipsis-v"
            class="p-button-sm p-button-secondary p-button-rounded bg-primary"
            aria-haspopup="true"
            :aria-controls="`overlay_menu_${data.id}`"
            @click.stop="toggleMenu($event, `menu-${data.id}` as string)"
          >
            <i
              v-if="
                data.id === selectedSignReq?.id
                  && (cancellingSignatureRequest || remindingSignatureRequest)
              "
              class="pi pi-spin pi-spinner"
            />
          </Button>
          <Menu
            :id="`overlay_menu_${data.id}`"
            :ref="`menu-${data.id}`"
            :model="filterSignMenuItems(data)"
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
    <!-- <Column v-if="isPortalUser" class="text-center w-2" header="Actions">
      <template #body="slotProps">
        <span
          class="underline font-medium cursor-pointer text-blue-600 hover:text-blue-800 cursor-pointer"
          @click="gotoSign(slotProps.data)"
          >{{ 'E-Signature' }}</span
        >
      </template>
    </Column> -->
    <template #empty>
      <div class="text-center">
        No Data found
      </div>
    </template>
  </DataTable>
  <CommonConfirmRemoveDialog
    v-if="removeSignatureDialog"
    :visible="removeSignatureDialog"
    title="Confirm Cancel eSignature Request"
    @confirm="handleCancel"
    @hide="removeSignatureDialog = false"
  >
    <div>
      Are you sure you want to {{ 'Cancel' }} the signature request for
      <strong>{{ selectedSignReq?.title }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
</template>

<style lang="scss" scoped></style>
