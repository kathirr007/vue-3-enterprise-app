<script setup lang="ts">
import { isLoggedIn } from '@/router';

const props = withDefaults(
  defineProps<{
    title?: string;
    hideNavigations?: boolean;
  }>(),
  {
    hideNavigations: false
  }
);

const loggedIn = computed(() => isLoggedIn);

const backgroundStyle = {
  background: `radial-gradient(50% 109137.91% at 50% 50%, rgba(233, 30, 99, 0.1) 0%, rgba(254, 244, 247, 0) 100%)`
};
</script>

<template>
  <div
    class="surface-section px-4 py-8 md:px-6 lg:px-8 w-full not-found-background"
    :style="backgroundStyle"
  >
    <div class="text-center">
      <span class="font-bold text-2xl text-pink-500 px-3">404</span>
    </div>
    <div class="mt-6 mb-5 font-bold text-6xl text-900 text-center">
      {{ title || 'Page Not Found' }}
    </div>
    <p class="text-700 text-3xl text-primary mt-0 mb-6 text-center">
      Sorry, we couldn't find the page.
    </p>
    <div v-if="!hideNavigations" class="text-center">
      <Button
        class="p-button-text mr-2"
        label="Go Back"
        icon="pi pi-chevron-left"
        @click="$router.go(-1)"
      />
      <Button
        :label="loggedIn ? 'Go to Home' : 'Go to Sign in'"
        icon="pi pi-lock"
        @click="$router.push({ name: 'auth-signin' })"
      />
    </div>
  </div>
</template>
