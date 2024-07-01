<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    errorKey: string;
    errors?: Record<string, any>;
    values?: Record<string, any>;
    feedback?: boolean;
  }>(),
  {
    feedback: true
  }
);
const attrs = useAttrs();
</script>

<template>
  <div
    v-if="
      props.values
        && props.values[errorKey]
        && props.errors
        && !!!props.errors[errorKey]
    "
    class="text-green-600 font-medium"
    :class="attrs['success-class']"
  >
    <slot v-if="props.feedback">
      Looking good!
    </slot>
  </div>
  <div
    v-else
    class="p-error"
    :class="attrs['error-class']"
    v-html="props.errors && props.errors[errorKey]"
  />
</template>
