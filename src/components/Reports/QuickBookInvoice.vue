<script setup lang="ts">
import type { Invoice } from '@/types/invoices.type';
import { useQuery } from 'vue-query';

const props = withDefaults(
  defineProps<{
    hideFilters?: boolean;
    disabledFilters?: string[];
    clientId?: string;
  }>(),
  { disabledFilters: () => [], hideFilters: false }
);

const { clientId: clientIdProp } = toRefs(props);
const selectedId = ref<string>();
const selectedInvoiceNo = ref<string>();
const { dateToHumanShort } = useVueFilters();
const { reportsTableRef } = useReports();

const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  querySortBy,
  toggleFilters
} = useDataTableUtils();

const { filters } = useDatatableFilters();

const { data: filterData, applyFilter } = useFilterColumns();
if (clientIdProp?.value) {
  applyFilter('Client', [clientIdProp?.value]);
}
const initialFilters = useEncodeFilterData(filterData);
const { handleDownloadFile } = useDownloadFile();
const { isLoading: loadingInvoice, data: invoiceData } = useQuery(
  ['invoice-list', clientIdProp],
  () => {
    return useInvoicesList({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters,
      sortBy: querySortBy.value
    });
  }
);

const { isFetching: downlaoding } = useQuery(
  ['invoice-download-list', selectedId],
  () => {
    if (selectedId.value) {
      return useDownloadInvoice(selectedId.value as string);
    }
  },
  {
    onSuccess: (data) => {
      if (data) {
        handleDownloadFile(
          selectedInvoiceNo.value as string,
          data as unknown as string,
          'application/pdf'
        );
      }
    }
  }
);

function handleDownLoad(data: Invoice) {
  if (data) {
    selectedId.value = data?.id as string;
    selectedInvoiceNo.value = data?.invoiceNumber as string;
  }
}

function applyClientFilter(applyFilterFunc: (type: string, value: string) => void) {
  if (clientIdProp?.value) {
    applyFilterFunc('Client', clientIdProp?.value);
  }
}
</script>

<template>
  <DataTable
    ref="reportsTableRef"
    v-model:filters="filters"
    :value="invoiceData?.results"
    :loading="loadingInvoice"
    responsive-layout="scroll"
    breakpoint="768px"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange($event)"
  >
    <template #header>
      <div class="flex justify-content-between">
        <CommonListSearchInput
          v-bind="{
            listProps: {
              applyFilter: applyClientFilter,
            },
            placeholder: 'Search Invoice',
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
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <ReportsFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
          :record="invoiceData?.results"
          :client-id="clientId"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No Invoices found.
      </div>
    </template>
    <Column
      :header="`${$tConfig('CLIENT')}`"
      class="w-2"
      sortable
      :sort-field="invoiceData ? 'client.name' : 'client'"
      :show-filter-match-modes="false"
      :filter-menu-style="{ width: '14rem' }"
      style="min-width: 14rem;"
      column="client"
      filter-field="client"
      field="client"
    >
      <template #body="{ data }">
        <span class="team-name">{{ data.client.name }}</span>
      </template>
    </Column>
    <Column
      header="Invoice No."
      field="invoiceNumber"
      filter-field="invoiceNumber"
    />
    <Column header="Invoice Date" field="invoiceDate">
      <template #body="{ data }">
        {{ data.invoiceDate ? dateToHumanShort(data.invoiceDate) : 'None' }}
      </template>
    </Column>
    <Column header="Due Date" field="dueDate">
      <template #body="{ data }">
        {{ data.dueDate ? dateToHumanShort(data.dueDate) : 'None' }}
      </template>
    </Column>
    <Column header="Invoice Amount" field="totalAmount">
      <template #body="{ data }">
        <span> ${{ data.totalAmount }}</span>
      </template>
    </Column>
    <Column header="Balance Amount" field="balanceAmount">
      <template #body="{ data }">
        <span> ${{ data.balanceAmount }}</span>
      </template>
    </Column>
    <Column header="Status" field="status" />
    <!-- <Column class="text-center">
      <template #header>
        <div class="text-center">Actions</div>
      </template>
      <template #body="{ data }">
        <div class="inline-block">
          <Button
            icon="pi pi-download"
            class="p-button-rounded"
            v-tooltip.top="'Download'"
            @click="handleDownLoad(data)"
            :loading="downlaoding && selectedId === data.id"
          />
        </div>
      </template>
    </Column> -->
  </DataTable>
</template>
