<script setup lang="ts">
import Spinner from './Spinner.vue';
import InfiniteCircles from './InfiniteCircles.vue';
import Bar from './Bar.vue';
import PairSpinner from './PairSpinner.vue';
import Dots from './Dots.vue';

withDefaults(
  defineProps<{
    type?: 'spinner' | 'infinite-circles' | 'bar' | 'pair-spinner' | 'dots';
    dots?: number;
  }>(),
  {
    type: 'spinner'
  }
);
const loadingTypes = {
  'spinner': Spinner,
  'infinite-circles': InfiniteCircles,
  'bar': Bar,
  'pair-spinner': PairSpinner,
  'dots': Dots
};
</script>

<template>
  <div class="max-w-max mx-auto">
    &nbsp;
    <component :is="loadingTypes[type]" :dots="dots" />
    &nbsp;
  </div>
</template>
