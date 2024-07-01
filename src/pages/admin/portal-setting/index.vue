<script setup lang="ts">
import { useQuery } from 'vue-query';

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});
</script>

<template>
  <CommonPage title="Client Portal Setting">
    <div class="card">
      <CommonLoading v-if="isLoading" />

      <PortalSettingUpdateForm v-else :orgPortalData="orgDetails" />
    </div>
  </CommonPage>
</template>
