<script setup lang="ts">
const props = defineProps<{
  showHeader: boolean;
}>();

const isHeaderOpen = computed(() => props.showHeader);
</script>

<template>
  <div v-if="isHeaderOpen">
    <slot name="header" />
  </div>
  <div v-else>
    <slot />
  </div>
</template>
