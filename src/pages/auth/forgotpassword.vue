<script setup lang="ts">
const { initToast } = useToasts();
const router = useRouter();
const route = useRoute();
const { appData } = useAppData();
const isProcessComplete = computed(() => !!route.query.success);

function handleSubmit() {
  initToast({
    actionType: 'Update',
    severity: 'success',
    summary: 'Reset Password',
    detail: `A link to reset your password has been sent to your registered email successfully.`,
  });
  router.replace({ name: 'auth-forgotpassword', query: { success: 'yes' } });
}
</script>

<template>
  <div class="surface-section w-full md:w-6 p-6 p-4 md:p-6 text-center">
    <div
      class="flex flex-column justify-content-center min-h-full max-w-26rem mx-auto"
    >
      <a
        href="https://www.brightreturn.com/"
        target="_blank"
        title="App Return"
      >
        <img
          :src="appData.logoExtended"
          alt="appData.logoAltText"
          height="70"
          class="mb-3"
        />
      </a>

      <div class="w-full" v-if="!isProcessComplete">
        <h1 class="text-xl font-medium text-900 mb-5">
          Request to reset your password
        </h1>
        <AuthForgotPasswordForm
          @success="handleSubmit"
        ></AuthForgotPasswordForm>
      </div>
      <div class="w-full" v-else>
        <h1 class="text-xl font-medium text-900 mb-5">Reset password</h1>
        <div class="text-left">
          <p class="font-medium text-lg">
            A password reset link was sent. Click the link in the email to
            create a new password.
          </p>
        </div>
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
