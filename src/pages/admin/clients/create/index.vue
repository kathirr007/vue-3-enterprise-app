<script setup lang="ts">
import { useToasts } from '@/composables/toasts';
import { useRouter } from 'vue-router';

const router = useRouter();
const toast = useToasts();
const items = ref([
  {
    label: 'Add Client',
    tagline: '',
    to: '/admin/clients/create',
  },
  {
    label: 'Automation',
    to: '/admin/clients/create/automation',
  },
  {
    label: 'Client Info',
    to: '/admin/clients/create/client-info',
  },
]);
</script>

<template>
  <div>
    <div class="card">
      <Steps :model="items" />
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
      <div class="my-4">
        <h1 class="font-medium text-2xl mb-2">
          Choose Business Entity and fill in basic details to continue
        </h1>
        <ClientsAddClient />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
