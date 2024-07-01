<script setup lang="ts">
import type { TabViewChangeEvent } from 'primevue/tabview';
import { useQuery } from 'vue-query';

const { isPortalUser } = useCurrentUserData();

const subscribeDialog = ref(false);

const { activeTabIndex, tabRef, handleTabChange }
  = useSteps('admin-ai-setting');
const { allOrgIntegrationIds, isFeatureIntegrated, featureSubscribed }
  = usePermissions(!isPortalUser.value);

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});

/* const { data: smartFolderLimits } = useQuery('smart-folder-limit', () => {
  return getResourceLimits({ resource: ResourceType['smart folder'] });
});

const smartFolderResource = computed(() => {
  const limitComputed = smartFolderLimits.value?.[0].limit === -1 ? 0 : smartFolderLimits.value?.[0].limit;
  const usageComputed = smartFolderLimits.value?.[0].orgSubscriptionResourceUsages && smartFolderLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? smartFolderLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
  return { limit: limitComputed, usage: usageComputed };
}); */

const { resourceUsage: smartFolderResource } = useUsageLimit({
  isPortalUser: isPortalUser.value,
  queryKey: 'smart-folder-limit',
  resource: 'smart folder'
});

const createSmartFolder = ref(false);
function handleTabs(e: TabViewChangeEvent) {
  createSmartFolder.value = false;
  handleTabChange(e);
}

function handleCreateSmartFolder() {
  if (featureSubscribed('smart_folder', 'custom_smart_folder') === false) {
    subscribeDialog.value = true;
    return;
  }
  createSmartFolder.value = true;
}
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabs"
    @tab-click="handleTabs"
  >
    <TabPanel
      v-if="isFeatureIntegrated(['data_extraction'], allOrgIntegrationIds)"
      header="Data Extraction"
    >
      <Common426
        v-if="featureSubscribed('data_extraction', 'auto_extraction') === false"
        feature="data extraction"
      />
      <CommonPage v-else title="Data Extraction">
        <div class="card">
          <CommonLoading v-if="isLoading" />

          <AiSettingUpdateForm v-else :org-portal-data="orgDetails" />
        </div>
      </CommonPage>
    </TabPanel>
    <TabPanel
      v-if="isFeatureIntegrated(['smart_folder'], allOrgIntegrationIds)"
      header="Smart Folder"
    >
      <Common426
        v-if="featureSubscribed('smart_folder', 'custom_smart_folder') === false"
        feature="smart folder"
      />
      <CommonPage
        v-else
        content-class="pb-0"
        actions-classes="flex justify-content-end align-items-center"
      >
        <template #title>
          <h1 class="font-medium text-3xl text-primary mb-0">
            {{ createSmartFolder ? 'Create Smart Folder' : 'Smart Folder' }}
          </h1>
        </template>
        <template #actions>
          <span
            v-tooltip.left="`${smartFolderResource.limit && (smartFolderResource.usage >= smartFolderResource.limit) ? `Can't create more than available limit ${smartFolderResource.limit}` : smartFolderResource.limit && (smartFolderResource.usage >= smartFolderResource.limit) ? `Available limit of ${smartFolderResource.limit} smart folders already created` : ''}`"
          >
            <Button
              v-if="!createSmartFolder"
              icon="pi pi-plus"
              class="p-button-rounded ml-2"
              :disabled="smartFolderResource.limit && (smartFolderResource.usage >= smartFolderResource.limit)"
              @click="handleCreateSmartFolder"
            />
          </span>
        </template>
        <!-- <div v-if="createSmartFolder">
          <SmartFolderCreate @back="createSmartFolder = false" />
        </div>
        <div v-else>
        </div> -->
        <SmartFolderList
          :is-create="createSmartFolder"
          @back="createSmartFolder = false"
          @edit="createSmartFolder = true"
        />
      </CommonPage>
      <CommonSubscribeDialog
        v-if="subscribeDialog"
        :visible="subscribeDialog"
        feature="custom smart folder"
        @hide="subscribeDialog = false"
      />
    </TabPanel>
  </TabView>
</template>
