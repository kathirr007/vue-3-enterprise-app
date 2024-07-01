<script setup lang="ts">
import type { ImportedClient } from '@/types/client.type';

defineProps<{
  clients: ImportedClient[];
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'clients', value: ImportedClient[]): void;
}>();

const { isLarge } = useCommonBreakPoints();
const { filters, searchText } = useDatatableFilters();

const selectedClients = ref<ImportedClient[]>([]);
</script>

<template>
  <DataTable
    :value="clients"
    responsiveLayout="scroll"
    breakpoint="768px"
    :globalFilterFields="['DisplayName']"
    :paginator="true"
    v-model:filters="filters"
    :rows="15"
    :alwaysShowPaginator="false"
    v-model:selection="selectedClients"
    :page-link-size="isLarge ? 5 : 3"
  >
    <template #header>
      <div class="flex justify-content-end">
        <div class="p-input-icon-left mr-auto">
          <i class="pi pi-search" />
          <InputText
            v-model="searchText"
            placeholder="Search Clients"
            type="search"
          />
        </div>
        <span>
          <Button
            v-if="selectedClients.length"
            :label="`Import Clients [${selectedClients.length}]`"
            class="p-button-outlined"
            @click="emit('clients', selectedClients)"
            :loading="loading"
          />
        </span>
      </div>
    </template>
    <template #empty>
      <div class="text-center">No Clients Found</div>
    </template>
    <Column selectionMode="multiple" />
    <Column field="DisplayName" header="Name" :sortable="true" />
    <Column header="Email">
      <template #body="slotProps">
        <span>{{ slotProps.data.PrimaryEmailAddr?.Address || 'NA' }}</span>
      </template>
    </Column>
  </DataTable>
</template>

<style lang="scss" scoped></style>
