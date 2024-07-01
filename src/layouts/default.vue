<script setup lang="ts">
const appMenuControls = allMenuControls;
const layoutContentClass = useLayoutContentClass().contentClass;

const transitionName = ref('fade');
const currentRoute = useRoute();
const { isLarge } = useCommonBreakPoints();

watch(currentRoute, async (val, oldVal) => {
  const toDepth = val.path.split('/').length;
  const fromDepth = oldVal.path.split('/').length;
  transitionName.value = toDepth < fromDepth ? 'slide-left' : 'slide-right';
});

onMounted(() => {
  if (appMenuControls.sidebarStatic.value) {
    appMenuControls.toggleSidebar(true);
  }
});

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
      'layout-menu-dark layout-topbar-dark': appMenuControls.isDarkTheme.value,
    },
  ];
});
</script>

<template>
  <div id="layout-main-container" :class="containerClass">
    <div class="layout-content-wrapper">
      <AppTopbar></AppTopbar>

      <div class="layout-main" @click="appMenuControls.handleDocumentClick">
        <CommonBreadcrumbs v-if="isLarge" />
        <div
          class="layout-content"
          :class="[
            appMenuControls.mailLayout.value ? 'pb-0' : '',
            layoutContentClass,
          ]"
        >
          <router-view v-slot="{ Component, route }">
            <transition :name="transitionName" :appear="true" mode="out-in">
              <div :key="route.fullPath">
                <component :is="Component" :key="route" />
              </div>
            </transition>
          </router-view>
          <!-- <router-view /> -->
        </div>
        <AppFooter />
      </div>
    </div>

    <!-- <AppRightpanel v-if="appMenuControls.rightPanelActive"></AppRightpanel> -->

    <div
      class="layout-mask modal-in"
      @click="appMenuControls.handleDocumentClick"
    ></div>
  </div>
</template>
