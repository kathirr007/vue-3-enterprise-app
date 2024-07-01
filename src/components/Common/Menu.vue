<script setup lang="ts">
import type { MenuItem } from 'primevue/menuitem';

const props = defineProps<{
  items: MenuItem[];
}>();

const menuItems = computed(() => props.items);

const menu = ref();

const toggle = (event: Event) => {
  menu.value.toggle(event);
};
</script>
<script lang="ts">
export default defineComponent({
  inheritAttrs: false,
});
</script>

<template>
  <Button
    type="button"
    label="Toggle"
    @click="toggle"
    aria-haspopup="true"
    aria-controls="overlay_menu"
  />
  <Menu
    v-if="menuItems?.length"
    id="overlay_menu"
    ref="menu"
    :items="menuItems"
    :popup="true"
  />
</template>

<style lang="scss" scoped></style>
