<script setup lang="ts">
import { useBreadcrumbs } from '@/composables/app';
import type { MenuItem } from 'primevue/menuitem';

const breadcrumbItems = useBreadcrumbsItems();

const route = useRoute();
const { breadcrumb, updateBreadcrumb } = useBreadcrumbs();
const home = { icon: 'pi pi-home', to: '/' };

const currentRoute = useRoute();
const appMenuControls = allMenuControls;

function updateSidebarMenu(e: Event, item: MenuItem) {
  const value = { originalEvent: e, item: toRaw(item) };
  appMenuControls.onMenuItemClick(value);
  appMenuControls.onMenuClick(e);
}

onMounted(() => {
  updateBreadcrumb({ breadcrumbs: breadcrumbItems[route.name as string] });
});

watch(currentRoute, () => {
  updateBreadcrumb({ breadcrumbs: breadcrumbItems[route.name as string] });
});
</script>

<template>
  <Breadcrumb
    :home="home"
    :model="breadcrumb"
    class="border-noround text-primary"
  >
    <template #item="{ item }">
      <RouterLink
        v-if="item.to"
        :to="item.to"
        class="text-primary font-medium mr-1 hover:text-600"
        @click="updateSidebarMenu($event, item)"
      >
        <i v-if="item.icon" :class="item.icon" />
        {{ item.label }}
      </RouterLink>
      <span v-else :class="item.class">
        <i
          v-if="item.icon"
          class="mr-1 text-primary font-normal"
          :class="item.icon"
        />
        {{ item.label }}</span>
    </template>
  </Breadcrumb>
</template>

<style scoped lang="scss">
.pi-home-icon {
  width: 20px;
  height: 20px;

  &::before {
    background-color: #808080;
  }
}

:deep(.p-menuitem) {
  .breadcrumb-ellipse {
    &.knowledge-base {
      display: inline-block;
      width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        width: auto;
        overflow: visible;
        white-space: inherit;
      }
    }
  }
}
</style>
