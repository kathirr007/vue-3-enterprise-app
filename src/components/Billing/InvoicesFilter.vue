<script setup lang="ts">
import dayjs from 'dayjs';
import type { Ref } from 'vue';
import { useQuery } from 'vue-query';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  clientId?: string;
  billingId: string;
}>();

const router = useRouter();
const { pluralize } = useVueFilters();
const { getOneClients } = useClientBilling();
const { clientId: clientIdProp } = toRefs(props);
const { isPortalUser } = useCurrentUserData();
function clientListFn() {
  return getOneClients(props.billingId) as unknown as () => any[];
}
const route = useRoute();
const activeIndex = ref(route.query.activeIndex);
const { allFilters } = useDataTableUtils();
const { getAll: getStages } = useProjectStages();
const { data: projectTemplates } = useQuery(['project-templates'], () => {
  return useServiceListV2({});
});

const selectedClients = ref<string[]>();
const selectedDueDate = ref<string[]>();
const selectedStartDate = ref<string[]>();
const selectedServices = ref<string[]>();
const selectedStatus = ref<string[]>();

const paymentStatusOptions = ref([
  { name: 'Paid', value: 'PAID' },
  { name: 'Pending', value: 'PENDING' },
  { name: 'Partial', value: 'PARTIALLY_PAID' },
  { name: 'Cancelled', value: 'CANCELLED' }
]);

const searchText = ref('');

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
    selectedStartDate.value,
    selectedDueDate.value,
    searchText.value,
    selectedServices.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined,
          billingId:
            route.name === 'admin-billing' ? props.billingId : undefined
        }
      });
    }
    return;
  }

  // const isFederal = selectedFederal.value === 'true';

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();

  applyFilter(
    'Is Status',
    selectedStatus.value ? [...(selectedStatus.value as string[])] : undefined
  );
  applyFilter(
    'Client',
    selectedClients.value ? [...(selectedClients.value as string[])] : undefined
  );
  applyFilter('SearchText', searchText.value);

  if (selectedStartDate.value && selectedStartDate.value[1] === null) {
    updateDateValue(selectedStartDate as Ref<string[]>);
    applyFilter('CreatedAt', selectedStartDate.value);
  }
  else {
    applyFilter('CreatedAt', selectedStartDate.value);
  }

  if (selectedDueDate.value && selectedDueDate.value[1] === null) {
    updateDateValue(selectedDueDate as Ref<string[]>);
    applyFilter('Due Date', selectedDueDate.value);
  }
  else {
    applyFilter('Due Date', selectedDueDate.value);
  }

  if (selectedServices.value?.length) {
    applyFilter('Service', selectedServices.value);
  }

  if (selectedStatus.value?.length) {
    applyFilter('PaymentStatus', selectedStatus.value);
  }

  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        filters: preparedFilters,
        billingId: route.name === 'admin-billing' ? props.billingId : undefined
      }
    });
  }
}

function resetFilters() {
  selectedStatus.value = [];
  selectedClients.value = [];
  selectedStartDate.value = [];
  selectedDueDate.value = [];
  selectedServices.value = [];
  searchText.value = '';
  applyFilters();
}

defineExpose({
  searchText,
  applyFilters,
  resetFilters
});

watchEffect(() => {
  selectedClients.value = clientIdProp?.value
    ? [clientIdProp.value]
    : allFilters.value.Client.value;
  // const isFederalFilterSelected = allFilters.value['Federal'].value === 'true';

  selectedStatus.value = allFilters.value['Is Status']?.value;
  if (allFilters.value['LessThan Date'].value) {
    if (allFilters.value['LessThan Date'].column === 'startDate') {
      selectedStartDate.value = allFilters.value['LessThan Date']?.value?.map(
        (date: string) => dayjs(date).toDate()
      );
    }
    else {
      selectedDueDate.value = allFilters.value['LessThan Date']?.value?.map(
        (date: string) => dayjs(date).toDate()
      );
    }
  }
  if (allFilters.value.CreatedAt?.value) {
    selectedStartDate.value = allFilters.value.CreatedAt?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  if (allFilters.value['Due Date']?.value) {
    selectedDueDate.value = allFilters.value['Due Date']?.value?.map(
      (date: string) => dayjs(date).toDate()
    );
  }
  if (allFilters.value.Service?.value) {
    selectedServices.value = allFilters.value.Service?.value;
  }
});
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('CreatedAt')">
      <Calendar
        v-model="selectedStartDate"
        class="w-full"
        placeholder="Created Date"
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
    <div v-if="hasFilter('PaymentStatus')">
      <CommonMultiSelector
        v-model="selectedStatus"
        placeholder="Status"
        option-label="name"
        option-value="value"
        :max-selected-labels="1"
        :selected-items-label="getSelectedItemsLabel('Status')"
        :options="paymentStatusOptions"
      />
    </div>
    <div v-if="hasFilter('Client')">
      <CommonMultiSelector
        v-model="selectedClients"
        :max-selected-labels="1"
        :placeholder="`${pluralize($tConfig('CLIENT'))}`"
        :selected-items-label="getSelectedItemsLabel(`${pluralize($tConfig('CLIENT'))}`)"
        :query-fn="clientListFn"
        query-key="clients-list"
      />
    </div>
    <!-- <div v-if="hasFilter('Service')">
      <CommonMultiSelector
        v-model="selectedServices"
        :maxSelectedLabels="1"
        placeholder="Project Templates"
        optionLabel="name"
        :selectedItemsLabel="getSelectedItemsLabel('Service')"
        :options="projectTemplates?.results"
      ></CommonMultiSelector>
    </div> -->

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
