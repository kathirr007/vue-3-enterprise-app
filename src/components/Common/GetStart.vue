<script setup lang="ts">
import type { TimelineSteps } from '@/types/common.type';

const props = withDefaults(
  defineProps<{
    timelineSteps: TimelineSteps[];
  }>(),
  {
    timelineSteps: () => []
  }
);

const emit = defineEmits<{
  (e: 'emitStep', stepIndex: number | TimelineSteps): void;
}>();

const { replaceClient } = useVueFilters();

const filteredTimeline = computed(() => {
  return props.timelineSteps.filter(item => !item.hidden);
});

function emitStep(stepIndex: number | TimelineSteps) {
  emit('emitStep', stepIndex);
}
</script>

<template>
  <Timeline
    :value="filteredTimeline"
    align="alternate"
    class="customized-timeline"
  >
    <template #marker="slotProps">
      <span
        class="custom-marker shadow-2"
        :style="{
          backgroundColor: slotProps.item.color ? slotProps.item.color : '',
        }"
      >
        <i :class="slotProps.item.icon" />
      </span>
    </template>
    <template #content="slotProps">
      <Card
        :class="{
          'hide-content':
            timelineSteps.length - 1 === slotProps.index
            && !slotProps.item.content,
        }"
      >
        <template #title>
          {{ replaceClient(slotProps.item.title) }}
          <span v-if="slotProps.item.isRequired" class="text-red-500">*</span>
        </template>
        <template #subtitle>
          {{ replaceClient(slotProps.item.subtitle) }}
        </template>
        <template #content>
          <p>
            {{ replaceClient(slotProps.item.content) }}
          </p>
          <Button
            v-if="!slotProps.item.hideCta"
            :label="slotProps.item.status === 2 ? 'Review Now' : 'Add'"
            class="p-button"
            @click="emitStep(slotProps.item)"
          />
        </template>
      </Card>
    </template>
  </Timeline>
</template>

<style lang="scss" scoped>
.custom-marker {
  background-color: $primaryColor;
}

::v-deep(.p-timeline-event-content) {
  .hide-content .p-card-content {
    padding: 0;
  }

  .p-card-title,
  .p-card-subtitle {
    margin-bottom: 0;
  }
}
</style>
