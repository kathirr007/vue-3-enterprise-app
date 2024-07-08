<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    label: string | null;
    before?: string;
    description?: string;
  }>(),
  {
    label: null
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
  inheritAttrs: false
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
    <small v-if="before" class="-mt-1 block">
      {{ before }}
    </small>
    <Divider :name="name" v-bind="$attrs" />
    <small v-if="description" class="block">
      {{ description }}
    </small>
  </div>
</template>
