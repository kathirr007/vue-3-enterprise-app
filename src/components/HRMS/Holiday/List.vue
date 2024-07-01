<script setup lang="ts">
// import type { HRHolidayFilterInput } from '@/types/hrms.type';
import type { APIActions } from '@/types/common.type';
import type { HRHoliday } from '@/types/hrms.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  // filters?: HRHolidayFilterInput[];
  multiSelect?: boolean;
  hideActions?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:holiday', value: { data: HRHoliday; action: APIActions }): void;
  (e: 'delete:holiday', value: { data: HRHoliday; action: APIActions }): void;
}>();

const {
  handlePageOrLimitChange,
  handleSortChange,
  tableAttrs,
  currentLimit,
  currentPage,
  queryFilters,
  querySortBy,
  queryKeys,
} = useDataTableUtils();
const { getAll } = useHrmsHolidays();
const { canDo } = usePermissions();
const { dateToHumanShort } = useVueFilters();

const { isLoading: loadingHolidays, data: holidays } = useQuery(
  ['holidays-list', ...queryKeys],
  () => {
    return getAll({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value,
      sortBy: querySortBy.value,
    });
  }
);

/* const { $client } = useNuxtApp();
const {
  data: holidays,
  pending,
  refresh: refreshHolidays,
} = useAsyncData(
  () => {
    const [page, limit] = queryKeys;
    return $client.adminHRMSHolidays.list.query({
      filters: props.filters,
      page: page.value,
      limit: limit.value,
    });
  },
  {
    watch: [toRef(props, 'filters'), ...queryKeys],
  }
);

function refresh() {
  refreshHolidays();
}

watchEffect(() => {
  if (pending.value === false) {
    emits('metaChange', holidays?.value?.meta);
  }
});

defineExpose({
  refresh,
}); */
</script>

<template>
  <DataTable
    data-key="id"
    :total-records="holidays?.total"
    :value="holidays?.results"
    :loading="loadingHolidays"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <Column header="Date">
      <template #body="{ data }">
        {{ dateToHumanShort(data.date) }}
      </template>
    </Column>
    <Column header="Name" field="name"></Column>
    <Column header="Description" field="description"></Column>
    <!-- <Column header="Actions" v-if="!hideActions">
      <template #body="{ data }">
        <HRMSHolidayListActions :holiday-id="data.id"></HRMSHolidayListActions>
      </template>
    </Column> -->
    <Column
      class="text-center w-2"
      v-if="canDo('holiday', 'edit') && !hideActions"
    >
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem">
          <Button
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="
              emit('update:holiday', { data: slotProps.data, action: 'Update' })
            "
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="
              emit('delete:holiday', { data: slotProps.data, action: 'Remove' })
            "
          />
        </div>
        <!-- <div v-else class="text-orange-500 text-center">Predefined</div> -->
      </template>
    </Column>
    <template #empty>
      <div class="text-center">No Holidays found</div>
    </template>
  </DataTable>
</template>
