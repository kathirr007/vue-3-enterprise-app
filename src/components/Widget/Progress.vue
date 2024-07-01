<script setup lang="ts">
const props = defineProps<{
  total: number;
  name: string;
  completed: number;
  dueDate?: string;
  startDate?: string;
}>();
const { getProgressBarColor } = useUtilityFns();
const { dateToHumanShort } = useVueFilters();
const compltedEntitiesinPercent = computed(() => {
  const { total, completed } = props;
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
});
</script>

<template>
  <div class="flex align-items-center py-3 flex-column">
    <div class="w-full flex justify-content-between align-items-center mb-2">
      <span class="w-full text-900 font-medium text-lg">{{ name }}</span>
      <div class="flex align-items-end text-lg">
        <span
          class="font-medium text-900"
          :class="`text-${getProgressBarColor(compltedEntitiesinPercent)}`"
          >{{ compltedEntitiesinPercent + '%' }}</span
        >
      </div>
    </div>
    <ProgressBar
      class="w-full"
      :value="compltedEntitiesinPercent"
      :showValue="true"
    >
      <div
        class="w-full h-full"
        :class="`bg-${getProgressBarColor(compltedEntitiesinPercent)}`"
      ></div>
    </ProgressBar>
    <div class="w-full flex justify-content-between align-items-center mt-1">
      <span class="text-sm text-600"
        >{{ dateToHumanShort(`${startDate}`) }}
        <i class="pi pi-info-circle ml-1" v-tooltip.top="'Start Date'"
      /></span>
      <span class="text-sm text-600"
        >{{ dateToHumanShort(`${dueDate}`) }}
        <i class="pi pi-info-circle ml-1" v-tooltip.top="'Due Date'"
      /></span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.p-progressbar) {
  background: #ebebeb;
  height: 12px;
  .p-progressbar-label {
    height: 100%;
    width: 100%;
  }
}
</style>
