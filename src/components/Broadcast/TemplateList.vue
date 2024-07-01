<script setup lang="ts">
import router from '@/router';
import type { BroadcastTemplate } from '@/types/broadcast.type';
import { FilterMatchMode } from 'primevue/api';
import { useQuery } from 'vue-query';

const emit = defineEmits<{
  (e: 'delete', data: string): void;
}>();

const broadcastTo = inject<string>('broadcastTo');
const selectedTemplate = ref<BroadcastTemplate>();

const openTemplateDeleteModal = ref(false);
const {
  currentPage,
  currentLimit,
  handlePageOrLimitChange,
  tableAttrs,
  queryFilters,
  querySortBy,
  queryKeys,
  tableRecords,
} = useDataTableUtils();

const { canDo, canDoSome } = usePermissions();
const { titleCase } = useVueFilters();
const { data: filterData, applyFilter } = useFilterColumns();
applyFilter('Broadcast To', broadcastTo === 'team' ? [true] : [false]);
applyFilter('Date Range', undefined);

const initialFilters = useEncodeFilterData(filterData);

const { getBroadcastTemplates } = useCommonListQueries();
const { data: broadcastTemplatesList, isLoading } = useQuery(
  ['broadcast-templates-list', ...queryKeys],
  () => {
    return useBroadcastTemplateListV2({
      page: currentPage.value,
      limit: currentLimit.value,
      filters: queryFilters.value ? queryFilters.value : initialFilters,
      sortBy: querySortBy.value,
    });
  }
);
/* getBroadcastTemplates({
  page: currentPage.value,
  limit: currentLimit.value,
  filters: queryFilters.value ? queryFilters.value : initialFilters,
  sortBy: querySortBy.value,
  queryKeys,
}); */

const handleDelete = (data: BroadcastTemplate) => {
  selectedTemplate.value = data;
  openTemplateDeleteModal.value = true;
};

watchEffect(() => {
  if (broadcastTemplatesList.value) {
    tableRecords.value = broadcastTemplatesList.value;
  }
});

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.IN },
  businessEntity: { value: null, matchMode: FilterMatchMode.IN },
});
</script>

<template>
  <DataTable
    @page="handlePageOrLimitChange($event)"
    dataKey="id"
    :loading="isLoading"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
    :value="broadcastTemplatesList?.results"
    :totalRecords="broadcastTemplatesList?.total"
    v-bind="tableAttrs"
  >
    <template #header>
      <div class="flex justify-content-end">
        <CommonListSearchInput
          v-bind="{
            listProps: {
              filterType: 'Broadcasts',
              broadcastType: broadcastTo,
            },
          }"
          placeholder="Search Templates"
        />
      </div>
    </template>
    <template #empty>
      <div class="text-center">No record found.</div>
    </template>
    <Column field="name" header="Name" class="w-4">
      <template #body="slotProps">
        <span>{{ slotProps.data.name }}</span>
      </template>
    </Column>
    <Column field="Description" header="Description" class="w-4">
      <template #body="slotProps">
        <span class="client-name">{{ slotProps.data.description }}</span>
      </template>
    </Column>
    <Column
      v-if="canDoSome('broadcast_templates', ['edit', 'delete'])"
      class="text-center w-2"
    >
      <template #header>
        <div class="w-full text-center">Actions</div>
      </template>
      <template #body="slotProps">
        <div class="md:w-full w-6rem" v-if="slotProps.data.org">
          <Button
            v-if="canDo('broadcast_templates', 'edit')"
            v-tooltip.top="'Revisit'"
            class="p-button-icon-only p-button-rounded"
            @click="
              router.push({
                name: 'admin-broadcasts-type',
                params: { type: broadcastTo },
                query: {
                  templateId: slotProps.data.id,
                  type: 'revisit',
                  activeIndex: '1',
                },
              })
            "
          >
            <span class="pi pi-custom pi-revisit p-button-icon"></span>
          </Button>
          <Button
            v-if="canDo('broadcast_templates', 'delete')"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger ml-2"
            @click="handleDelete(slotProps.data)"
            v-tooltip.top="'Delete'"
          />
        </div>
        <div v-else class="text-orange-500 text-center">Predefined</div>
      </template>
    </Column>
  </DataTable>
  <CommonConfirmRemoveDialog
    v-if="openTemplateDeleteModal"
    :visible="openTemplateDeleteModal"
    :title="`Confirm Delete ${titleCase(
      broadcastTo as string
    )} Broadcast Template`"
    :recordToRemove="{ ...selectedTemplate }"
    @confirm="emit('delete', selectedTemplate?.id as unknown as string)"
    @hide="openTemplateDeleteModal = false"
  />
</template>

<style lang="scss" scoped>
.pi-revisit {
  width: 20px;
  height: 20px;
  &:before {
    background-color: #fff;
  }
}
</style>
