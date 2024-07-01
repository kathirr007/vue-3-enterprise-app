<script setup lang="ts">
// Built with the help of vue-circular-count-down-timer package.
// Usage and examples can be found in https://github.com/noorzaie/vue-circular-count-down-timer
const props = withDefaults(
  defineProps<{
    size: number;
    strokeWidth: number;
    strokeColor: string;
    underneathStrokeColor: string;
    fillColor: string;
    valueFontSize: number;
    labelFontSize: number;
    steps: number;
    value: number;
    label: string;
    labelPosition: 'top' | 'bottom';
    showValue: boolean;
  }>(),
  {
    size: 0,
    strokeWidth: 0,
    // strokeColor: '#9d989b',
    strokeColor: '--primary-color',
    // underneathStrokeColor: '#eee',
    underneathStrokeColor: '--surface-50',
    // fillColor: '#fff',
    fillColor: '--surface-0',
    valueFontSize: 20,
    labelFontSize: 16,
    steps: 60,
    value: 10,
    label: '',
    labelPosition: 'bottom',
    showValue: true,
  }
);

const isMounted = ref(false);
const container = ref();
const labelRef = ref();

const circleSize = computed(() => {
  return props.size === 0 && isMounted.value
    ? props.label
      ? container.value.parentElement.clientHeight - labelRef.value.clientHeight
      : container.value.parentElement.clientHeight
    : props.size;
});
const cx = computed(() => circleSize.value / 2);
const cy = computed(() => circleSize.value / 2);
const r = computed(() => (circleSize.value - props.strokeWidth) / 2);
const circleLength = computed(() => 2 * Math.PI * r.value);
const stepLength = computed(() => circleLength.value / props.steps);
const strokeDasharray = computed(() => circleLength.value);
const strokeDashoffset = computed(
  () => circleLength.value - props.value * stepLength.value
);

onMounted(() => {
  isMounted.value = true;
});
</script>

<template>
  <div
    ref="container"
    class="circle__container"
    :style="{
      width: `${circleSize}px`,
      flexDirection: labelPosition === 'bottom' ? 'column' : 'column-reverse',
    }"
  >
    <div
      class="circle__circle"
      :style="{
        width: `${circleSize}px`,
        height: `${circleSize}px`,
        fontSize: `${valueFontSize}px`,
      }"
    >
      <div v-if="showValue" class="circle__value">
        {{ value }}
      </div>
      <svg
        :width="circleSize"
        :height="circleSize"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          :r="r"
          :cy="cx"
          :cx="cy"
          :stroke-width="strokeWidth"
          :stroke="`var(${underneathStrokeColor})`"
          :fill="`var(${fillColor})`"
        />
        <circle
          :transform="`rotate(-90, ${cx}, ${cy})`"
          :style="{ strokeDasharray, strokeDashoffset }"
          class="circle_animation"
          :r="r"
          :cy="cx"
          :cx="cy"
          :stroke-width="strokeWidth"
          :stroke="`var(${strokeColor})`"
          fill="transparent"
        />
      </svg>
    </div>
    <div
      v-if="label"
      class="circle__label"
      ref="labelRef"
      :style="{ fontSize: `${labelFontSize}px` }"
    >
      {{ label }}
    </div>
  </div>
</template>

<style scoped>
.circle__container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circle__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circle__value {
  position: absolute;
}

circle {
  -webkit-transition: all 0.5s ease;
  -moz-transition: all 0.5s ease;
  -ms-transition: all 0.5s ease;
  -o-transition: all 0.5s ease;
  transition: all 0.5s ease;
}
</style>
