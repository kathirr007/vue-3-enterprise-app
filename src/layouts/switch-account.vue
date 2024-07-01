<script setup lang="ts">
const appMenuControls = allMenuControls;

const containerClass = computed(() => {
  return [
    'layout-wrapper',
    'layout-sidebar',
    {
      'layout-static': appMenuControls.sidebarStatic.value,
      // 'layout-rightpanel-active': appMenuControls.rightPanelActive.value,
      'layout-mobile-active': appMenuControls.staticMenuMobileActive.value,
      'layout-menu-light layout-topbar-light':
        !appMenuControls.isDarkTheme.value,
      'layout-menu-dark layout-topbar-dark': appMenuControls.isDarkTheme.value
    }
  ];
});
</script>

<template>
  <div id="layout-main-container" :class="containerClass">
    <div class="layout-content-wrapper">
      <SwitchAccountTopbar />
      <div>
        <div class="layout-content mt-6">
          <router-view v-slot="{ Component, route }">
            <div :key="route.fullPath">
              <component :is="Component" :key="route" />
            </div>
          </router-view>
        </div>
      </div>
      <AppFooter />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-wrapper.layout-sidebar .layout-main {
  padding: none !important;
}
</style>
