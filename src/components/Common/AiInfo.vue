<script setup lang="ts">
const props = defineProps<{
  showLoading?: boolean;
  title: string;
}>();
</script>

<template>
  <div class="flex justify-content-center align-items-center">
    <div class="text-center">
      <img
        src="/images/robot-icon.png"
        alt="app assistant robot"
        class="w-4rem"
      >
      <p class="font-medium text-xl mt-2">
        {{ title }}
      </p>
      <!-- <i class="pi pi-spin pi-spinner" v-if="showLoading"></i> -->
      <div v-if="showLoading" class="my-4">
        <CommonLoading type="dots" :dots="5" />
      </div>
      <slot name="content" />
    </div>
  </div>
</template>
