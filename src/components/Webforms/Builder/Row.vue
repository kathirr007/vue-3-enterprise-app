<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    cols: number;
    deletable?: boolean;
    draggable?: boolean;
  }>(),
  {
    deletable: true,
    draggable: false
  }
);
const emits = defineEmits<{
  (e: 'clearRow'): void;
}>();

const confirmRemoveRow = ref(false);
</script>

<template>
  <div class="relative flex gap-3" v-bind="$attrs">
    <Icon
      v-if="draggable"
      icon="ooui:draggable"
      class="mt-4 flex-none text-xl tile-icon short-schema-rows cursor-move"
    />
    <template v-if="!$slots.default">
      <div
        v-for="(col, index) in cols"
        :key="index"
        class="field col-12 py-2"
        :class="`md:col-${12 / cols}`"
      >
        <slot />
      </div>
    </template>
    <slot />
    <i
      v-if="deletable"
      v-tooltip="'Remove Row'"
      class="pi pi-minus-circle transform text-red-500 rounded-lg cursor-pointer h-1rem w-1rem absolute right-6"
      tabindex="0"
      role="link"
      @click="confirmRemoveRow = true"
    />
  </div>
  <CommonConfirmRemoveDialog
    v-if="confirmRemoveRow"
    v-model:visible="confirmRemoveRow"
    title="Remove Field"
    @confirm="emits('clearRow')"
    @hide="confirmRemoveRow = false"
  >
    Are you sure you want to remove this row?
  </CommonConfirmRemoveDialog>
</template>

<style scoped lang="scss">
.pi-minus-circle {
  top: calc(50% - 6px);
}
.pi-minus-circle {
  right: 1.5rem;
}
</style>
