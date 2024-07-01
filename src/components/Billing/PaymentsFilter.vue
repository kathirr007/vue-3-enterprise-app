<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import dayjs from 'dayjs';

const props = defineProps<{
  disabledFilters?: string[];
  filters?: string;
  billingId: string;
}>();

const router = useRouter();
const route = useRoute();
const { pluralize } = useVueFilters();
const { getOneClients } = useClientBilling();
const { metaFilter, isFalsy } = useUtilityFns();
function clientListFn() {
  return getOneClients(props.billingId) as unknown as () => any[];
}

const activeIndex = useRouteQuery<string>('activeIndex');
const nestedActiveIndex = useRouteQuery<string>('nestedActiveIndex');

const { allFilters } = useDataTableUtils();

const selectedCreatedAt = ref<string[]>();
const selectedMode = ref<string[]>();
const selectedClients = ref<string[]>();

const paymentModeOptions = ref([
  { name: 'Cash', value: 'CASH' },
  { name: 'Online', value: 'ONLINE' },
  { name: 'Cheque', value: 'CHEQUE' },
  { name: 'Stripe', value: 'STRIPE' },
  { name: 'Paypal', value: 'PAYPAL' },
  { name: 'Other', value: 'OTHER' }
]);

defineExpose({
  applyFilters,
  resetFilters
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
    selectedMode.value,
    selectedCreatedAt.value
  ].some(filter => filter?.length);

  if (!shouldApplyFilters) {
    if (props.filters) {
      router.push({
        query: {
          activeIndex: activeIndex.value ? activeIndex.value : undefined,
          nestedActiveIndex: nestedActiveIndex.value
            ? nestedActiveIndex.value
            : undefined,
          billingId:
            route.name === 'admin-billing' ? props.billingId : undefined
        }
      });
    }
    return;
  }

  const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
  applyFilter(
    'Client',
    selectedClients.value ? [...(selectedClients.value as string[])] : undefined
  );
  applyFilter('Mode', selectedMode.value);
  applyFilter('CreatedAt', selectedCreatedAt.value);
  if (selectedCreatedAt.value && selectedCreatedAt.value[1] === null) {
    updateDateValue(selectedCreatedAt as Ref<string[]>);
    applyFilter('CreatedAt', selectedCreatedAt.value);
  }
  else {
    applyFilter('CreatedAt', selectedCreatedAt.value);
  }
  const preparedFilters = useEncodeFilterData(filterData);

  if (preparedFilters) {
    router.push({
      query: {
        activeIndex: activeIndex.value ? activeIndex.value : undefined,
        nestedActiveIndex: nestedActiveIndex.value
          ? nestedActiveIndex.value
          : undefined,
        filters: preparedFilters,
        billingId: route.name === 'admin-billing' ? props.billingId : undefined
      }
    });
  }
}

function resetFilters() {
  selectedClients.value = [];
  selectedMode.value = [];
  selectedCreatedAt.value = [];
  applyFilters();
}

watchEffect(() => {
  selectedClients.value = allFilters.value.Client.value;
  selectedMode.value = allFilters.value.Mode?.value;
  selectedCreatedAt.value = allFilters.value.CreatedAt?.value?.map(
    (date: string) => dayjs(date).toDate()
  );
});
</script>

<template>
  <div class="flex gap-2 flex-wrap">
    <div v-if="hasFilter('CreatedAt')">
      <Calendar
        v-model="selectedCreatedAt"
        class="w-full"
        placeholder="Select Date"
        selection-mode="range"
        date-format="dd M yy"
        hide-on-range-selection
        :manual-input="false"
        show-button-bar
      />
    </div>
    <div v-if="hasFilter('Mode')">
      <CommonMultiSelector
        v-model="selectedMode"
        :max-selected-labels="1"
        placeholder="Mode"
        :selected-items-label="getSelectedItemsLabel('Payment Modes')"
        :options="paymentModeOptions"
        option-label="name"
        option-value="value"
      />
    </div>
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

    <Button
      label="Apply"
      class="w-full sm:w-auto"
      @click="applyFilters"
    />
  </div>
</template>
