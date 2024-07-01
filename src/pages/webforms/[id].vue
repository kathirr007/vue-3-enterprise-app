<script setup lang="ts">
import { useQuery } from 'vue-query';

const route = useRoute();
const { getOne } = useWebforms();

const webformId = ref(route.params.id as string);

const {
  data: webformDetails,
  isLoading: loadingWebform,
  isError,
} = useQuery(['client-webform-details', webformId], () => {
  return getOne(webformId.value as string);
});
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <CommonLoading v-if="loadingWebform" />
  <template v-else>
    <div class="flex flex-column md:flex-row mb-4 align-items-center">
      <div class="w-full mb-2 md:mb-0">
        <div class="flex align-items-center">
          <div class="ml-2 space-y-0.5 flex-1">
            <div>
              <h1 class="text-3xl text-primary mb-0 text-center">
                {{ webformDetails?.name }}
              </h1>
              <div class="card mt-3" v-if="webformDetails?.instructions">
                <h3 class="text-xl text-primary">Instructions</h3>
                <div v-html="webformDetails?.instructions" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Common404
      v-if="isError || !webformDetails"
      :hideNavigations="true"
      :title="'Form not found.'"
    />
    <div
      v-else
      class="card webform-card justify-content-center flex align-items-center"
    >
      <CommonVueFormWrapper
        class="w-full"
        :webform="webformDetails"
        is-for-client
        hide-secondary-button
        hide-title
        is-submit-form
      />
    </div>
  </template>
</template>

<style lang="scss" scoped></style>

<route lang="yaml">
meta:
  layout: webform
  ignoreAuth: true
  isPublic: true
</route>
