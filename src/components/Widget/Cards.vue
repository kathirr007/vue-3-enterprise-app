<script setup lang="ts">
import type { Card } from '@/types/dashboard.type';

const props = defineProps<{
  cards: Card[];
  cardsInRow?: number;
  loading?: boolean;
  isCardSmall?: boolean;
  todaysTaskCount?: any;
}>();
const emit = defineEmits<{
  (e: 'cardClick', card: Card): void;
}>();

const gridColumnStyle = computed(() => {
  return `repeat(${
    props.cardsInRow || props.cards.length <= 2
      ? props.cardsInRow
      : props.cards.length > 2 && props.cards.length < 6
      ? props.cards.length
      : 6
  }, 1fr)`;
});
</script>

<template>
  <div class="grid-container">
    <div v-if="todaysTaskCount">
      <WidgetTodaysTask :todays-task-count="todaysTaskCount" />
    </div>
    <template v-for="(card, index) in cards" :key="index">
      <div
        class="card overview-box widget-radius mb-0 box-shadow"
        :class="[
          card.color,
          {
            'cursor-pointer clickable hover:shadow-5 transition-all transition-duration-400':
              card.clickable,
            'small-card': isCardSmall,
          },
        ]"
        @click="emit('cardClick', card)"
      >
        <div
          class="overview-info"
          :class="{
            'flex justify-content-between align-items-center w-full':
              isCardSmall,
          }"
        >
          <h6>{{ card.title }}</h6>

          <h1
            :class="[card.valueClass, { 'pl-2': isCardSmall }]"
            class="text-2xl"
          >
            <i v-if="props.loading" class="pi pi-spinner pi-spin" />
            <template v-else>
              {{ card.value }}
            </template>
          </h1>
        </div>
        <slot name="icon">
          <Icon
            v-if="card.iconify && card.icon"
            :icon="card.icon"
            :class="card.icon"
          />
          <i v-else :class="card.icon" />
        </slot>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.grid-container {
  display: grid;
  grid-template-columns: v-bind('gridColumnStyle');
  grid-template-columns: repeat(1, 1fr);
  grid-gap: 1rem;

  .card {
    &:last-child {
      margin-bottom: auto;
    }

    &.clickable {
      &:hover {
        h6 {
          text-decoration: underline;
        }
      }
    }

    &.small-card {
      padding: 1rem;
    }
  }

  @media screen and (min-width: $tabletBreakpoint) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (min-width: $desktopBreakpoint) {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
