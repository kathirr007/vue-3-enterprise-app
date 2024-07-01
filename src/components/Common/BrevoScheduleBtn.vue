<script setup lang="ts">
const props = defineProps<{
  scheduleUrl: string;
}>();

useHead({
  link: [
    {
      href: 'https://meetings.brevo.com/assets/styles/popup.css',
      rel: 'stylesheet',
    },
  ],
  script: [
    {
      type: 'text/javascript',
      src: 'https://meetings.brevo.com/assets/libs/popup.min.js',
      hid: 'brevo',
      key: 'brevo',
      async: true,
      defer: true,
    },
  ],
});

const openScheduleDialog = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  BrevoBookingPage.initStaticButton({
    url: props.scheduleUrl,
  });
  return false;
};
</script>

<template>
  <Button label="Schedule Now" @click="openScheduleDialog" />
</template>

<style lang="scss" scoped></style>
