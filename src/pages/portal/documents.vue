<script setup lang="ts">
const { featureSubscribed } = usePermissions();
const { hasFeatureAccess } = useClientPortalAccess('documents', 'Documents');
const { activeTabIndex, handleTabChange, tabRef }
  = useSteps('portal-documents');
</script>

<template>
  <TabView
    ref="tabRef"
    v-model:activeIndex="activeTabIndex"
    lazy
    @tab-change="handleTabChange"
    @tab-click="handleTabChange"
  >
    <TabPanel header="Documents">
      <Common401 v-if="!hasFeatureAccess" feature="Documents" />
      <Common426
        v-else-if="featureSubscribed('client_portal', 'documents') === false"
        feature="documents"
      />
      <ClientsDocuments v-else />
    </TabPanel>
    <TabPanel header="eSignature">
      <Common401 v-if="!hasFeatureAccess" feature="Documents" />
      <Common426
        v-else-if="featureSubscribed('esignature', 'esign') === false"
        feature="esignature"
      />
      <ClientsESignTab v-else />
    </TabPanel>
  </TabView>
</template>

<style lang="scss" scoped></style>
