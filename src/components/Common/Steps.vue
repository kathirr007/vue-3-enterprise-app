<script setup lang="ts">
import type { Step } from '@/types/common.type';

const props = defineProps<{
  id: string;
  readonly: boolean;
  items: Step[];
  current: string;
}>();
const emit = defineEmits<{
  (e: 'step', value: string): void;
}>();
const containerClass = computed(() => [
  'p-steps p-component',
  { 'p-readonly': props.readonly }
]);
</script>

<template>
  <nav :id="id" :class="containerClass">
    <ol class="p-steps-list">
      <template v-for="(item, index) of items" :key="index">
        <li class="p-steps-item">
          <template v-if="!$slots.item">
            <div>
              <span
                class="p-menuitem-link"
                :class="{ 'cursor-pointer': !readonly }"
                @click="if (!readonly) emit('step', item.name);"
              >
                <span
                  class="p-steps-number"
                  :class="current === item.name ? 'bg-primary' : ''"
                >{{ index + 1 }}</span>
                <span
                  class="p-steps-title"
                  :class="
                    current === item.name ? 'text-primary font-medium' : ''
                  "
                >{{ item.label }}</span>
              </span>
            </div>
          </template>
          <component :is="$slots.item" v-else :item="item" />
        </li>
      </template>
    </ol>
  </nav>
</template>

<style lang="scss" scoped>
.p-steps {
  position: relative;
}

.p-steps .p-steps-list {
  padding: 0;
  margin: 0;
  list-style-type: none;
  display: flex;
}

.p-steps-item {
  position: relative;
  display: flex;
  justify-content: center;
  flex: 1 1 auto;
  &:first-child::before {
    width: 50%;
    left: 50%;
  }
  &:last-child::before {
    width: 50%;
  }
}

.p-steps-item .p-menuitem-link {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  text-decoration: none;
  background-color: transparent !important;
}

.p-steps.p-steps-readonly .p-steps-item {
  cursor: auto;
}

.p-steps-item.p-steps-current .p-menuitem-link {
  cursor: default;
}

.p-steps-title {
  white-space: nowrap;
}

.p-steps-number {
  display: flex;
  align-items: center;
  justify-content: center;
}

.p-steps-title {
  display: block;
}
</style>
