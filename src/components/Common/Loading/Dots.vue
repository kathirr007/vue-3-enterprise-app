<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    dots: number;
  }>(),
  {
    dots: 3
  }
);
</script>

<template>
  <div id="dots" class="relative">
    <span v-for="(dot, index) in dots" :key="index" />
  </div>
</template>

<style lang="scss" scoped>
#dots {
  --dot-count: v-bind('props.dots');
  $dot-count: 10;
  $dot-size: 10px;
  $dot-spacing: 15px;
  $dot-delay-base: 0.2s;
  $dot-animation-duration: 1s;

  height: 20px;
  width: 50px;
  margin: -25px 0 -25px 0;

  @for $i from 1 through $dot-count {
    span:nth-child(#{$i}) {
      position: absolute;
      width: $dot-size;
      height: $dot-size;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 50%;
      animation: dots $dot-animation-duration infinite ease-in-out;
      left: ($i - 1) * $dot-spacing;
      animation-delay: $dot-delay-base + ($i - 1) * 0.1s;
    }
  }
}

@keyframes dots {
  0% {
    -webkit-transform: translateY(0px);
    transform: translateY(0px);
    -webkit-transform: translateY(0px);
    transform: translateY(0px);
    background: #d62d20;
  }
  25% {
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
    background: #ffa700;
  }
  50% {
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
    background: #008744;
  }
  100% {
    -webkit-transform: translateY(0px);
    transform: translateY(0px);
    -webkit-transform: translateY(0px);
    transform: translateY(0px);
    background: #0057e7;
  }
}
@-webkit-keyframes dots {
  0% {
    -webkit-transform: translateY(0px);
    transform: translateY(0px);
    background: #d62d20;
  }
  25% {
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
    background: #ffa700;
  }
  50% {
    -webkit-transform: translateY(10px);
    transform: translateY(10px);
    background: #008744;
  }
  100% {
    -webkit-transform: translateY(0px);
    transform: translateY(0px);
    background: #0057e7;
  }
}
</style>
