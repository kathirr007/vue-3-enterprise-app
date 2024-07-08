<script setup lang="ts">
import { Field as VField } from 'vee-validate';

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
      :for="name"
      class="block font-medium text-900"
    >
      <span>{{ label }}</span>
    </label>
    <div v-else>
      <slot name="edit" />
    </div>
    <small v-if="before" class="-mt-1 block">
      {{ before }}
    </small>
    <div class="w-full">
      <VField
        v-slot="{ handleChange, value, validate }"
        :name="name"
        v-bind="$attrs"
      >
        <Dropdown
          v-bind="{ ...$attrs }"
          :id="name"
          :tabindex="0"
          class="w-full p-0"
          :name="name"
          :input-id="name"
          :model-value="value"
          disabled
          @update:model-value="handleChange"
          @blur="validate()"
        />
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
