<script setup lang="ts">
defineProps<{
  label?: string;
  name: string;
  error?: string;
  required?: boolean;
}>();
</script>

<template>
  <div class="field">
    <label v-if="label" :for="name" class="label">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <slot></slot>
    <p v-if="error" class="p-error">
      {{ error }}
    </p>
  </div>
</template>

<style lang="scss">
.field {
  @apply mb-4 w-full;
}
.label {
  @apply block mb-2 font-medium;
}
</style>
