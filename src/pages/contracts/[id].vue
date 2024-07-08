<script setup lang="ts">
import { useQuery } from 'vue-query';

const route = useRoute();
const { fullName, initials } = useVueFilters();
const { getAttachmentUrl } = useAttachments();
const { getContractDetails } = useEngagementLetter();

const contractId = ref(route.params.id as string);

const { data: contractDetails, isError } = useQuery(
  ['contract-form-details', contractId.value],
  () => getContractDetails(contractId.value as string)
);
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div class="flex flex-column md:flex-row mb-4 align-items-center">
    <div class="w-full md:w-7 mb-2 md:mb-0">
      <div class="flex align-items-center">
        <Avatar class="mr-2 p-avatar-xxl relative" size="large" shape="circle">
          <img
            v-if="true"
            class="text-sm"
            :src="`${getAttachmentUrl(
              contractDetails?.org.logo.path as string,
            )}`"
            style="vertical-align: middle"
            alt="CPA - Logo"
          >
          <template v-else>
            {{ initials(`${contractDetails?.org.name}`) }}
          </template>
        </Avatar>

        <div class="ml-2 space-y-0.5 flex-1">
          <div>
            <h1 class="text-3xl text-primary mb-0">
              {{ contractDetails?.org.name }}
            </h1>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="card webform-card justify-content-center flex align-items-center">
    <!-- <h3 v-if="isError">Contract form not found.</h3> -->
    <Common404
      v-if="isError"
      :hide-navigations="true"
      title="Contract form not found."
    />
    <iframe
      v-else
      id="inlineFrameExample"
      title="Inline Frame Example"
      class="w-full h-full border-none"
      :src="`${contractDetails?.link}`"
    >
      <!-- :src="`${contractDetails?.link.replace(':9001', ':3020')}`" -->
    </iframe>
  </div>
</template>

<style lang="scss" scoped>
.webform-card {
  height: calc(100vh - 280px);
}
</style>

<route lang="yaml">
meta:
  layout: webform
  ignoreAuth: true
  isPublic: true
</route>
