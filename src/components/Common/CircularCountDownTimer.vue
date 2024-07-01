<script setup lang="ts">
// Built with the help of vue-circular-count-down-timer package.
// Usage and examples can be found in https://github.com/noorzaie/vue-circular-count-down-timer
import type { CountDownCircle } from '@/types/common.type';

const props = withDefaults(defineProps<CountDownCircle>(), {
  containerClasses: () => [],
  circleClasses: () => [],
  interval: 1000,
  stopConditions: () => ({}),
  triggerUpdate: true,
  showValue: true,
  size: 30,
  strokeWidth: 10,
  // strokeColor: '#9d989b',
  strokeColor: '--primary-color',
  // underneathStrokeColor: '#eee',
  underneathStrokeColor: '--surface-50',
  // fillColor: '#fff',
  fillColor: '--surface-0',
  valueFontSize: 20,
  labelFontSize: 16,
  labelPosition: 'bottom',
  circles: () => [],
});

const emit = defineEmits<{
  (e: 'started'): void;
  (e: 'finished'): void;
  (e: 'update', data: any): void;
}>();

const getCircleValues = (circles: any[]) => {
  const values: any = {};
  for (const circle of circles) {
    values[circle.id] = {
      value: circle.value || 0,
      stepLength: circle.stepLength || 1,
      steps: circle.steps,
      startValue: circle.startValue || 0,
      dependentCircles: circle.dependentCircles || [],
    };
  }
  return values;
};

const values = ref(getCircleValues(props.circles));
const timeOutId = ref();
const expected = ref();

function updateCircleValue(circleId: string | number) {
  const circle = values.value[circleId];

  if (
    circle.stepLength > 0 &&
    circle.value + circle.stepLength >= circle.steps
  ) {
    circle.value =
      ((circle.value + circle.stepLength) % circle.steps) + circle.startValue;
    for (const dc of circle.dependentCircles) {
      updateCircleValue(dc);
    }
  } else if (
    circle.stepLength < 0 &&
    circle.value + circle.stepLength < circle.startValue
  ) {
    circle.value =
      ((circle.value + circle.stepLength) % circle.steps) + circle.steps;
    for (const dc of circle.dependentCircles) {
      updateCircleValue(dc);
    }
  } else {
    circle.value += circle.stepLength;
  }
}
function shouldStop() {
  if (Object.keys(props.stopConditions).length > 0) {
    let stop = true;
    for (const id in props.stopConditions) {
      if (values.value[id].value !== (props.stopConditions as any)[id]) {
        stop = false;
        break;
      }
    }
    return stop;
  } else {
    return false;
  }
}
function notifyUpdateValues() {
  if (props.triggerUpdate) {
    const output: any = {};
    for (const id in values.value) {
      output[id] = values.value[id].value;
    }
    emit('update', output);
  }
}
function getCircleProps(circle: any) {
  return {
    value: circle.value,
    size: circle.size,
    strokeWidth: circle.strokeWidth,
    strokeColor: circle.strokeColor,
    underneathStrokeColor: circle.underneathStrokeColor,
    fillColor: circle.fillColor,
    valueFontSize: circle.valueFontSize,
    labelFontSize: circle.labelFontSize,
    steps: circle.steps,
    label: circle.label,
    labelPosition: circle.labelPosition,
  };
}
function startTimer() {
  emit('started');
  clearTimeout(timeOutId.value);
  expected.value = Date.now() + props.interval;
  timeOutId.value = setTimeout(nextStep, props.interval);
}

function nextStep() {
  updateCircleValue(props.mainCircleId);
  notifyUpdateValues();

  if (!shouldStop()) {
    const dt = Date.now() - expected.value;
    expected.value += props.interval;
    timeOutId.value = setTimeout(nextStep, Math.max(0, props.interval - dt));
  } else {
    emit('finished');
  }
}

defineExpose({
  startTimer,
});

watch(
  () => props.circles,
  (val) => {
    values.value = getCircleValues(val);
    startTimer();
  }
);

onMounted(async () => {
  await nextTick();
  startTimer();
});
</script>

<template>
  <div :class="['circles__container', ...containerClasses]">
    <div
      v-for="(circle, index) in circles"
      :key="index"
      :class="[
        'circle__item',
        ...(circle.hasOwnProperty('classList')
          ? circle.classList
          : circleClasses),
      ]"
    >
      <CommonCountDownCircle
        v-bind="{
          value: values[circle.id].value,
          size: 'size' in circle ? circle.size : size,
          strokeWidth:
            'strokeWidth' in circle ? circle.strokeWidth : strokeWidth,
          strokeColor:
            'strokeColor' in circle ? circle.strokeColor : strokeColor,
          underneathStrokeColor:
            'underneathStrokeColor' in circle
              ? circle.underneathStrokeColor
              : underneathStrokeColor,
          fillColor: 'fillColor' in circle ? circle.fillColor : fillColor,
          valueFontSize:
            'valueFontSize' in circle ? circle.valueFontSize : valueFontSize,
          labelFontSize:
            'labelFontSize' in circle ? circle.labelFontSize : labelFontSize,
          labelPosition:
            'labelPosition' in circle ? circle.labelPosition : labelPosition,
          showValue: 'showValue' in circle ? circle.showValue : showValue,
          steps: circle.steps,
          label: circle.label,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.circles__container {
  display: flex;
  flex-direction: row;
}

.circle__item {
  margin: 5px;
  height: 100%;
}
</style>
