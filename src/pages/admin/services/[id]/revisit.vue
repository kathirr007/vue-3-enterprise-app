<script setup lang="ts">
import router from '@/router';
import { useQuery } from 'vue-query';
import type { Service } from '@/types/service.type';

const route = useRoute();
const { updateBreadcrumb } = useBreadcrumbs();
const serviceId = ref(route.params.id as string);

const { data: serviceDetails, isLoading } = useQuery(
  'service-details-revisit',
  () => {
    if (!serviceId.value) return;
    return useServiceDetails(serviceId.value as string);
  },
  {
    onSuccess: (data: Service) => {
      updateBreadcrumb({
        breadcrumbs: [
          { label: 'Setup Project Template', to: { name: 'admin-services' } },
          {
            label: data.name,
            to: { name: 'admin-services-id', params: { id: data.id } },
          },
          { label: 'Revisit' },
        ],
      });
    },
  }
);

const isRevisit = computed(() => {
  return route.name?.toString().includes('revisit');
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <div
    class="bg-white border-2 border-round default-border-color border-round-lg"
  >
    <div class="border-bottom-2 p-3 default-border-color">
      <h3 class="card-title m-0">
        {{ 'Revisit ' + (serviceDetails?.name || '') }}
      </h3>
    </div>
    <div class="bg-blue-50 py-6">
      <div v-if="isLoading">
        <CommonLoading />
      </div>
      <ServiceCreate
        v-else
        @back="router.push({ name: 'admin-services' })"
        @success="router.push({ name: 'admin-services' })"
        :revisit="isRevisit"
        :service="serviceDetails"
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
