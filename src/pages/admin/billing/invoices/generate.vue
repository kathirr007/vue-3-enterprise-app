<script setup lang="ts">
const router = useRouter();
</script>
<template>
  <div
    class="bg-white border-2 border-round default-border-color border-round-lg"
  >
    <div class="border-bottom-2 p-3 default-border-color">
      <h3 class="card-title m-0">Generate Invoice</h3>
    </div>
    <div class="py-6">
      <BillingInvoiceGenerate
        :create="true"
        @back="router.push({ name: 'admin-billing' })"
        @success="router.push({ name: 'admin-billing' })"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.description-container {
  width: 100% !important;
}
</style>
