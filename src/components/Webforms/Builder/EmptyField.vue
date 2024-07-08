<script setup lang="ts">
const emits = defineEmits<{
  (e: 'selected'): void;
}>();
</script>

<template>
  <span
    class="p-button p-button-text border border-1 border-primary hover:text-white p-1 px-2 cursor-pointer w-full justify-content-center border-2 text-center text-sm font-semibold opacity-100"
    @click="emits('selected')"
  >
    <i class="pi pi-plus-circle" />
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
