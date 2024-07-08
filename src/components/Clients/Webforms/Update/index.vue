<script setup lang="ts">
import type { WebformType } from '@/types/webforms.type';
import { useQueryClient } from 'vue-query';

const props = defineProps<{
  webformType: WebformType;
  webformId: string;
  clientId?: string;
  isTemplate?: boolean;
  isRevisit?: boolean;
}>();

const emit = defineEmits<{
  (e: 'modalClose'): void;
}>();

const route = useRoute();
const queryClient = useQueryClient();
const { webformId: webformIdProp } = toRefs(props);

function handleBack() {
  emit('modalClose');
}

function handleSuccess() {
  // queryClient.invalidateQueries('get-webform-details');
  emit('modalClose');
}
</script>

<template>
  <!-- <CommonLoading v-if="loadingWebform" /> -->
  <div
    class="mx-auto p-3 border-2 border-round default-border-color border-round-lg"
  >
    <WebformsBuilder
      :key="route.fullPath"
      :webform-type="webformType"
      :webform-id="webformIdProp"
      is-from-client
      hide-values
      disable-form
      @back="handleBack"
      @success="handleSuccess"
    />
  </div>
</template>

<style lang="scss" scoped></style>
