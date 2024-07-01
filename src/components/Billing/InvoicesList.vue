<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';
import Menu from 'primevue/menu';
import { useMutation, useQuery, useQueryClient } from 'vue-query';
import type { ClientBillingInvoice } from '@/types/client-billing-invoices.type';
import type { APIActions, PaginatedResponse } from '@/types/common.type';
import type { Card } from '@/types/dashboard.type';
import type { Client } from '@/types/client.type';
import { useRouteQuery } from '@vueuse/router';

const props = withDefaults(
  defineProps<{
    billingProfileId?: string;
    hideActions?: boolean;
    hideFilters?: boolean;
    disabledFilters?: string[];
    clientId?: string;
    clientDetails?: Client;
  }>(),
  { disabledFilters: () => [], hideFilters: false }
);

const emit = defineEmits<{
  (e: 'edit-invoice', value: ClientBillingInvoice): void;
}>();

const route = useRoute();
const router = useRouter();
const { isFalsy } = useUtilityFns();
const isQuickStart = useRouteQuery<string>('quickstart');
const { isLarge, defaultBreakpoints, styles } = useCommonBreakPoints();
const { dateToHumanShort, titleCase, fullName, getInlCurrencyNumber }
  = useVueFilters();
const { initToast } = useToasts();
const { overDue } = useOverDueColor();
const { filters, searchText: staticSearchText } = useDatatableFilters();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  queryKeys,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  querySortBy,
  toggleFilters,
  tableRecords,
  exportToCSV,
  dataTableRef
} = useDataTableUtils();
const { activeIndex, activeTabIndex, handleTabChange, tabRef }
  = useSteps('admin-billing');
const { canDo, canDoSome } = usePermissions();
const currentInstance = getCurrentInstance();
const queryClient = useQueryClient();
const {
  getOne: getOneInvoice,
  getAll: getAllInvoices,
  removeInvoice,
  shareInvoice,
  remindInvoice
} = useClientBillingInvoices();
const { currentUser, isPortalUser } = useCurrentUserData();

const selectedInvoice = ref<ClientBillingInvoice>();
const selectedInvoices = ref<ClientBillingInvoice[]>([]);
const invoiceActionMenus = ref([
  {
    label: 'Edit',
    action: 'edit',
    icon: 'pi pi-pencil',
    iconClass: 'text-xl mr-1',
    showPortal: true
  },
  {
    label: 'Mark as Paid',
    action: 'markAsPaid',
    icon: 'pi pi-check-circle'
  },
  {
    label: 'Send Reminder',
    action: 'remind',
    icon: 'pi pi-undo'
  },
  {
    label: 'Share',
    action: 'share',
    icon: 'pi pi-share-alt'
  },
  {
    label: 'Download',
    action: 'payOrDownload',
    icon: 'pi pi-download'
  },
  {
    label: 'Cancel',
    action: 'cancel',
    icon: 'pi pi-times'
  }
]);
const confirmRemoveDialog = ref(false);
const confirmEditDialog = ref(false);
const markAsPaidDialog = ref(false);
const isInvoiceCreate = ref(false);
const canCallInvoicesData = ref(false);
const canCallInvoiceGetOne = ref(false);
const billingProfileIdProp = computed(() => props.billingProfileId);

const invoiceCards = ref<Card[]>([
  {
    id: 'totalInvoicesRaised',
    title: 'Total Invoices Raised',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
  },
  {
    id: 'totalInvoicesPaidAndReceived',
    title: 'Total Cancelled Invoices',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
  }
  /* {
    id: 'totalInvoicesAndAmountPending',
    title: 'Total Invoices Pending / Amount Pending',
    value: '7 / $2000',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
  }, */
]);
const isOverDue = ref();
const isRevisit = computed(() => !!selectedInvoice.value);
const invoiceCardData = computed(() => {
  return invoiceCards.value
    .map((e) => {
      switch (e.id) {
        case 'tasksDueTodayFilter':
          return {
            ...e,
            value: e.value
          };

        case 'tasksDueThisWeekFilter':
          return {
            ...e,
            value: e.value
          };

        case 'tasksDueNextWeekFilter':
          return {
            ...e,
            value: e.value
          };
        case 'overDueTasksFilter':
          return {
            ...e,
            value: e.value,
            color: `${isOverDue.value}`
          };

        default: {
          return { ...e };
        }
      }
    })
    .filter(e => e) as Card[];
});

function filterInvoiceActionMenus(invoice: ClientBillingInvoice) {
  const menusToFilter = ['edit', 'markAsPaid', 'remind', 'cancel', 'share'];
  const statusToCheck = ['PAID', 'CANCELLED'];

  return statusToCheck.includes(invoice.status as string)
    ? invoiceActionMenus.value.filter(
      (menu: MenuItem) => !menusToFilter.includes(menu.action)
    )
    : invoiceActionMenus.value;
}
const initialClientFilter = computed(() => {
  if (!props.clientId)
    return;
  const { applyFilter, data: initialFilter } = useFilterColumns();
  applyFilter('Client', [props.clientId]);
  return useEncodeFilterData(initialFilter);
});

const { isFetching } = useQuery(
  ['invoice-list-card-data'],
  async () => {
    return () => ({
      data: []
    });
  },
  {
    onSuccess: (value) => {
      // TODO:
    }
  }
);

const {
  data: invoicesList,
  isLoading: loadingInvoicesList,
  isFetching: fetchingInvoicesList
} = useQuery(
  ['client-billing-invoices', billingProfileIdProp],
  () => {
    if (route.name === 'admin-billing' && activeIndex.value !== 0)
      return;
    return getAllInvoices({
      billingProfileId: props.billingProfileId as string,
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value
        ? queryFilters.value
        : initialClientFilter.value,
      sortBy: querySortBy.value
    });
  },
  {
    onSuccess: (
      data: PaginatedResponse<ClientBillingInvoice> & {
        allRecordCount: number;
        allCancelledInvoicesCount: number;
      }
    ) => {
      invoiceCards.value[0].value = `${data.allRecordCount}`;
      invoiceCards.value[1].value = `${data.allCancelledInvoicesCount}`;
    }
  }
);

const {
  data: invoicesListData,
  isLoading: loadingInvoicesData,
  isFetching: fetchingInvoicesData
} = useQuery(
  ['client-billing-invoices-data', billingProfileIdProp],
  () => {
    return getAllInvoices({
      billingProfileId: props.billingProfileId as string
    });
  },
  {
    onSuccess: (data) => {
      canCallInvoicesData.value = false;
      exportToCSV(data.results);
    },
    enabled: canCallInvoicesData
  }
);

const {
  data: invoiceDetails,
  isLoading: loadingInvoice,
  isFetching: fetchingInvoice
} = useQuery(
  ['invoice-details'],
  () => {
    return getOneInvoice(selectedInvoice.value?.id as string);
  },
  {
    onSuccess: (data: ClientBillingInvoice) => {
      goToGenerateInvoice();
    },
    enabled: canCallInvoiceGetOne
  }
);

/* const { data: invoiceLimits } = useQuery('invoice-limit', () => {
  return getResourceLimits({ resource: ResourceType.invoicing, isPortalUser: isPortalUser.value });
});

const invoiceResource = computed(() => {
  const limitComputed = invoiceLimits.value?.[0].limit === -1 ? 0 : invoiceLimits.value?.[0].limit;
  const usageComputed = invoiceLimits.value?.[0].orgSubscriptionResourceUsages && invoiceLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? invoiceLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: invoiceResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'invoice-limit',
  resource: 'invoicing'
});

function showToast(actionType: APIActions,
  actionTitle: string,
  data?: ClientBillingInvoice) {
  if (!canCallInvoiceGetOne.value)
    selectedInvoice.value = undefined;
  queryClient.invalidateQueries('client-billing-invoices');
  initToast({
    actionType,
    title: actionTitle,
    summary: `${actionType} ${actionTitle}`,
    detail:
      actionType === 'Remind'
        ? `Reminder of ${actionTitle} ${
            data ? `for <strong>${data.invoiceNumber}</strong>` : ''
          } sent successfully.`
        : `${actionTitle} ${
            data ? `<strong>${data.invoiceNumber}</strong>` : ''
          } ${actionType}d successfully.`
  });
}

function toggleMenu(event: Event, ref: string) {
  const foundMenu = Array.isArray(
    currentInstance?.refs[ref] as InstanceType<typeof Menu>
  )
    ? (currentInstance?.refs[ref] as InstanceType<typeof Menu>[])[0]
    : (currentInstance?.refs[ref] as InstanceType<typeof Menu>);

  foundMenu && foundMenu.toggle(event);
}

function menuClick(item: MenuItem, data: any) {
  selectedInvoice.value = data;
  switch (item.action) {
    case 'edit':
      confirmEditDialog.value = true;
      break;
    case 'markAsPaid':
      markAsPaidDialog.value = true;
      break;
    case 'remind':
      // TODO:
      handleRemindInvoice();
      break;
    case 'share':
      // TODO:
      handleShareInvoice();
      break;
    case 'payOrDownload':
      {
        const a = document.createElement('a');
        a.href
          = `${window.location.origin}/invoices/${selectedInvoice.value?.id}`;
        a.target = '_blank';
        a.click();
      }
      break;
    case 'cancel':
      // TODO:
      prepareRemoveInvoice();
      break;

    default:
      break;
  }
  // menuItem.command && menuItem.command(menuItem as MenuItemCommandEvent);
}

const { mutateAsync: deleteInvoice, isLoading: removingInvoice } = useMutation(
  ['remove-invoice'],
  (id: string) => {
    return removeInvoice(selectedInvoice.value?.id as string);
  },
  {
    onSuccess: () => {
      showToast('Remove', 'Invoice', selectedInvoice.value);
    }
  }
);

const { mutateAsync: sharedInvoice, isLoading: sharingInvoice } = useMutation(
  ['share-invoice'],
  (id: string) => {
    return shareInvoice(selectedInvoice.value?.id as string);
  },
  {
    onSuccess: () => {
      showToast('Share', 'Invoice', selectedInvoice.value);
    }
  }
);

const { mutateAsync: remind, isLoading: remindingInvoice } = useMutation(
  ['share-invoice'],
  (id: string) => {
    return remindInvoice(selectedInvoice.value?.id as string);
  },
  {
    onSuccess: () => {
      showToast('Remind', 'Invoice', selectedInvoice.value);
    }
  }
);

/* const prepareEditInvoice = () => {
  emit('edit-invoice', selectedInvoice.value as ClientBillingInvoice);
}; */
function prepareRemoveInvoice() {
  confirmRemoveDialog.value = true;
}

async function handleShareInvoice() {
  // confirmRemoveDialog.value = true;
  await sharedInvoice(selectedInvoice.value?.id as string);
}

async function handleRemindInvoice() {
  // confirmRemoveDialog.value = true;
  await remind(selectedInvoice.value?.id as string);
}

function handleRemoveInvoice() {
  deleteInvoice(selectedInvoice.value?.id as string);
}
function handleBulkDownload(invoices: ClientBillingInvoice[]) {
  // TODO:
}

function handleSuccessPayment() {
  markAsPaidDialog.value = false;
  queryClient.invalidateQueries('client-billing-invoices');
}

function goToGenerateInvoice() {
  // router.push({ name: 'admin-billing-invoices-generate' });
  isInvoiceCreate.value = true;
}

function handleInvoiceCreateBack() {
  isInvoiceCreate.value = false;
  canCallInvoiceGetOne.value = false;
  selectedInvoice.value = undefined;
  if (!isFalsy(isQuickStart.value)) {
    const { quickstart, ...queryParams } = route.query;
    router.push({
      query: { ...queryParams }
    });
  }
}

async function prepareEditInvoice() {
  canCallInvoiceGetOne.value = true;
  // await deleteInvoice(selectedInvoice.value?.id as string);
}

watchEffect(() => {
  isOverDue.value = overDue(invoiceCards.value);
});

onBeforeMount(() => {
  if (isQuickStart.value && canDo('client_billing', 'single')) {
    isInvoiceCreate.value = true;
  }
});
</script>

<template>
  <transition name="slide-left" mode="out-in">
    <div v-if="isInvoiceCreate">
      <CommonPage
        :title="`${!isRevisit ? 'Generate Invoice' : 'Update Invoice'}`"
      >
        <BillingInvoiceGenerate
          :create="!isRevisit"
          :revisit="isRevisit"
          :client-billing-invoice="invoiceDetails"
          :client-details="clientDetails"
          :is-client-page="route.name === 'admin-clients-id'"
          @back="handleInvoiceCreateBack"
          @success="handleInvoiceCreateBack"
        />
      </CommonPage>
    </div>
    <div v-else>
      <CommonPage v-if="canDo('client_billing', 'single')" title="Invoices">
        <template #actions>
          <span
            v-tooltip.left="`${invoiceResource.limit && (invoiceResource.usage >= invoiceResource.limit) ? `Can't create more than available limit ${invoiceResource.limit}` : invoiceResource.limit && (invoiceResource.usage >= invoiceResource.limit) ? `Available limit of ${invoiceResource.limit} invoices already created` : 'Generate Invoice'}`"
            class="inline-block"
            style="height: 2.357rem;"
          >
            <Button
              icon="pi pi-plus"
              class="p-button-rounded"
              :disabled="invoiceResource.limit && (invoiceResource.usage >= invoiceResource.limit)"
              @click="goToGenerateInvoice"
            />
          </span>
        </template>
        <div>
          <div class="card">
            <WidgetCards
              class="mb-4"
              :loading="loadingInvoicesList || fetchingInvoicesList"
              :cards="invoiceCardData"
              :cards-in-row="3"
              is-card-small
            />
            <DataTable
              v-bind="{ ...tableAttrs }"
              ref="dataTableRef"
              v-model:filters="filters"
              v-model:selection="selectedInvoices"
              :value="invoicesList?.results || []"
              :total-records="invoicesList?.total || 0"
              :loading="loadingInvoicesList || fetchingInvoicesList"
              responsive-layout="scroll"
              breakpoint="768px"
              :global-filter-fields="['name']"
              export-filename="Invoices Data"
              @page="handlePageOrLimitChange($event)"
              @sort="handleSortChange($event)"
            >
              <template #header>
                <div class="flex justify-content-end">
                  <div>
                    <!-- <Button
                      v-if="selectedInvoices?.length"
                      icon="pi pi-download"
                      class="p-button-rounded mr-2"
                      v-tooltip.top="'Bulk Download'"
                      @click="handleBulkDownload(selectedInvoices)"
                    /> -->
                    <Button
                      v-if="invoicesList?.results?.length"
                      v-tooltip.top="'Export as CSV'"
                      icon="pi pi-download"
                      class="p-button-rounded mr-2"
                      :disabled="loadingInvoicesData || fetchingInvoicesData"
                      @click="canCallInvoicesData = true"
                    >
                      <i
                        v-if="loadingInvoicesData || fetchingInvoicesData"
                        class="pi pi-spin pi-spinner"
                      />
                    </Button>
                    <Button
                      v-if="!hideFilters"
                      type="button"
                      :icon="
                        queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'
                      "
                      class="p-button-icon-only p-button-rounded"
                      :class="[{ 'p-button-danger': queryFilters }]"
                      @click="toggleFilters(!!queryFilters)"
                    />
                  </div>
                </div>
                <div v-if="isFiltersVisible && !hideFilters" class="my-2">
                  <BillingInvoicesFilter
                    ref="filtersRef"
                    :filters="queryFilters"
                    :disabled-filters="disabledFilters"
                    :client-id="props.clientId"
                    :billing-id="`${props.billingProfileId}`"
                  />
                </div>
              </template>
              <template #empty>
                <div class="text-center">
                  No invoice record found.
                </div>
              </template>
              <!-- <Column headerStyle="width: 3rem" :selectionMode="'multiple'"> </Column> -->
              <Column field="invoiceNumber" header="Invoice Number">
                <template #body="{ data }">
                  <router-link
                    :to="{ name: 'invoices-id', params: { id: data.id } }"
                    class="flex align-items-center font-medium text-gray-900 cursor-pointer hover:text-gray-600"

                    target="_blank"
                  >
                    <span class="user-name">{{ data.invoiceNumber }}</span>
                  </router-link>
                </template>
              </Column>
              <Column
                v-if="!props.clientId"
                field="client.name"
                :header="`${$tConfig('CLIENT')}`"
              >
                <template #body="{ data }">
                  {{ data.client.name || 'NA' }}
                </template>
              </Column>
              <Column field="raisedBy.name" header="Raised By">
                <template #body="{ data }: { data: any }">
                  {{ fullName(data.raisedBy) || 'NA' }}
                </template>
              </Column>
              <Column field="createdAt" header="Created On">
                <template #body="{ data }">
                  {{ dateToHumanShort(data.createdAt) }}
                </template>
              </Column>
              <Column field="sharedAt" header="Shared On">
                <template #body="{ data }">
                  {{ data.sharedAt ? dateToHumanShort(data.sharedAt) : 'NA' }}
                </template>
              </Column>
              <Column field="status" header="Status">
                <template #body="{ data }">
                  {{ data.status }}
                </template>
              </Column>
              <Column field="amount" header="Amount">
                <template #body="{ data }">
                  {{ getInlCurrencyNumber(data.amount) }}
                </template>
              </Column>
              <Column field="balance" header="Balance">
                <template #body="{ data }">
                  {{ getInlCurrencyNumber(data.balance) }}
                </template>
              </Column>
              <Column header="Actions" class="text-center">
                <template #body="{ data }">
                  <div class="flex justify-content-center gap-2">
                    <Button
                      icon="pi pi-ellipsis-v"
                      class="p-button-sm p-button-secondary p-button-rounded bg-primary"
                      aria-haspopup="true"
                      :aria-controls="`overlay_menu_${data.id}`"
                      @click.stop="
                        toggleMenu($event, `menu-${data.id}` as string)
                      "
                    >
                      <i
                        v-if="
                          data.id === selectedInvoice?.id
                            && (removingInvoice
                              || sharingInvoice
                              || remindingInvoice
                              || loadingInvoice
                              || fetchingInvoice)
                        "
                        class="pi pi-spin pi-spinner"
                      />
                    </Button>
                    <Menu
                      :id="`overlay_menu_${data.id}`"
                      :ref="`menu-${data.id}`"
                      :model="
                        filterInvoiceActionMenus(data as ClientBillingInvoice)
                      "
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
          </div>
        </div>
      </CommonPage>
      <CommonPage v-else title="Invoices">
        <div class="card">
          <p class="text-center font-medium text-xl">
            You don't have access of the Invoices list.
          </p>
        </div>
      </CommonPage>
    </div>
  </transition>

  <CommonConfirmRemoveDialog
    v-if="confirmRemoveDialog"
    :visible="confirmRemoveDialog"
    title="Confirm Remove Invoice"
    @confirm="handleRemoveInvoice"
    @hide="confirmRemoveDialog = false"
  >
    <div>
      Are you sure you want to {{ 'remove' }} the invoice
      <strong>{{ selectedInvoice?.invoiceNumber }}</strong>?
    </div>
  </CommonConfirmRemoveDialog>
  <CommonConfirmRemoveDialog
    v-if="confirmEditDialog"
    :visible="confirmEditDialog"
    title="Confirm Edit Invoice"
    @confirm="prepareEditInvoice"
    @hide="confirmEditDialog = false"
  >
    <div>
      <div>
        Editing the invoice will remove the existing invoice
        <strong>{{ selectedInvoice?.invoiceNumber }}</strong>.
      </div>
      <div>
        Are you sure you want to {{ 'Edit' }} the invoice
        <strong>{{ selectedInvoice?.invoiceNumber }}</strong>?
      </div>
    </div>
  </CommonConfirmRemoveDialog>
  <Dialog
    v-model:visible="markAsPaidDialog"
    content-class="border-round-bottom-md"
    :modal="true"
    append-to="body"
    header="Make Invoice Payment"
    :breakpoints="defaultBreakpoints"
    :style="styles"
    @hide="markAsPaidDialog = false"
  >
    <BillingInvoiceMarkAsPaid
      :invoice-id="(selectedInvoice?.id as string)"
      :amount="selectedInvoice?.balance"
      @success="handleSuccessPayment"
      @cancel="markAsPaidDialog = false"
    />
  </Dialog>
</template>

<style lang="scss" scoped>
:deep(.p-datatable-wrapper) {
  .p-datatable-tbody > tr.p-highlight {
    color: #69707a;
    background-color: #eff6ff !important;
  }
}
</style>
