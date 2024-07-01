<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    level: number;
    label: string | null;
    headingClasses?: string;
    alignClass?: string;
  }>(),
  {
    level: 1,
    label: null,
  }
);

const slots = useSlots();

const isValidLevel = computed(() => props.level >= 1 && props.level <= 6);

const render = () => {
  return !isValidLevel.value
    ? null
    : h(
        `h${props.level}`,
        { class: ['text-primary m-0', props.headingClasses, props.alignClass] },
        props.label || slots.default
      );
};
</script>

<template>
  <component :is="render" />
</template>
