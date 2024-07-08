<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string;
    label: string | null;
    before?: string;
    switchText?: string;
    description?: string;
  }>(),
  {
    label: null
  }
);

const enabled = ref();
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
    >{{ label }}</label>
    <div v-else>
      <slot name="edit" />
    </div>
    <small v-if="before" class="-mt-1 block">
      {{ before }}
    </small>
    <div class="flex flex-wrap align-items-center gap-2">
      <InputSwitch v-model="enabled" disabled />
      <label v-if="switchText">
        {{ switchText }}
      </label>
    </div>
    <small v-if="description" class="block">
      {{ description }}
    </small>
  </div>
</template>
