<script setup lang="ts">
import { Field as VField } from 'vee-validate';

withDefaults(
  defineProps<{
    name: string;
    label: string | null;
    before?: string;
    description?: string;
    options: Record<string, any>[];
  }>(),
  {
    label: null,
    options: () => []
  }
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="flex flex-column gap-1 w-full field mb-0">
    <div>
      <slot name="edit" />
    </div>
    <small v-if="before" class="-mt-1 block">
      {{ before }}
    </small>
    <div class="w-full flex flex-column gap-1">
      <VField :name="name" v-bind="$attrs">
        <div
          v-for="(item, index) in options"
          :key="index"
          class="flex align-items-center gap-1"
        >
          <Checkbox :input-id="name" :name="name" disabled />
          <label :for="name" class="ml-2">{{ item }}</label>
        </div>
      </VField>
    </div>
    <small v-if="description" class="block">
      {{ description }}
    </small>
  </div>
</template>

<style scoped lang="scss">
.p-dropdown {
  padding: 0 !important;
}
</style>
