<script setup lang="ts">
import { FilterMatchMode } from 'primevue/api';

const { isLarge } = useCommonBreakPoints();

const mailsData = [
  {
    name: 'Inbox',
    description: 'Inbox messages',
    route: 'inbox'
  },
  {
    name: 'Sent Items',
    description: 'Sent messages',
    route: 'sent-items'
  },
  {
    name: 'Archived',
    description: 'Archived messages',
    route: 'archived'
  }
];

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.IN }
});
</script>

<template>
  <DataTable
    v-model:filters="filters"
    :value="mailsData"
    responsive-layout="scroll"
    breakpoint="768px"
    :global-filter-fields="['name']"
    :paginator="true"
    :rows="10"
    :always-show-paginator="false"
    :page-link-size="3"
    filter-display="menu"
  >
    <template #empty>
      <div class="text-center">
        No mails found.
      </div>
    </template>
    <Column
      header="Name"
      class="w-2"
      :sortable="true"
      sort-field="name"
      :show-filter-match-modes="false"
      :filter-menu-style="{ width: '14rem' }"
      style="min-width: 14rem"
      filter-field="name"
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
