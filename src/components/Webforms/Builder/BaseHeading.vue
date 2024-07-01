<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    level: number;
    label: string | null;
    align?: 'left' | 'center' | 'right';
    before?: string;
    description?: string;
  }>(),
  {
    level: 1,
    label: null,
    align: 'left',
  }
);

const inputScope = ref(null);
const show = ref(false);
onClickOutside(inputScope, () => {
  show.value = false;
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>
<template>
  <div class="flex flex-column gap-1 w-full field mb-0">
    <label
      v-if="label && !$slots.edit"
      class="block text-sm font-medium text-gray-700"
    >
      {{ label }}
    </label>
    <div v-else>
      <slot name="edit" />
    </div>
    <CommonHeadings
      :label="label"
      :level="level"
      :heading-classes="`text-${align}`"
      v-bind="$attrs"
    />
  </div>
</template>
