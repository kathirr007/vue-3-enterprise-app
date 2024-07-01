<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string;
  }>(),
  { width: '60px' }
);
</script>

<template>
  <div>
    <div class="spinner mx-auto">
      <span /><span />
    </div>
  </div>
</template>

<style scoped lang="scss">
.spinner {
  position: relative;
  width: v-bind(width);
  aspect-ratio: 1/1;
}

.spinner span {
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  border: 6px solid transparent;
  border-radius: 50%;
}

.spinner span:nth-child(1) {
  border-top-color: $primaryColor;
  animation: spinner-one 1.2s linear infinite;
}

.spinner span:nth-child(2) {
  border-bottom-color: $primaryColor;
  animation: spinner-two 1.2s linear infinite;
}

@keyframes spinner-one {
  0% {
    border-width: 6px;
    transform: rotate(0deg);
  }

  50% {
    border-width: 1px;
    transform: rotate(180deg);
  }

  100% {
    border-width: 6px;
    transform: rotate(360deg);
  }
}

@keyframes spinner-two {
  0% {
    border-width: 1px;
    transform: rotate(0deg);
  }

  50% {
    border-width: 6px;
    transform: rotate(180deg);
  }

  100% {
    border-width: 1px;
    transform: rotate(360deg);
  }
}
</style>
