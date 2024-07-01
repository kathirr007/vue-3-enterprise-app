<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';

const { isLarge } = useCommonBreakPoints();

const mailsData = [
  {
    name: 'Inbox',
    description: 'Inbox messages',
    route: 'inbox',
  },
  {
    name: 'Sent Items',
    description: 'Sent messages',
    route: 'sent-items',
  },
  {
    name: 'Archived',
    description: 'Archived messages',
    route: 'archived',
  },
];

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.IN },
});
</script>

<template>
  <DataTable
    :value="mailsData"
    responsiveLayout="scroll"
    breakpoint="768px"
    v-model:filters="filters"
    :globalFilterFields="['name']"
    :paginator="true"
    :rows="10"
    :alwaysShowPaginator="false"
    :page-link-size="3"
    filterDisplay="menu"
  >
    <template #empty>
      <div class="text-center">No mails found.</div>
    </template>
    <Column
      header="Name"
      class="w-2"
      :sortable="true"
      sortField="name"
      :showFilterMatchModes="false"
      :filterMenuStyle="{ width: '14rem' }"
      style="min-width: 14rem"
      filterField="name"
    >
      <template #body="{ data }">
        <router-link
          :to="{ name: 'admin-mails-type', params: { type: data.route } }"
          class="flex align-items-center font-medium cursor-pointer text-gray-900 hover:text-gray-600"
        >
          <div class="flex flex-column flex-1">
            <span class="report-name">{{ data.name }}</span>
          </div>
        </router-link>
      </template>
    </Column>

    <Column header="Description">
      <template #body="{ data }">
        {{ data.description || 'No description available' }}
      </template>
    </Column>
  </DataTable>
</template>
