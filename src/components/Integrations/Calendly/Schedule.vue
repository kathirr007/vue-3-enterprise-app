<script setup lang="ts">
defineProps<{
  calendlyUrl: string;
}>();

useHead({
  script: [
    {
      type: 'text/javascript',
      hid: 'calendly',
      key: 'calendly',
      src: 'https://assets.calendly.com/assets/external/widget.js',
      defer: true
    }
  ]
});

function isCalendlyEvent(e: any) {
  return (
    e.origin === 'https://calendly.com'
    && e.data.event
    && e.data.event.indexOf('calendly.') === 0
  );
}

function handleCalendlyEvent(e: any) {
  if (isCalendlyEvent(e)) {
    /* Example to get the name of the event */
    // console.log('Event name:', e.data.event);
    /* Example to get the payload of the event */
    // console.log('Event details:', e.data.payload);
  }
}

onMounted(() => {
  window.addEventListener('message', handleCalendlyEvent);
});
onBeforeUnmount(() => {
  window.removeEventListener('message', handleCalendlyEvent);
});
</script>

<template>
  <div
    id="calendly-container"
    class="calendly-inline-widget"
    :data-url="calendlyUrl"
  />
</template>

<style lang="scss" scoped>
.calendly-inline-widget {
  position: relative;
  min-width: 320px;
  height: 750px;
}
</style>
