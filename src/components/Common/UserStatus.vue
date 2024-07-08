<script setup lang="ts">
import type { User } from '@/types/teams.type';

const props = defineProps<{
  user: User;
}>();

function userStatus() {
  if (props.user.isActive && props.user.isVerified) {
    return { statusClass: 'bg-green-500', statusText: 'Verified' };
  }
  else if (props.user.isActive && !props.user.isVerified) {
    return { statusClass: 'bg-orange-500', statusText: 'Not Verified' };
  }
  else {
    return { statusClass: 'bg-red-500', statusText: 'Disabled' };
  }
}
</script>

<template>
  <div
    v-tooltip.bottom="userStatus().statusText"
    v-tooltip.bottom.focus="userStatus().statusText"
    :class="userStatus().statusClass"
    class="border-round user-status-color cursor-pointer"
    tabindex="0"
  />
</template>

<style lang="scss">
.user-status-color {
  position: absolute;
  height: 0.8rem !important;
  width: 0.8rem !important;
  bottom: -2px !important;
  right: 4px !important;
}
</style>
