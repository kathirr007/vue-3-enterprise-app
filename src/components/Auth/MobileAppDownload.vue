<script setup lang="ts">
const isMobileApp = isNativePlatform;
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>
<template>
  <div v-if="!isMobileApp" class="w-full max-w-26rem mx-auto mt-6 md:text-left">
    <div class="mobile-apps">
      <p class="mb-2">For the optimal mobile experience — get the app</p>
      <ul
        class="flex mt-0 justify-content-center md:justify-content-start space-x-2.5 p-0"
      >
        <li class="inline-flex">
          <a
            class="btn btn_link"
            href="https://play.google.com/store/apps/details?id=com.mudrantar.brightreturn"
            target="_blank"
            rel="nofollow noopener"
            ><span class="btn__text"
              ><img
                height="42"
                src="/images/android-app.svg"
                alt="google-play-link"
                class="" /></span
          ></a>
        </li>
        <li class="" v-if="false">
          <a
            class="btn btn_link"
            href="https://play.google.com/store/apps/details?id=com.mudrantar.brightreturn"
            target="_blank"
            rel="nofollow noopener"
            ><span class="btn__text"
              ><img
                height="42"
                src="/images/ios-app.svg"
                alt="app-store-link"
                class="" /></span
          ></a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
