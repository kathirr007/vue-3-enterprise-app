<script setup lang="ts">
import type { VerifyUserDetails } from '@/types/verify.type';

defineProps<{
  verifyUserData: VerifyUserDetails;
  isClientUser?: boolean;
}>();
</script>

<template>
  <div class="cpa-details space-y-2.5">
    <h5 class="my-0">
      {{
        isClientUser
          ? verifyUserData?.userClients[0].client.name
          : verifyUserData?.org?.name
      }}
    </h5>
    <div
      class="w-full inline-flex align-items-center space-x-2.5"
      v-if="
        isClientUser &&
        (verifyUserData?.clientCity || verifyUserData?.clientState)
      "
    >
      <Icon icon="fa6-solid:location-dot" class="text-2xl text-primary" />
      <span class="text-gray-800 text-lg flex-1 text-left">
        <span v-if="verifyUserData.clientState">
          {{ verifyUserData.clientState }},
        </span>
        <span v-if="verifyUserData.clientCity">
          {{ verifyUserData.clientCity }}
        </span>
      </span>
    </div>
    <div
      class="w-full inline-flex align-items-center space-x-2.5"
      v-else-if="verifyUserData?.orgCity || verifyUserData?.orgState"
    >
      <Icon icon="fa6-solid:location-dot" class="text-2xl text-primary" />

      <span class="text-gray-800 text-lg flex-1 text-left">
        <span v-if="verifyUserData.orgState">
          {{ verifyUserData.orgState
          }}<span v-if="verifyUserData.orgCity">,</span>
        </span>
        <span v-if="verifyUserData.orgCity">
          {{ verifyUserData.orgCity }}
        </span>
      </span>
    </div>
    <div
      class="w-full inline-flex align-items-center space-x-2.5"
      v-if="verifyUserData?.orgEmail || verifyUserData?.clientEmail"
    >
      <Icon icon="fa6-solid:envelope" class="text-2xl text-primary" />

      <span class="text-gray-800 text-lg flex-1 text-left">
        {{
          isClientUser ? verifyUserData.clientEmail : verifyUserData.orgEmail
        }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
