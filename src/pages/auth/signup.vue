<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const router = useRouter();
const route = useRoute();
const email = useRouteQuery<string>('email');
const isSignUpComplete = computed(() => !!route.query.success);

const { appData } = useAppData();

function handleLogin() {
  router.replace({ name: 'auth-signup', query: { success: 'yes' } });
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
      <div class="w-full max-w-26rem mx-auto" v-if="!isSignUpComplete">
        <h1 class="text-xl font-medium text-900 mb-5">
          Sign up for a new account
        </h1>
        <AuthSignUpForm :email="email" @success="handleLogin"></AuthSignUpForm>
      </div>
      <div class="w-full max-w-26rem mx-auto" v-else>
        <h1 class="text-xl font-medium text-900 mb-5">Sign up success</h1>
        <p>Your signup is completed, please verify your email to login.</p>
        <p>
          We have sent verification link on your registered email, please follow
          the link to verify and login.
        </p>
        <div class="font-medium text-center mt-4">
          <a
            class="text-base mt-2 cursor-pointer"
            :to="{ name: 'auth-signin' }"
            @click.prevent="router.push({ name: 'auth-signin' })"
          >
            Sign in as different user
          </a>
        </div>
      </div>
      <div v-if="false" class="w-full max-w-26rem mx-auto">
        <a href="#" class="font-medium mt-3 flex align-items-center"
          ><i
            class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
          />
          <span>Help</span></a
        >
      </div>
      <AuthMobileAppDownload />
    </div>
  </div>
  <div
    class="hidden md:block w-6 bg-no-repeat info-graphics login-signup"
  ></div>
</template>

<route lang="yaml">
meta:
  layout: auth
  ignoreAuth: true
</route>
