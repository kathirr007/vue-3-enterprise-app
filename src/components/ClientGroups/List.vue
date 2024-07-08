<script setup lang="ts">
import type { ClientGroup } from '@/types/client-group';
import type { PaginatedResponse } from '@/types/common.type';

const props = withDefaults(
  defineProps<{
    clientGroups: PaginatedResponse<ClientGroup>;
    loadingClientGroups: boolean;
  }>(),
  {
    clientGroups: () => ({ results: [], total: 0 })
  }
);

const emit = defineEmits<{
  (e: 'update:clientGroup', data: ClientGroup): void;
  (e: 'delete:clientGroup', data: ClientGroup): void;
}>();

const { filters } = useDatatableFilters();
const { canDo, canDoSome } = usePermissions();
const { handlePageOrLimitChange, handleSortChange, tableAttrs, tableRecords }
  = useDataTableUtils();

watchEffect(() => {
  if (props.clientGroups) {
    tableRecords.value = props.clientGroups;
  }
});
</script>

<template>
  <DataTable
    v-bind="tableAttrs"
    v-model:filters="filters"
    :value="clientGroups.results"
    :total-records="clientGroups.total"
    :loading="loadingClientGroups"
    data-key="id"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    @page="handlePageOrLimitChange($event)"
    @sort="handleSortChange"
  >
    <template #header>
      <div class="flex justify-content-between">
        <CommonListSearchInput placeholder="Search Client Groups" />
      </div>
    </template>
    <template #empty>
      <div class="text-center">
        No client groups record found.
      </div>
    </template>
    <Column field="name" header="Name" class="w-3">
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-client-groups-id', params: { id: data.id } }"
          :class="{ 'pointer-events-none': !canDo('client_groups', 'single') }"
          class="flex align-items-center font-medium text-gray-900 cursor-pointer hover:text-gray-600"
        >
          <span class="user-name">{{ data.name }}</span>
        </router-link>
      </template>
    </Column>
    <!-- <Column field="name" header="Name" class="w-2" :sortable="true" /> -->
    <Column field="description" header="Description" />
    <Column
      field="clients"
      header="No of Clients"
      class="w-8rem text-center"
      sortable
    >
      <template #body="slotProps">
        <span>{{ slotProps.data._count.clients }}</span>
      </template>
    </Column>

    <!-- <Column
        v-if="
          canDo('client_groups', 'edit') && canDo('client_groups', 'delete')
        "
        class="text-center w-2"
      > -->
    <Column
      v-if="canDoSome('client_groups', ['delete', 'edit'])"
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
            v-if="canDo('client_groups', 'edit')"
            icon="pi pi-pencil"
            class="p-button-sm p-button-rounded p-button-primary mr-2"
            @click="emit('update:clientGroup', slotProps.data)"
          />
          <Button
            v-if="canDo('client_groups', 'delete')"
            icon="pi pi-trash"
            class="p-button-sm p-button-rounded p-button-danger"
            @click="emit('delete:clientGroup', slotProps.data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>
