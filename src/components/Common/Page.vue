<script setup lang="ts">
defineProps<{
  title?: string;
  contentClass?: string;
}>();
const attrs = useAttrs();
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <!-- <div class="text-right" v-if="$slots.helpActions">
    <div class="space-x-2.5">
      <slot name="helpActions"></slot>
    </div>
  </div> -->
  <div
    class="w-full flex flex-column md:align-items-center md:justify-content-between md:flex-row"
  >
    <header class="w-full flex align-items-center flex-column md:flex-row">
      <div class="w-full md:w-8 md:mr-4">
        <h1 v-if="!$slots.title" class="font-medium text-3xl text-primary mb-0">
          {{ title }}
        </h1>
        <slot name="title" />
        <div class="text-md">
          <slot name="description" />
        </div>
      </div>
      <div class="mt-2 md:m-0 w-full md:w-4">
        <div
          v-if="$slots.helpActions"
          :class="attrs['help-actions-classes']"
          class="space-y-2.5 md:space-y-0.5 mb-2 text-right"
        >
          <slot name="helpActions" />
        </div>
        <div
          v-if="$slots.actions"
          class="space-y-2.5 md:space-y-0.5 text-right"
          :class="attrs['actions-classes']"
        >
          <slot name="actions" />
        </div>
      </div>
    </header>
  </div>
  <div class="grid mt-3">
    <div class="col-12" :class="contentClass">
      <slot />
    </div>
  </div>
</template>
