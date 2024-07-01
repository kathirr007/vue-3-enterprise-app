<script setup lang="ts">
import type { Project } from '@/types/project.type';
import { useQuery } from 'vue-query';
import type { Card } from '@/types/dashboard.type';
import type { PaginatedResponse } from '@/types/common.type';
import type { ClientBillingPayment } from '@/types/client-billing-payment.type';
import type { ClientBillingProfile } from '@/types/client-billing.type';

const props = withDefaults(
  defineProps<{
    hideActions?: boolean;
    hideFilters?: boolean;
    disabledFilters?: string[];
    clientId?: string;
    billingProfileId: string;
  }>(),
  { disabledFilters: () => [], hideFilters: false }
);

const { dateToHumanShort, titleCase } = useVueFilters();
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
const { canDo, canDoSome } = usePermissions();

const canCallPaymentsData = ref(false);
const canCallTilesData = ref(false);
const selectedInvoice = ref<Project>();
const selectedInvoices = ref<Project[]>([]);
const billingProp = computed(() => {
  return props.billingProfileId;
});

const tiles = ref<Card[]>([
  {
    id: 'otherAmount',
    title: 'Collection through Other Mode',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
  },
  {
    id: 'totalAmount',
    title: 'Collection through all Mode',
    value: '',
    color:
      'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
  }
]);

const { getAll, getTilesData, paymentModes } = useClientBillingPayments();
const { getOne } = useClientBilling();

const {
  data: payments,
  isLoading: loadingPayments,
  isFetching: fetchingPayments
} = useQuery(['client-billing-payments', billingProp], () => {
  let params: any = {
    clientId: props.clientId,
    filters: queryFilters.value,
    billingProfileId: props.billingProfileId
  };
  if (!canCallPaymentsData.value) {
    params = {
      ...params,
      page: currentPage.value,
      limit: currentLimit.value
    };
  }
  return getAll({
    ...params
  });
});

const {
  data: billingProfileDetails,
  isLoading: loadingBillingProfile,
  isFetching: fetchingBillingProfile
} = useQuery(
  'client-billing-profile-data',
  () => {
    return getOne(props.billingProfileId);
  },
  {
    onSuccess: (data: ClientBillingProfile) => {
      const paymentGatewayTile = {
        id: 'paymentAmount',
        title: `Collection through ${titleCase(
          data.orgIntegration?.integrationId
        )}`,
        value: '',
        color:
          'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400'
      };
      if (data.isPaymentGatewayIntegrated && data.orgIntegration) {
        tiles.value.unshift(paymentGatewayTile);
      }
      canCallTilesData.value = true;
    }
  }
);

const {
  data: paymentsData,
  isLoading: loadingPaymentsData,
  isFetching: fetchingPaymentsData
} = useQuery(
  'client-billing-payments-data',
  () => {
    return getAll({
      clientId: props.clientId,
      filters: queryFilters.value,
      billingProfileId: props.billingProfileId
    });
  },
  {
    onSuccess: (data: PaginatedResponse<ClientBillingPayment>) => {
      canCallPaymentsData.value = false;
      exportToCSV(data.results);
    },
    enabled: canCallPaymentsData
  }
);

const { data: tilesData, isFetching: isFetchingTiles } = useQuery(
  ['client-billing-payments-tiles', billingProp, billingProfileDetails],
  () => {
    return getTilesData({
      clientId: props.clientId,
      billingProfileId: props.billingProfileId
    });
  },
  {
    onSuccess: (data) => {
      /* const paymentGatewayTile = {
        id: 'paymentAmount',
        title: `Collection through ${titleCase(
          billingProfileDetails.value?.integrationId
        )}`,
        value: '',
        color:
          'text-3xl text-primary bg-white hover:text-white hover:bg-primary transition-all transition-duration-400',
      };
      if (billingProfileDetails.value?.orgIntegration) {
        tiles.value.unshift(paymentGatewayTile);
      } */
      tiles.value = tiles.value.map((e) => {
        switch (e.id) {
          case 'paymentAmount':
            return {
              ...e,
              value: `$${data?.paymentAmount || 0}`
            };
          case 'totalAmount':
            return {
              ...e,
              value: `$${data?.totalAmount || 0}`
            };

          case 'otherAmount':
            return {
              ...e,
              value: `$${data?.otherAmount || 0}`
            };

          default: {
            return { ...e };
          }
        }
      }) as Card[];
    },
    enabled: canCallTilesData
  }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="loadingBillingProfile || fetchingBillingProfile" />
  <WidgetCards
    v-else
    :cards="tiles"
    :loading="isFetchingTiles"
    is-card-small
    class="mb-4"
  />
  <DataTable
    v-bind="{ ...tableAttrs }"
    ref="dataTableRef"
    v-model:filters="filters"
    v-model:selection="selectedInvoices"
    :value="payments?.results || []"
    :total-records="payments?.total"
    :loading="loadingPayments || fetchingPayments"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    export-filename="Payments Data"
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
            v-if="payments?.results?.length"
            v-tooltip.top="'Export as CSV'"
            icon="pi pi-download"
            class="p-button-rounded mr-2"
            @click="canCallPaymentsData = true"
          >
            <i
              v-if="
                canCallPaymentsData
                  && (loadingPaymentsData || fetchingPaymentsData)
              "
              class="pi pi-spin pi-spinner"
            />
          </Button>
          <Button
            v-if="!hideFilters"
            type="button"
            :icon="queryFilters ? 'pi pi-filter-slash' : 'pi pi-filter'"
            class="p-button-icon-only p-button-rounded"
            :class="[{ 'p-button-danger': queryFilters }]"
            @click="toggleFilters(!!queryFilters)"
          />
        </div>
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <BillingPaymentsFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
          :billing-id="$props.billingProfileId"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No invoice record found.
      </div>
    </template>
    <!-- <Column headerStyle="width: 3rem" :selectionMode="'multiple'"> </Column> -->
    <Column field="paymentDate" header="Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.paymentDate) }}
      </template>
    </Column>
    <Column field="killbillPaymentNumber" header="Payment No">
      <template #body="{ data }">
        {{ data.killbillPaymentNumber }}
      </template>
    </Column>
    <Column field="sourceId" header="Reference No">
      <template #body="{ data }: { data: any }">
        {{ data.sourceId || 'NA' }}
      </template>
    </Column>
    <Column field="invoice.client.name" :header="`${$tConfig('CLIENT')}`">
      <template #body="{ data }">
        {{ data.invoice?.client?.name || 'NA' }}
      </template>
    </Column>
    <Column field="invoice.killBillInvoiceNumber" header="Invoice No">
      <template #body="{ data }: { data: any }">
        {{ data.invoice?.killBillInvoiceNumber || 'NA' }}
      </template>
    </Column>
    <Column field="source" header="Mode">
      <template #body="{ data }: { data: any }">
        {{ paymentModes[data.source] || 'NA' }}
      </template>
    </Column>
    <Column field="amount" header="Amount">
      <template #body="{ data }: { data: any }">
        {{ data.amount || 'NA' }}
      </template>
    </Column>
  </DataTable>
</template>

<style lang="scss" scoped></style>
