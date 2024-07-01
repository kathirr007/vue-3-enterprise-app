<script setup lang="ts">
import type { BrightDirectory } from '@/types/brightdirectory.type';
import { useQuery, useQueryClient } from 'vue-query';

const isLeadListVisible = ref(false);
const { metaFilter } = useUtilityFns();
const { defaultBreakpoints } = useCommonBreakPoints();
const queryClient = useQueryClient();

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});

const listingId = ref<string>('');

const orgDirectoryId = computed(() => {
  return orgDetails.value?.meta
    ? metaFilter(orgDetails.value?.meta, 'directory_id')
    : null;
});

const orgLogo = computed(() => {
  return orgDetails.value?.logo || undefined;
});
const handleLeads = () => {
  isLeadListVisible.value = true;
};
const handleListingData = (data: BrightDirectory) => {
  if (data) {
    listingId.value = data.id;
  }
};
const handlecreateOrUpdateDirectory = (data: BrightDirectory) => {
  queryClient.invalidateQueries('org-data');
};
</script>

<template>
  <CommonPage title="App Directory">
    <template v-slot:actions>
      <Button
        class="p-button-rounded p-button-icon-only"
        @click="handleLeads"
        v-tooltip="'Leads'"
      >
        <Icon icon="mdi:leads" class="text-xl" />
      </Button>
    </template>
    <div class="card">
      <CommonLoading v-if="isLoading" />
      <BrightDirectoryUpdateForm
        v-else
        @listingData="handleListingData"
        @createOrUpdateDirectory="handlecreateOrUpdateDirectory"
        :directoryId="orgDirectoryId as string"
        :orgDetails="orgDetails"
      />
    </div>
  </CommonPage>
  <Dialog
    :modal="true"
    appendTo="body"
    :header="`Leads`"
    v-model:visible="isLeadListVisible"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    :contentClass="'border-round-bottom-md'"
  >
    <BrightDirectoryLeadList :listingId="listingId" />
  </Dialog>
</template>
