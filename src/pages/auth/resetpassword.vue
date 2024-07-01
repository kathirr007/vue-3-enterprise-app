<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const router = useRouter();
const isProcessComplete = ref(false);
const resetToken = useRouteQuery<string>('key');
const { appData } = useAppData();

const { isPasswordChangeRequired } = useCurrentUserData();

if (!resetToken.value) {
  router.replace({ name: 'auth-signin' });
}
</script>

<template>
  <div class="surface-section w-full md:w-6 p-4 md:p-6 text-center">
    <div class="flex flex-column justify-content-center min-h-full">
      <a
        href="https://www.brightreturn.com/"
        target="_blank"
        title="Bright Return"
      >
        <img
          :src="appData.logoExtended"
          alt="appData.logoAltText"
          height="70"
          class="mb-3"
        />
      </a>
      <transition name="slide-down" mode="out-in">
        <div
          class="w-full max-w-26rem mx-auto"
          v-if="!isProcessComplete && resetToken"
        >
          <h1 class="text-2xl font-medium text-900 mb-5">
            Reset your password
            <small
              v-if="isPasswordChangeRequired"
              class="text-sm font-italic text-red-500 block mt-1"
              >Your password has been expired, as you haven't changed your
              password from last 90 days. Please reset your password.</small
            >
          </h1>
          <AuthResetPasswordForm
            @success="isProcessComplete = true"
            :token="resetToken"
          ></AuthResetPasswordForm>
        </div>
        <div class="w-full max-w-26rem mx-auto" v-else>
          <h1 class="text-2xl font-medium text-900 mb-5">Reset password</h1>
          <p>Password was reset successfully.</p>
          <p>
            Now you can login
            <router-link :to="{ name: 'auth-signin' }"
              ><span class="font-bold">Here</span></router-link
            >
            using new password.
          </p>
          <div v-if="false" class="w-full max-w-26rem mx-auto">
            <a href="#" class="font-medium mt-3 flex align-items-center"
              ><i
                class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
              />
              <span>Help</span></a
            >
          </div>
        </div>
      </transition>
      <AuthMobileAppDownload />
    </div>
  </div>
  <div
    class="hidden md:block w-6 bg-no-repeat info-graphics welcome-info"
  ></div>
</template>

<route lang="yaml">
meta:
  layout: auth
  ignoreAuth: true
</route>
