<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import router from '@/router';

const type = useRouteQuery<'template' | 'scratch'>('type');
const serviceCreationType = ref<'template' | 'scratch'>(type.value);
</script>

<template>
  <div
    class="bg-white border-2 border-round default-border-color border-round-lg"
  >
    <div class="border-bottom-2 p-3 default-border-color">
      <h3 class="card-title m-0">Create Project Template</h3>
    </div>
    <div class="py-6">
      <ServiceCreate
        :template="serviceCreationType === 'template'"
        @back="router.push({ name: 'admin-services' })"
        @success="router.push({ name: 'admin-services' })"
      />
    </div>
    <!-- <Button
          label="Help"
          icon="pi pi-plus"
          class="p-button-sm inline-block mr-2"
          @click="$router.push({ name: '' })"
        /> -->
  </div>
</template>

<style scoped lang="scss">
.description-container {
  width: 100% !important;
}
</style>
