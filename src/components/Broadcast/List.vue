<script setup lang="ts">
import type { Broadcast, BroadcastTemplate } from '@/types/broadcast.type';
import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const props = withDefaults(
  defineProps<{
    broadcasts?: Broadcast[];
    hideFilters?: boolean;
    disabledFilters?: string[];
  }>(),
  { disabledFilters: () => [], hideFilters: false }
);

const emit = defineEmits<{
  (e: 'update', data: BroadcastTemplate, type: string): void;
  (e: 'delete', data: string): void;
}>();

const appMenuControls = allMenuControls;

const broadcastTo = inject('broadcastTo');

const { dateToHumanShort, titleCase } = useVueFilters();
const { canDo, canDoSome } = usePermissions();
const selectedBroadcast = ref<Broadcast>();
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  handleSortChange,
  toggleFilters,
  tableAttrs,
  filtersRef,
  isFiltersVisible,
  queryFilters,
  queryKeys,
  querySortBy,
  tableRecords
} = useDataTableUtils();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Broadcast To', broadcastTo === 'team' ? [true] : [false]);

const initialFilters = useEncodeFilterData(filterData);

const { getBroadcasts } = useCommonListQueries();
const { data: broadcastList, isLoading } = useQuery(
  ['broadcasts-list', ...queryKeys],
  () =>
    useBroadcastListV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters,
      sortBy: querySortBy.value
    })
);
/* getBroadcasts({
  page: currentPage.value,
  limit: currentLimit.value,
  filters: queryFilters.value ? queryFilters.value : initialFilters,
  sortBy: querySortBy.value,
  queryKeys,
}); */

watchEffect(() => {
  if (broadcastList.value) {
    tableRecords.value = broadcastList.value;
  }
});

const openBroadcastDeleteModal = ref(false);

function handleDelete(data: Broadcast) {
  selectedBroadcast.value = data;
  openBroadcastDeleteModal.value = true;
}
function handleStatus(data: Broadcast) {
  const status = data.status;
  if (status) {
    return status === 'COMPLETED' ? 'Sent' : 'Scheduled';
  }
  else return 'None';
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.IN },
  businessEntity: { value: null, matchMode: FilterMatchMode.IN }
});
</script>

<template>
  <DataTable
    v-model:filters="filters"
    data-key="id"
    :loading="isLoading"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    filter-display="menu"
    :value="broadcastList?.results"
    :total-records="broadcastList?.total"
    sort-mode="single"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-between">
        <CommonListSearchInput
          v-bind="{
            listProps: {
              ...props,
              filterType: 'Broadcasts',
              broadcastType: broadcastTo,
            },
            placeholder: 'Search Emails',
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
        <a
          href="https://brightreturn.com/kb/cpa-client-communication"
          target="_blank"
        >
          <Button
            v-tooltip.top="'Need Help'"
            type="button"
            icon="pi pi-question-circle text-lg"
            class="p-button-icon-only p-button-rounded ml-2"
          />
        </a>
      </div>
      <div v-if="isFiltersVisible && !hideFilters" class="my-2">
        <BroadcastFilter
          ref="filtersRef"
          :filters="queryFilters"
          :disabled-filters="disabledFilters"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No record found.
      </div>
    </template>
    <Column field="name" header="Title" :sortable="true" class="w-2">
      <template #body="slotProps">
        <span>{{ slotProps.data.name }}</span>
      </template>
    </Column>
    <Column
      field="messages"
      sortable
      :header="`No. of ${
        broadcastTo === 'team' ? 'Team Member(s)' : `${$tConfig('CLIENT')} user(s)`
      }`"
      class="w-2 text-center"
    >
      <template #body="slotProps">
        <span>{{ slotProps.data._count.messages }}</span>
      </template>
    </Column>
    <Column field="type" header="Type" sortable sort-field="type" class="w-2">
      <template #body="slotProps">
        <span>{{
          slotProps.data.type ? titleCase(slotProps.data.type) : 'None'
        }}</span>
      </template>
    </Column>

    <Column
      field="status"
      header="Status"
      sortable
      sort-field="status"
      class="w-2"
    >
      <template #body="slotProps">
        <span>{{ handleStatus(slotProps.data) }}</span>
      </template>
    </Column>
    <Column field="Date" header="Scheduled/Sent Date" class="w-2 text-center">
      <template #body="slotProps">
        <span>{{
          slotProps.data.scheduleDate
            ? dateToHumanShort(
              slotProps.data.scheduleDate,
              'MMMM D, YYYY HH:mm A',
            )
            : 'Not Available'
        }}</span>
      </template>
    </Column>
    <Column
      v-if="canDoSome('broadcasts', ['edit', 'delete'])"
      class="text-center w-2"
    >
      <template #header>
        <div class="w-full text-center">
          Actions
        </div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem">
          <Button
            v-if="canDo('broadcasts', 'edit')"
            v-tooltip.top="
              `${handleStatus(slotProps.data) === 'Sent' ? 'Clone' : `Edit`}`
            "
            :icon="`pi ${
              handleStatus(slotProps.data) === 'Sent' ? 'pi-clone' : `pi-pencil`
            }`"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="
              emit(
                'update',
                slotProps.data,
                handleStatus(slotProps.data) === 'Sent' ? 'clone' : 'update',
              )
            "
          />
          <Button
            v-if="canDo('broadcasts', 'delete')"
            v-tooltip.top="'Delete'"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="handleDelete(slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
  <CommonConfirmRemoveDialog
    v-if="openBroadcastDeleteModal"
    :visible="openBroadcastDeleteModal"
    :title="`Confirm Delete ${titleCase(broadcastTo as string)} Broadcast`"
    :record-to-remove="selectedBroadcast"
    @confirm="emit('delete', selectedBroadcast?.id as unknown as string)"
    @hide="openBroadcastDeleteModal = false"
  />
</template>

<style lang="scss" scoped></style>
