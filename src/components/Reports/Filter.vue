<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import type { Invoice } from '@/types/invoices.type';
import dayjs from 'dayjs';
import type { Ref } from 'vue';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  activeIndex?: number;
  record?: Invoice[];
  clientId?: string;
}>();

const router = useRouter();

const clientListFn = () => useClientList();
const { pluralize } = useVueFilters();
const activeIndex = useRouteQuery<string>('activeIndex');
const { allFilters } = useDataTableUtils();

const selectedClients = ref<string[]>();
const selectedStatus = ref<string[]>();
const selectedInvoiceDate = ref<string[]>();
const selectedDueDate = ref<string[]>();
const searchText = ref('');
const invoiceStatus = ref<Invoice[]>([]);

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedClients.value = allFilters.value.Client.value;
  const selectedFilterStatus = allFilters.value['Is Status']?.value;
  selectedStatus.value = selectedFilterStatus?.every((val: string) =>
    invoiceStatus.value.map(val => val.status).includes(val)
  )
    ? selectedFilterStatus
    : undefined;

  if (allFilters.value['LessThan Date'].value) {
    if (allFilters.value['LessThan Date'].column === 'invoiceDate') {
      selectedInvoiceDate.value = allFilters.value['LessThan Date']?.value?.map(
        (date: string) => dayjs(date).toDate()
      );
    }
    else {
      selectedInvoiceDate.value = allFilters.value['LessThan Date']?.value?.map(
        (date: string) => dayjs(date).toDate()
      );
    }
  }
  if (allFilters.value['Invoice Date']?.value) {
    selectedInvoiceDate.value = allFilters.value['Invoice Date']?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  if (allFilters.value['Due Date']?.value) {
    selectedDueDate.value = allFilters.value['Due Date']?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  if (props.record) {
    props.record.forEach((obj: any) => {
      const foundObject = invoiceStatus?.value.find(
        (uniqueObj: any) => uniqueObj.status === obj.status
      );
      if (!foundObject) {
        invoiceStatus.value.push(obj);
      }
    });
  }
});

function hasFilter(filterName: string) {
  return !props.disabledFilters?.includes(filterName);
}

function getSelectedItemsLabel(itemName: string) {
  return `{0} ${itemName} selected`;
}

function applyFilters() {
  const shouldApplyFilters = [
    selectedClients.value,
    selectedStatus.value,
    selectedDueDate.value,
    searchText.value,
    selectedInvoiceDate.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
  if (props.clientId) {
    applyFilter('Client', [props.clientId]);
  }
  else
    applyFilter(
      'Client',
      selectedClients.value
        ? [...(selectedClients.value as string[])]
        : undefined
    );
  applyFilter('SearchText', searchText.value);
  applyFilter(
    'Is Status',
    selectedStatus.value ? [...(selectedStatus.value as string[])] : undefined
  );
  if (selectedInvoiceDate.value && selectedInvoiceDate.value[1] === null) {
    updateDateValue(selectedInvoiceDate as Ref<string[]>);
    applyFilter('Invoice Date', selectedInvoiceDate.value);
  }
  else {
    applyFilter('Invoice Date', selectedInvoiceDate.value);
  }
  if (selectedDueDate.value && selectedDueDate.value[1] === null) {
    updateDateValue(selectedDueDate as Ref<string[]>);
    applyFilter('Due Date', selectedDueDate.value);
  }
  else {
    applyFilter('Due Date', selectedDueDate.value);
  }
  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters
      }
    });
  }
}

function resetFilters() {
  selectedClients.value = [];
  selectedStatus.value = [];
  selectedDueDate.value = [];
  selectedInvoiceDate.value = [];
  searchText.value = '';
  applyFilters();
}
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('Client')">
      <CommonMultiSelector
        v-model="selectedClients"
        :max-selected-labels="1"
        :placeholder="`${pluralize($tConfig('CLIENT'))}`"
        :selected-items-label="getSelectedItemsLabel(`${pluralize($tConfig('CLIENT'))}`)"
        :query-fn="(clientListFn as unknown as () => any[])"
        query-key="clients-list"
      />
    </div>
    <div v-if="hasFilter('Invoice Date')">
      <Calendar
        v-model="selectedInvoiceDate"
        class="w-full"
        placeholder="Invoice Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        show-button-bar
      />
    </div>
    <div v-if="hasFilter('Due Date')">
      <Calendar
        v-model="selectedDueDate"
        class="w-full"
        placeholder="Due Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        show-button-bar
      />
    </div>
    <div v-if="hasFilter('Is Status')">
      <CommonMultiSelector
        v-model="selectedStatus"
        placeholder="Status"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Is Status')"
        :options="invoiceStatus"
        option-label="status"
        option-value="status"
      />
    </div>

    <Button
      label="Apply"
      class="w-full sm:w-auto"
      @click="applyFilters"
    />
  </div>
</template>

<style lang="scss" scoped>
.scroll-wrapper {
  overflow: auto hidden;
  overscroll-behavior: contain auto;
  scroll-behavior: smooth;
  scrollbar-width: none;
}
</style>
