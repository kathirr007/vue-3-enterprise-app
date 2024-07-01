<script setup lang="ts">
import StarRating from 'vue-star-rating';

const props = defineProps<{
  averageReview: number;
  totalReviews: number;
}>();

const { formatNumberWithUnit } = useUtilityFns();
const { ratingOptions } = useFeedback();
const { isDarkTheme } = useMenuControl();
const { isLarge } = useCommonBreakPoints();

const { averageReview: averageReviewProp } = toRefs(props);

function getStarPassthroughOptions(reviewPoint: number) {
  return {
    root: {
      class: 'flex gap-1'
    },
    onIcon: {
      class: 'ml-0 text-green-500 w-2rem h-2rem'
    },
    offIcon: {
      class: 'ml-0  w-2rem h-2rem'
    }
  };
}
</script>

<template>
  <div class="inline-flex text-primary justify-content-start align-items-center gap-1">
    <span class="font-medium text-primary text-lg" :class="{ 'text-white': isDarkTheme && isLarge }">{{ Number(averageReviewProp).toPrecision(2) }}</span>
    <StarRating class="align-items-center justify-content-center" :rating="averageReview" v-bind="{ ...ratingOptions, starSize: 20 }" />
    <p class="font-medium text-primary text-lg" :class="{ 'text-white': isDarkTheme && isLarge }">
      {{ formatNumberWithUnit(totalReviews) }} client review(s)
    </p>
  </div>
</template>

<style lang="scss" scoped>

</style>
