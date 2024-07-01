<script setup lang="ts">
const props = defineProps<{
  label: string;
  isStatic?: boolean;
  block?: Record<string, any>;
}>();

const emits = defineEmits<{
  (e: 'editable:edit'): void;
  (e: 'editable:remove'): void;
}>();
</script>

<template>
  <div class="flex flex-row-reverse justify-content-between">
    <div class="flex gap-1">
      <i
        class="pi pi-pencil cursor-pointer h-1rem w-1rem"
        @click="emits('editable:edit')"
        role="link"
        tabindex="0"
        v-tooltip="'Edit Field'"
      />
      <i
        class="pi pi-trash cursor-pointer text-red-500 h-1rem w-1rem ml-1"
        @click="emits('editable:remove')"
        v-tooltip="'Remove Field'"
        role="link"
        tabindex="0"
      />
    </div>
    <template v-if="!block?.isStatic">
      <label v-if="label" class="block text-sm font-medium text-gray-700">
        {{ label }}
      </label>
      <label v-else class="block text-sm font-medium text-yellow-700"
        >No label
      </label>
    </template>
    <label v-else for="">{{ block?.name || label }}</label>
  </div>
</template>
