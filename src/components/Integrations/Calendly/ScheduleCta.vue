<script setup lang="ts">
withDefaults(
  defineProps<{
    showHelpText?: boolean;
    helpText?: string;
    btnText?: string;
    isCalendlyUrl?: boolean;
  }>(),
  {
    showHelpText: false,
  }
);

const emits = defineEmits<{
  (e: 'click'): void;
}>();

const router = useRouter();

const gotoSchedule = () => {
  router.push({ name: 'portal-schedule-meeting' });
};
</script>

<template>
  <div
    class="align-self-end align-items-end flex flex-order-0 md:flex-order-1 justify-content-end flex-column md:flex-row md:align-items-center"
  >
    <div
      v-if="showHelpText"
      class="text-900 font-medium mb-1 md:mb-0 mr-0 md:mr-2 text-xl"
    >
      {{ helpText || 'Need help?' }}
    </div>

    <Button
      @click="gotoSchedule"
      class="p-button p-component"
      :disabled="!isCalendlyUrl"
      :label="btnText || 'Schedule Call'"
    />
  </div>
</template>

<style lang="scss" scoped></style>
