<script lang="ts" setup>
const props = defineProps<{
  title: string;
  subtitle?: string;
  fontSize?: string;
  removeDivider?: boolean;
  removeUnderline?: boolean;
}>();
</script>

<template>
  <div>
    <div
      class="font-medium"
      :class="
        (fontSize || 'text-xl') + ' ' + (removeUnderline ? '' : 'underline')
      "
    >
      {{ title }}
    </div>
    <small v-if="subtitle">
      {{ subtitle }}
    </small>
    <Divider v-if="!removeDivider" />
  </div>
</template>
