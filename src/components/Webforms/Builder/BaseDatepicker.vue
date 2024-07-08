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
    <VField :name="name">
      <Calendar
        :id="name"
        :tabindex="0"
        :name="name"
        v-bind="{ ...$attrs, placeholder: 'dd-MM-yyyy' }"
        show-icon
        icon-display="input"
      />
    </VField>
    <small v-if="description" class="block">
      {{ description }}
    </small>
  </div>
</template>

<style scoped lang="scss">
.p-calendar {
  padding: 0 !important;
}
</style>
