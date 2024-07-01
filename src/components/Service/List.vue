<script setup lang="ts">
import router from '@/router';
import type { Service } from '@/types/service.type';
import { useQuery } from 'vue-query';

const emit = defineEmits<{
  (e: 'delete:service', data: Service): void;
}>();

const { filters } = useDatatableFilters();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  queryKeys,
  queryFilters,
  querySortBy,
  tableRecords
} = useDataTableUtils();
const { canDo } = usePermissions();
const { titleCase } = useVueFilters();

const { isLoading: loadingService, data: service } = useQuery(
  ['service-list', ...queryKeys],
  () =>
    useServiceListV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value
    }),
  {
    onSuccess: (data) => {
      tableRecords.value = data;
    }
  }
);
</script>

<template>
  <DataTable
    v-bind="tableAttrs"
    v-model:filters="filters"
    :value="service?.results"
    :total-records="service?.total"
    data-key="id"
    :loading="loadingService"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-end">
        <CommonListSearchInput placeholder="Search Project Templates" />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No Project Template record found.
      </div>
    </template>
    <Column header="Title" field="title" class="w-4">
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-services-id', params: { id: data.id } }"
          class="flex align-items-center cursor-pointer font-medium text-gray-900 hover:text-gray-600"
          :class="{ 'pointer-events-none': !canDo('services', 'single') }"
        >
          <span class="service-name">{{ data.name }}</span>
        </router-link>
      </template>
    </Column>
    <Column field="billingType" class="w-2 text-center">
      <template #header>
        <div class="w-full text-center">
          Billing Type
        </div>
      </template>
      <template #body="{ data }">
        {{
          data.billingType === 'HOURLY' ? `Per Unit (1 unit = 60 min)` : titleCase(data.billingType)
        }}
      </template>
    </Column>
    <Column class="w-2">
      <template #header>
        <div class="w-full">
          Billing Amount
        </div>
      </template>
      <template #body="{ data }">
        <span v-if="data.billingType === 'NONE'">No Charges</span>
        <span v-else class="flex align-items-center">
          <span class="inline-block">${{ data.billingRate }} </span>
          <template v-if="data.billingType === 'HOURLY'">
            <span class="inline-flex mx-1">/</span>
            <span> Unit </span>
          </template>
        </span>
      </template>
    </Column>
    <Column v-if="canDo('services', 'edit')" class="text-center w-2">
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div
          v-if="slotProps.data.org"
          class="md:w-full w-7rem flex align-items-center justify-content-center"
        >
          <!-- <router-link
            :to="{
              name: 'admin-services-id',
              params: { id: `${slotProps.data.id}` },
            }"
            class="underline font-medium"
            >{{ 'Revisit' }}</router-link
          > -->
          <Button
            v-if="(slotProps.data as Service).org"
            v-tooltip.top="'Revisit'"
            class="p-button-icon-only p-button-rounded"
            @click="
              router.push({
                name: 'admin-services-id-revisit',
                params: { id: `${slotProps.data.id}` },
              })
            "
          >
            <span class="pi pi-custom pi-revisit p-button-icon" />
          </Button>
        </div>
        <div v-else class="text-orange-500 text-center">
          Predefined
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped lang="scss">
.pi-revisit {
  width: 20px;
  height: 20px;

  &::before {
    background-color: #fff;
  }
}
</style>
