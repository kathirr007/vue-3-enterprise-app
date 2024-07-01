<script setup lang="ts">
import type { WebformType } from '@/types/webforms.type';
import { useQueryClient } from 'vue-query';

const emit = defineEmits<{
  (e: 'modalClose'): void;
}>();

const props = defineProps<{
  webformType: WebformType;
  webformId: string;
  clientId?: string;
  isTemplate?: boolean;
  isRevisit?: boolean;
}>();

const route = useRoute();
const queryClient = useQueryClient();
const { webformId: webformIdProp } = toRefs(props);

const handleBack = () => {
  emit('modalClose');
};

const handleSuccess = () => {
  // queryClient.invalidateQueries('get-webform-details');
  emit('modalClose');
};
</script>

<template>
  <!-- <CommonLoading v-if="loadingWebform" /> -->
  <div
    class="mx-auto p-3 border-2 border-round default-border-color border-round-lg"
  >
    <WebformsBuilder
      :webform-type="webformType"
      :webform-id="webformIdProp"
      is-from-client
      @back="handleBack"
      @success="handleSuccess"
      hide-values
      disable-form
      :key="route.fullPath"
    />
  </div>
</template>

<style lang="scss" scoped></style>
