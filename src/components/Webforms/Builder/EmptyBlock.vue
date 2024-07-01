<script setup lang="ts">
const props = defineProps<{
  blockNumber: number;
}>();
const emits = defineEmits<{
  (e: 'selected'): void;
}>();
</script>

<template>
  <span
    class="p-button p-button-text border border-1 border-primary hover:text-white p-1 px-2 cursor-pointer w-full justify-content-center border-2 text-center text-sm font-semibold opacity-100"
    @click="emits('selected')"
  >
    {{ blockNumber }} Column{{ blockNumber > 1 ? 's' : '' }}
  </span>
</template>

<style scoped lang="scss">
.p-button {
  pointer-events: unset !important;
  &:hover {
    background-color: $primaryDarkColor;
    border-color: $primaryDarkColor !important;
  }
}
</style>
