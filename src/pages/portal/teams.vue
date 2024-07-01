<script setup lang="ts">
const currentUser = cookies.get('user');
const { hasFeatureAccess } = useClientPortalAccess('team', 'Teams');
</script>

<template>
  <Common401 v-if="!hasFeatureAccess" feature="Teams" />
  <CommonPage v-else title="Teams">
    <div class="card">
      <TeamsPortalList :client-id="currentUser?.client.id" />
    </div>
  </CommonPage>
</template>

<style lang="scss" scoped></style>
