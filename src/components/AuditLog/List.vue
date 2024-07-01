<script setup lang="ts">
import { useQuery, useQueryClient } from 'vue-query';

const props = withDefaults(
  defineProps<{
    hideFilters?: boolean;
    disabledFilters?: string[];
  }>(),
  {
    disabledFilters: () => [],
    hideFilters: false,
  }
);

const queryClient = useQueryClient();
const {
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  currentLimit,
  filtersRef,
  currentPage,
  queryFilters,
  querySortBy,
  queryKeys,
} = useDataTableUtils();
const { dateToDateTime } = useVueFilters();
const { filterObjByKeys, isFalsy } = useUtilityFns();
const { getAll } = useAuditLog();
const tableRef = ref();
const isDownload = ref<boolean>(false);
const isFiltersVisible = ref<boolean>(false);
const isFormat = ref<string>();
const filterKeysToExclude = ref(['Client']);

const filtersApplied = computed(() => {
  return queryFilters.value
    ? filterObjByKeys(
        useDecodeFilterData(queryFilters.value),
        filterKeysToExclude.value,
        true
      )
    : {};
});

const doesFiltersHasValues = computed(() => {
  return !!Object.values(filtersApplied.value as any)
    .map((item: any) => item.value)
    .filter((value) => !isFalsy(value)).length;
});

const toggleFilters = (reset: boolean) => {
  if (reset && filtersRef.value) {
    filtersRef.value.resetFilters();
  } else {
    isFiltersVisible.value = !isFiltersVisible.value;
  }
};

const {
  data: auditLogs,
  isLoading: loadingAudiLog,
  isFetching: fetchingAuditlog,
} = useQuery(
  ['audit-log-list', isFormat, ...queryKeys],
  () => {
    if (isFormat.value) {
      return getAll({
        filters: queryFilters.value,
        format: isFormat.value,
      });
    } else {
      return getAll({
        page: currentPage.value,
        limit: currentLimit.value,
        filters: queryFilters.value,
        sortBy: querySortBy.value,
      });
    }
  },
  {
    onSuccess: (data) => {
      if (isDownload.value) {
        tableRef.value.exportCSV(
          { exportSuppressFooterLine: true },
          data.results
        );
        isDownload.value = false;
        isFormat.value = undefined;
      }
    },
  }
);

const exportToCSVFile = () => {
  isFormat.value = 'csv';
  isDownload.value = true;
};

watchEffect(async () => {
  if (doesFiltersHasValues.value) {
    isFiltersVisible.value = true;
  }
});
</script>

<template>
  <DataTable
    ref="tableRef"
    data-key="id"
    :total-records="auditLogs?.total"
    :value="auditLogs?.results"
    :loading="loadingAudiLog || fetchingAuditlog"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-end gap-2">
        <div>
          <Button
            v-if="!hideFilters"
            type="button"
            :icon="doesFiltersHasValues ? 'pi pi-filter-slash' : 'pi pi-filter'"
            class="p-button-icon-only p-button-rounded"
            @click="toggleFilters(!!doesFiltersHasValues)"
            :class="[{ 'p-button-danger': doesFiltersHasValues }]"
          />
        </div>
        <Button
          v-if="auditLogs && auditLogs.total"
          icon="pi pi-download"
          class="p-button-rounded"
          v-tooltip.top="'Download'"
          @click="exportToCSVFile"
        />
      </div>
      <div class="my-2" v-if="isFiltersVisible && !hideFilters">
        <AuditLogFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabledFilters="disabledFilters"
        ></AuditLogFilter>
      </div>
    </template>
    <Column class="w-2" field="resource" header="Resource Type">
      <template #body="{ data }">
        {{ data.resource }}
      </template>
    </Column>
    <Column class="w-2" field="event" header="Action">
      <template #body="{ data }">
        {{ data.event }}
      </template>
    </Column>
    <Column class="w-6" field="description" header="Description">
      <template #body="{ data }">
        <span v-html="data.description" />
      </template>
    </Column>
    <Column class="w-2" field="createdAt" header="Timestamp">
      <template #body="{ data }">
        {{ dateToDateTime(data.createdAt as string).date }}
        {{ dateToDateTime(data.createdAt as string).time }}
      </template>
    </Column>
    <template #empty>
      <div class="text-center">No Audit Log Found</div>
    </template>
  </DataTable>
</template>
