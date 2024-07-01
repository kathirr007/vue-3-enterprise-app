<script setup lang="ts">
const router = useRouter();
</script>

<template>
  <div
    class="bg-white border-2 border-round default-border-color border-round-lg"
  >
    <div class="border-bottom-2 p-3 default-border-color">
      <h3 class="card-title m-0">
        Create Profile
      </h3>
    </div>
    <div class="py-6">
      <ClientBillingCreate
        :profile="true"
        @back="router.push({ name: 'admin-client-billing' })"
        @success="router.push({ name: 'admin-client-billing' })"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.description-container {
  width: 100% !important;
}
</style>
