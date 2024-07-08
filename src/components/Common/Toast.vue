<script setup lang="ts">
import Toast from 'primevue/toast';

interface toastSlotProps {
  message: any;
}
function toastIconClasses(slotProps: toastSlotProps) {
  return [
    { 'pi-check': slotProps.message.severity === 'success' },
    { 'pi-info-circle': slotProps.message.severity === 'info' },
    {
      'pi-exclamation-triangle': slotProps.message.severity === 'warning'
    },
    { 'pi-times': slotProps.message.severity === 'error' }
  ];
}
</script>

<template>
  <Toast position="top-center" class="custom-toast" group="custom-tc">
    <template #message="slotProps">
      <span
        class="p-toast-message-icon pi"
        :class="toastIconClasses(slotProps)"
      />
      <div class="my-0 mx-3 flex-1">
        <span class="p-toast-summary block">
          {{ slotProps.message.summary }}
        </span>
        <div class="p-toast-detail" v-html="slotProps.message.detail" />
      </div>
    </template>
  </Toast>
</template>
