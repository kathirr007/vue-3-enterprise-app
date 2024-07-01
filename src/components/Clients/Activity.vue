<script setup lang="ts">
import type { Client } from '@/types/client.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  clientId?: string;
  clientDetails?: Client;
}>();

const { getAll } = useAuditLog();
const { dateToDateTime } = useVueFilters();
const { data: filterData, applyFilter } = useFilterColumns();

const {
  data: auditLogs,
  isLoading: loadingActivities,
  isFetching: fetchingActivities
} = useQuery('audit-log-activity', async () => {
  applyFilter('Client', [props.clientId]);
  const clientActivityFilter = useEncodeFilterData(filterData);
  return getAll({
    page: 1,
    limit: 7,
    filters: clientActivityFilter
  });
});
</script>

<template>
  <div class="card-container overflow-y-auto" style="height: 110px;">
    <CommonLoading v-if="loadingActivities || fetchingActivities" />
    <div>
      <template v-if="auditLogs?.results.length">
        <div
          v-for="log in auditLogs?.results"
          :key="log.id"
          class="flex flex-column"
        >
          <div class="flex align-items-start py-1 w-full gap-3">
            <div class="inline-block w-max">
              <span class="inline-block mr-2">
                {{ dateToDateTime(log.createdAt as string).date }}
              </span>
              <span class="hidden xl:inline-block">{{
                dateToDateTime(log.createdAt as string).time
              }}</span>
            </div>
            <div class="flex-1" v-html="log.description" />
          </div>
        </div>
      </template>
      <div v-else>
        <span class="text-center">No audit logs found.</span>
      </div>
    </div>
  </div>
</template>
