<script setup lang="ts">
import type { BroadcastType } from '@/types/broadcast.type';
import { broadcastType } from '@/types/broadcast.type';

const route = useRoute();
const currentType = ref<BroadcastType>(route.params.type as BroadcastType);
const { updateBreadcrumb } = useBreadcrumbs();
const { featureSubscribed } = usePermissions();
const { titleCase } = useVueFilters();

onMounted(() => {
  updateBreadcrumb({
    breadcrumbs: [
      {
        label: 'Bulk Email'
        /* to: {
          name:
            currentType.value === 'client'
              ? 'admin-broadcasts-type'
              : 'admin-broadcasts-type',
          params: { type: 'client' },
        }, */
      },
      {
        label: `Email to ${titleCase(currentType.value)}`,
        to: {
          params: { type: currentType.value }
        }
      }
    ]
  });
});

const isValidBroadcastType = computed(() =>
  broadcastType.includes(currentType.value as BroadcastType)
);
</script>

<template>
  <div>
    <Common426 v-if="featureSubscribed('bulk_email', `email_to_${currentType}`) === false" :feature="`bulk email to ${currentType}`" />
    <template v-else>
      <BroadcastPage v-if="isValidBroadcastType" :broadcast-to="currentType" />
      <Common404 v-else title="Broadcast Not Found" class="border-round-lg" />
    </template>
  </div>
</template>
