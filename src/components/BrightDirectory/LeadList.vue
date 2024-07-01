<script setup lang="ts">
import { useQuery } from 'vue-query';

const props = defineProps<{
  listingId: string;
}>();

const {
  handlePageOrLimitChange,
  tableAttrs,
  currentLimit,
  currentPage,
  queryKeys,
} = useDataTableUtils();
const { fullName } = useVueFilters();

const { isLoading, data: leadList } = useQuery(
  ['lead-list', props.listingId, ...queryKeys],
  () => {
    return useLeadDirectoryList({
      id: props.listingId,
      page: currentPage.value,
      limit: currentLimit.value,
    });
  }
);
</script>

<template>
  <DataTable
    data-key="id"
    :value="leadList?.results"
    :loading="isLoading"
    :total-records="leadList?.total"
    responsive-layout="scroll"
    v-bind="tableAttrs"
    @page="handlePageOrLimitChange($event)"
  >
    <Column header="Name">
      <template #body="{ data }">
        {{ fullName(data.user) }}
      </template></Column
    >
    <Column header="Message" field="message"></Column>
    <Column header="Phone" field="phone">
      <template #body="{ data }">
        {{ data.phone ? data.phone : 'None' }}</template
      ></Column
    >
    <Column header="Email" field="user.email"></Column>
    <template #empty>
      <div class="text-center">No Leads Found</div>
    </template>
  </DataTable>
</template>

<style lang="scss" scoped></style>
