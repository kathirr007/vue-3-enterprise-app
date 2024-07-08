<script setup lang="ts">
import type { MailsAttachmentResponse } from '@/types/inbox.type';

const props = defineProps<{
  attachment: MailsAttachmentResponse;
  icon?: string | { name: string; class: string; tooltip: string }[];
  iconTooltip?: string;
  iconLoading?: boolean;
}>();

const emit = defineEmits<{
  (
    e: 'icon-click',
    attachment: MailsAttachmentResponse,
    iconItem?: string
  ): void;
}>();
</script>

<template>
  <div
    class="h-full w-full bg-gray-100 flex justify-content-between p-2 border-round-lg"
  >
    <div class="font-medium break-all">
      {{ attachment.name }}
    </div>
    <i
      v-if="iconLoading"
      class="pi pi-spin pi-spinner align-self-center ml-2"
    />
    <div v-else-if="Array.isArray(icon)" class="flex align-items-center">
      <i
        v-for="(iconItem, index) in icon"
        :key="index"
        v-tooltip="iconItem.tooltip || ''"
        class="p-1 hover:bg-white align-self-center border-circle icon-transistion cursor-pointer"
        :class="iconItem.class"
        @click="emit('icon-click', attachment, iconItem.name)"
      />
    </div>
    <i
      v-else-if="icon"
      v-tooltip="iconTooltip || ''"
      class="p-1 hover:bg-white align-self-center border-circle icon-transistion cursor-pointer ml-2"
      :class="icon"
      @click="emit('icon-click', attachment)"
    />
  </div>
</template>

<style scoped lang="scss">
.icon-transistion {
  transition: all 0.3s ease-in-out;
}
</style>
