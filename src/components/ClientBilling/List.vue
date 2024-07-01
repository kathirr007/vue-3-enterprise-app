<script setup lang="ts">
import { useQuery } from 'vue-query';

const router = useRouter();
const { canDo } = usePermissions();
const { dateToHumanShort, pluralize } = useVueFilters();
const { getAll } = useClientBilling();
const { metaFilter } = useUtilityFns();
const { featureSubscribed } = usePermissions();

const { filters } = useDatatableFilters();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  queryKeys,
  queryFilters,
  tableRecords
} = useDataTableUtils();

const { isLoading, data: clientBillingData } = useQuery(
  ['client-billing-list', ...queryKeys],
  () => {
    return getAll({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value
    });
  }
);

const isBillingEnabled = computed(() => featureSubscribed('billing', 'billing_profile'));
const isMultipleBillingEnabled = computed(() => featureSubscribed('billing', 'multiple_billing_profile'));

const disableCreate = computed(() => {
  return !isBillingEnabled.value || (isBillingEnabled.value && !isMultipleBillingEnabled.value && (clientBillingData.value?.total as number) >= 1);
});

function getPayments(data: { _count: { payments: number } }[]) {
  return data.reduce((acc, curr) => {
    return acc + curr._count.payments;
  }, 0);
}
</script>

<template>
  <CommonPage :title="`${pluralize($tConfig('CLIENT_BILLING_PROFILE'))}`">
    <template #actions>
      <Button
        v-if="canDo('client_billing', 'create')"
        v-tooltip.left="`Add Billing Profile`"
        icon="pi pi-plus"
        class="p-button-rounded"
        :disabled="disableCreate"
        @click="
          router.push({
            name: 'admin-client-billing-create',
          })
        "
      />
    </template>

    <!-- <ClientBillingList v-if="canDo('client_billing', 'list')" /> -->
    <DataTable
      v-if="canDo('client_billing', 'list')"
      v-bind="tableAttrs"
      v-model:filters="filters"
      :total-records="clientBillingData?.total"
      :value="clientBillingData?.results"
      :loading="isLoading"
      data-key="id"
      responsive-layout="scroll"
      breakpoint="768px"
      :global-filter-fields="['name']"
      @page="handlePageOrLimitChange($event)"
    >
      <template #header>
        <div class="flex justify-content-between">
          <CommonListSearchInput placeholder="Search Name" />
        </div>
      </template>
      <template #empty>
        <div class="text-center">
          No record found.
        </div>
      </template>
      <Column header="Name" field="name" class="w-3">
        <template #body="{ data }">
          <router-link
            :to="{ name: 'admin-client-billing-id', params: { id: data.id } }"
            class="flex align-items-center cursor-pointer font-medium text-gray-900 hover:text-gray-600"
            :class="{ 'pointer-events-none': !canDo('client_billing', 'single') }"
          >
            <span class="service-name">{{ data.name }}</span>
          </router-link>
        </template>
      </Column>
      <Column header="Created Date" field="createdAt">
        <template #body="{ data }">
          {{ dateToHumanShort(data.createdAt) }}
        </template>
      </Column>

      <Column class="text-center" :header="`${pluralize($tConfig('CLIENT'))}`" field="clients">
        <template #body="{ data }">
          <div>
            {{ data._count.clientBillingProfiles }}
          </div>
        </template>
      </Column>
      <Column class="text-center" header="Invoices">
        <template #body="{ data }">
          {{ data._count.killBillInvoices }}
        </template>
      </Column>
      <Column class="text-center" header="Payments">
        <template #body="{ data }">
          {{ getPayments(data.killBillInvoices) }}
        </template>
      </Column>
      <Column class="text-center" header="Payment Gateway Integrated">
        <template #body="{ data }">
          {{ data.isPaymentGatewayIntegrated ? 'Yes' : 'No' }}
        </template>
      </Column>
    </DataTable>
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the Client Billing list.
      </p>
    </div>
  </CommonPage>
</template>

<style lang="scss" scoped>
.pi-revisit {
  width: 20px;
  height: 20px;

  &::before {
    background-color: #fff;
  }
}
</style>
