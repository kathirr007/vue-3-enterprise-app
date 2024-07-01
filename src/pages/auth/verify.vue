<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';
import { useQuery } from 'vue-query';

const isSignUpComplete = useRouteQuery('success');
const { appData } = useAppData();

const { initToast } = useToasts();
const { getAttachmentUrl } = useAttachments();
const key = useRouteQuery('key');
const router = useRouter();
function handleExpiredVerification() {
  initToast({
    severity: 'info',
    actionType: 'Update',
    summary: 'User Verification',
    detail:
      'Verification link got expired. Please try signin with registered email.'
  });
  router.push({ name: 'auth-signin' });
}
const { verifyUserDetails } = useAuthVerify();
const { data: verifyUserData } = useQuery(
  'verify-user-details',
  () => {
    return verifyUserDetails(key.value as string);
  }
);
</script>

<template>
  <div class="surface-section w-full md:w-6 p-4 md:p-6 text-center">
    <div class="flex flex-column justify-content-center min-h-full">
      <div class="max-w-26rem mx-auto w-full">
        <img
          v-if="
            (verifyUserData?.org || verifyUserData?.userClients[0].client.org)
              ?.logo?.path
          "
          :src="
            getAttachmentUrl(
              (verifyUserData?.org || verifyUserData?.userClients[0].client.org)
                ?.logo?.path as string,
              true,
            )
          "
          alt="orgLogo"
          height="70"
          class="mb-3"
        >
        <a
          v-else
          href="https://www.brightreturn.com/"
          target="_blank"
          title="App Return"
        >
          <img
            :src="appData.logoExtended"
            alt="appData.logoAltText"
            height="70"
            class="mb-3"
          >
        </a>
      </div>

      <div v-if="!isSignUpComplete" class="w-full max-w-26rem mx-auto">
        <h1 class="text-2xl font-medium text-900 mb-5">
          Verify account
        </h1>
        <AuthVerifyForm
          v-if="verifyUserData"
          :verify-user-data="verifyUserData"
        />
      </div>
      <div v-if="false" class="w-full max-w-26rem mx-auto">
        <a href="#" class="font-medium mt-3 flex align-items-center"><i
                                                                       class="pi pi-youtube p-button-icon p-button-icon-left text-3xl text-primary mr-1 mt-1"
                                                                     />
          <span>Help</span></a>
      </div>
      <AuthMobileAppDownload />
    </div>
  </div>
  <div
    class="hidden md:block w-6 bg-no-repeat verification-info info-graphics"
  />
</template>

<route lang="yaml">
meta:
  layout: auth
  ignoreAuth: true
</route>
