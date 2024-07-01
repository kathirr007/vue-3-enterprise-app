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
    label: null,
  }
);
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
      :for="name"
      class="block font-medium text-900"
    >
      <span>{{ label }}</span>
    </label>
    <div v-else>
      <slot name="edit" />
    </div>
    <small class="-mt-1 block" v-if="before">
      {{ before }}
    </small>
    <div class="w-full">
      <VField
        :name="name"
        v-slot="{ handleChange, value, validate }"
        v-bind="$attrs"
      >
        <Dropdown
          :tabindex="0"
          @update:model-value="handleChange"
          @blur="validate()"
          class="w-full p-0"
          v-bind="{ ...$attrs }"
          :name="name"
          :id="name"
          :inputId="name"
          :model-value="value"
          disabled
        />
      </VField>
    </div>
    <small class="block" v-if="description">
      {{ description }}
    </small>
  </div>
</template>

<style scoped lang="scss">
.p-dropdown {
  padding: 0 !important;
}
</style>
