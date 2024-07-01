<script setup lang="ts">
const containerClass = computed(() => {
  return ['layout-wrapper'];
});
</script>

<template>
  <div id="layout-main-container" :class="containerClass">
    <div class="layout-content-wrapper">
      <div class="layout-main p-0">
        <div class="layout-content mt-0">
          <router-view />
        </div>
        <AppFooter />
      </div>
    </div>
  </div>
</template>
