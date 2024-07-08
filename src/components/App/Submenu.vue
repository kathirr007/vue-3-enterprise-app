<script lang="ts" setup>
import type { MenuItem } from 'primevue/menuitem';

const props = defineProps<{
  items: MenuItem[];
  root?: boolean;
  parentMenuItemActive?: boolean;
  layoutMode?: string;
  menuActive?: boolean;
  mobileMenuActive?: boolean;
}>();

const emits = defineEmits<{
  (e: 'root-menuitem-click', value: { originalEvent: Event }): void;
  (e: 'menuitem-click', value: { originalEvent: Event; item: MenuItem }): void;
}>();

const route = useRoute();
const activeIndex = ref<number | null>(null);
const appMenuControls = allMenuControls;

function onMenuItemClick(event: Event, item: MenuItem, index: number) {
  if (item.disabled) {
    event.preventDefault();
    return;
  }
  // execute command
  if (item.command) {
    item.command({ originalEvent: event, item });
    event.preventDefault();
  }
  if (item.items) {
    event.preventDefault();
  }
  if (props.root) {
    emits('root-menuitem-click', {
      originalEvent: event
    });
  }
  if (item.items) {
    activeIndex.value = index === activeIndex.value ? null : index;
  }
  else {
    activeIndex.value = index;
  }
  emits('menuitem-click', {
    originalEvent: event,
    item
  });
}
function onMenuItemMouseEnter(index: number) {
  if (props.root && props.menuActive && !isMobile()) {
    activeIndex.value = index;
  }
}
function visible(item: MenuItem) {
  return typeof item.visible === 'function'
    ? item.visible()
    : item.visible !== false;
}
watchEffect(() => {
  if (route.name === 'index') {
    activeIndex.value = 0;
  }
});
</script>

<template>
  <ul v-if="items" class="menu-ist" role="menu">
    <template v-for="(item, i) of items">
      <li
        v-if="visible(item) && !item.separator"
        :key="(item.label as string) || i"
        :class="[
          {
            'layout-root-menuitem': root,
            'active-menuitem': activeIndex === i && !item.disabled,
          },
        ]"
        role="menuitem"
      >
        <router-link
          v-if="item.to"
          v-ripple
          :to="item.to"
          :style="item.style" class="p-ripple"
          :class="[item.class, { 'p-disabled': item.disabled }]"
          active-class="active-route"
          :target="item.target"
          exact
          @mouseenter="onMenuItemMouseEnter(i)"
          @click="onMenuItemClick($event, item, i)"
        >
          <div>
            <span
              v-if="
                item.badge
                  && !(
                    appMenuControls.sidebarActive.value
                    || appMenuControls.sidebarStatic.value
                  )
              "
              class="inline-block text-orange-400 font-medium ml-2"
            >{{ item.badge }}</span>
            <Icon
              v-if="item.iconify"
              class="flex-none"
              :icon="item.icon"
              :class="item.iconClass"
            />
            <i v-else class="layout-menuitem-icon" :class="[item.icon]" />
          </div>
          <span class="layout-menuitem-text">{{ item.label }}</span>
          <i
            v-if="item.items"
            class="pi pi-fw pi-chevron-down layout-submenu-toggler"
          />
          <Tag
            v-if="item.badge"
            class="py-0 text-white beta-tag"
            rounded
            :value="item.badge"
          />
        </router-link>
        <a
          v-if="!item.to"
          v-ripple
          :href="item.url || '#'"
          :style="item.style" class="p-ripple"
          :class="[item.class, { 'p-disabled': item.disabled }]"
          :target="item.target"
          @click="onMenuItemClick($event, item, i)"
          @mouseenter="onMenuItemMouseEnter(i)"
        >
          <Icon
            v-if="item.iconify"
            class="flex-none"
            :icon="item.icon"
            :class="item.iconClass"
          />
          <i v-else class="layout-menuitem-icon" :class="[item.icon]" />
          <span class="layout-menuitem-text">{{ item.label }}</span>
          <i
            v-if="item.items"
            class="pi pi-fw pi-chevron-down layout-submenu-toggler"
          />
          <Badge
            v-if="item.badge"
            :value="item.badge"
            style="height: 100%"
          />
        </a>
        <div class="layout-menu-tooltip">
          <div class="layout-menu-tooltip-arrow" />
          <div class="layout-menu-tooltip-text">
            {{ item.label }}
          </div>
        </div>
        <transition name="layout-menu">
          <Submenu
            v-show="activeIndex === i"
            v-if="item.items && item.items.length > 0"
            :items="visible(item) ? item.items : []"
            :menu-active="menuActive"
            :parent-menu-item-active="activeIndex === i"
            @menuitem-click="$emit('menuitem-click', $event)"
          />
        </transition>
      </li>
    </template>
  </ul>
</template>
