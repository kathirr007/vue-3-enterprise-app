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
function handleLeads() {
  isLeadListVisible.value = true;
}
function handleListingData(data: BrightDirectory) {
  if (data) {
    listingId.value = data.id;
  }
}
function handlecreateOrUpdateDirectory(data: BrightDirectory) {
  queryClient.invalidateQueries('org-data');
}
</script>

<template>
  <CommonPage title="App Directory">
    <template #actions>
      <Button
        v-tooltip="'Leads'"
        class="p-button-rounded p-button-icon-only"
        @click="handleLeads"
      >
        <Icon icon="mdi:leads" class="text-xl" />
      </Button>
    </template>
    <div class="card">
      <CommonLoading v-if="isLoading" />
      <BrightDirectoryUpdateForm
        v-else
        :directory-id="orgDirectoryId as string"
        :org-details="orgDetails"
        @listing-data="handleListingData"
        @create-or-update-directory="handlecreateOrUpdateDirectory"
      />
    </div>
  </CommonPage>
  <Dialog
    v-model:visible="isLeadListVisible"
    :modal="true"
    append-to="body"
    header="Leads"
    :breakpoints="defaultBreakpoints"
    :style="{ width: '60vw' }"
    content-class="border-round-bottom-md"
  >
    <BrightDirectoryLeadList :listing-id="listingId" />
  </Dialog>
</template>
