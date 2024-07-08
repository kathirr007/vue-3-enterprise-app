<script setup lang="ts">
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

// const isProdBuild = import.meta.env.PROD;
const isProdBuild = window.location.host.includes('app.');

useHead({
  titleTemplate: (title?: string) =>
    !title ? 'App Return' : `App Return | ${title}`
});

if (isProdBuild) {
  useHead({
    script: [
      {
        type: 'text/javascript',
        hid: 'clarity',
        key: 'clarity',
        innerHTML: `
        (function (c, l, a, r, i, t, y) {
          c[a] =
            c[a] ||
            function () {
              (c[a].q = c[a].q || []).push(arguments);
            };
          t = l.createElement(r);
          t.async = 1;
          t.src = 'https://www.clarity.ms/tag/' + i;
          y = l.getElementsByTagName(r)[0];
          y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', 'gnd8zcipot');
        `
      }
    ]
  });
}

const currentRoute = useRoute();
const transitionName = ref('fade');

watch(currentRoute, async (val, oldVal) => {
  const toDepth = val.path.split('/').length;
  const fromDepth = oldVal.path.split('/').length;
  transitionName.value = toDepth < fromDepth ? 'slide-up' : 'slide-down';
});
</script>

<template>
  <ConfirmDialog />
  <Toast position="top-right" />
  <CommonToast />
  <!-- <router-view v-slot="{ Component, route }">
    <transition :name="transitionName" :appear="true" mode="out-in">
      <component :is="Component" :key="route" />
    </transition>
  </router-view> -->
  <router-view />
</template>

<style lang="scss"></style>
