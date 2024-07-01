<script setup lang="ts">
import { useQuery } from 'vue-query';

const route = useRoute();
const { getOneFeedback } = useFeedback();

const feedbackId = ref(route.params.id as string);
const isFormSubmitted = ref(false);

const {
  data: feedbackDetails,
  isFetching: loadingFeedback,
  isError
} = useQuery(['feedback-details', feedbackId], () => {
  return getOneFeedback(feedbackId.value as string);
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <CommonLoading v-if="loadingFeedback" />
  <template v-else>
    <div class="flex flex-column md:flex-row mb-4 align-items-center">
      <div class="w-full mb-2 md:mb-0">
        <div class="flex align-items-center">
          <div class="ml-2 space-y-0.5 flex-1">
            <div>
              <h1 class="text-3xl text-primary mb-0 text-center">
                {{ feedbackDetails?.title }}
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Common404
      v-if="isError || !feedbackDetails"
      :hide-navigations="true"
      title="Feedback not found."
    />
    <div
      v-else
      class="card webform-card w-8 lg:w-7 mx-auto"
    >
      <transition name="slide-down" mode="out-in">
        <div v-if="isFormSubmitted" class="text-center">
          <h3 class="text-900 text-primary mb-3">
            Feedback submitted successfully.
          </h3>
          <div class="text-700 text-xl mb-5">
            Thank you for sharing the valuable information.
          </div>
        </div>
        <template v-else>
          <p v-if="feedbackDetails.status === 'COMPLETED'" class="font-medium text-center text-xl">
            Feedback is already submitted.
          </p>
          <ClientFeedbackSubmitForm v-else :feedback="feedbackDetails" @success="isFormSubmitted = true" />
        </template>
      </transition>
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
