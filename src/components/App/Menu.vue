<script lang="ts" setup>
import type { MenuItem } from 'primevue/menuitem';
import type { MenuItem as SidebarMenuItem } from '@/types/app.type';
import type { ClientAccessSetting } from '@/types/teams.type';

const props = defineProps<{
  sidebarStatic?: boolean;
  parentMenuItemActive?: boolean;
  layoutMode?: string;
  menuActive?: boolean;
  mobileMenuActive?: boolean;
  loadingMenus?: boolean;
}>();

const emits = defineEmits<{
  (e: 'root-menuitem-click', value: { originalEvent: Event }): void;
  (e: 'menuitem-click', value: { originalEvent: Event; item: MenuItem }): void;
  (e: 'menu-click', value: Event): void;
  (e: 'toggle-menu', value: Event): void;
  (e: 'sidebar-mouse-over'): void;
  (e: 'sidebar-mouse-leave'): void;
}>();

const appMenuControls = allMenuControls;

const sidebarActive = appMenuControls.sidebarActive;

const currentIntegrations = ref();
const { defaultBreakpoints, $screens, isLarge, styles }
  = useCommonBreakPoints();
const { isPortalUser, currentUser } = useCurrentUserData();
const menus = useMenuItems();
const { appData, logoImg, updateLogo } = useAppData();
const { filterObjArrByValues } = useUtilityFns();
const { getAll: getAllOrgIntegrations } = useOrgIntegrations();

const portalRouteNames = computed(() =>
  generatePortalRouteNames(currentUser.value?.client?.accessSetting as ClientAccessSetting)
);
const portalRouteNamesByIntegrations = computed(() => {
  if (portalRouteNames.value) {
    return portalRouteNames.value.filter((item: string) => {
      if (item === 'portal')
        return true;
      return isFeatureIntegrated([item], allOrgIntegrationIds.value);
    });
  }
  return [];
});
const isPortalAccess = computed(() =>
  portalRouteNames.value.includes('portal')
);

const supportDialog = ref(false);

function onToggleMenu(event: Event) {
  appMenuControls.toggleMenuClick(true);
  appMenuControls.toggleSidebarStatic();
  // emits('toggle-menu', event);
}
function onMenuClick(event: Event) {
  emits('menu-click', event);
}
function onMenuItemClick(value: { originalEvent: Event; item: MenuItem }) {
  emits('menuitem-click', value);
}
function onRootMenuItemClick(event: Event) {
  emits('root-menuitem-click', { originalEvent: event });
}

function handleSidebarMouseOver() {
  appMenuControls.toggleSidebar(!isMobile());
  updateLogo();
}

function handleSidebarMouseLeave() {
  if (!appMenuControls.sidebarStatic.value) {
    appMenuControls.toggleSidebar(false);
    updateLogo();
  }
}

const mobileMenus = ['dashboard', 'work', 'brightdesk', 'myteam', 'users_hrms'];
const portalMenus = [...mobileMenus];

const {
  permissionKeys,
  canAccessMenu,
  allOrgIntegrationIds,
  isFeatureIntegrated,
  canAccessMenuWithDependencies,
  getAllOrgIntegrationIds
} = usePermissions(true, false);

// console.log('permissionKeys', permissionKeys.value);

function filterMenusByPermission(menusItems: MenuItem[],
  permissionKeys: string[]) {
  return menusItems.filter((menu) => {
    if (permissionKeys.includes(menu.name)) {
      if (menu.items) {
        // If the menu has items, filter them recursively
        menu.items = filterMenusByPermission(menu.items, permissionKeys).filter(
          (item: MenuItem) => {
            return !item.hide && canAccessMenuWithDependencies(
              allOrgIntegrationIds?.value,
              item as SidebarMenuItem
            );
          }
        );
      }
      return true;
    }
    return false;
  });
}

const filteredMenus = computed<MenuItem[]>(() => {
  if (!isPortalUser.value) {
    permissionKeys.value.push('knowledgeBase');
    // permissionKeys.value.push('data_extraction');
  }

  if (allOrgIntegrationIds.value) {
    // console.log('permissionKeys', permissionKeys.value);
    // console.log('allmenus', menus);
    const portalMenusToExclude = ['documents'];
    const portalMenusToInclude = [];
    const clonedMenus: MenuItem[] = structuredClone(menus) as MenuItem[];
    const menusFiltered = isPortalUser.value
      ? clonedMenus.filter(menu =>
        portalRouteNamesByIntegrations.value.includes(menu.name)
      )
      : clonedMenus.filter(
        (menu: MenuItem) => !portalMenusToExclude.includes(menu.name)
      );

    /* const filteredMenusByPermissions = filterObjArrByValues(
      menusFiltered,
      permissionKeys.value,
      'items',
      'name'
    ); */

    // console.log('menusFiltered', menusFiltered);

    const filteredMenusByPermissions = filterMenusByPermission(
      menusFiltered,
      permissionKeys.value
    );

    // console.log('filteredMenusByPermissions', filteredMenusByPermissions);

    return filteredMenusByPermissions.filter((item: MenuItem) => !item.hide);
  }
  return [];
});
const filteredMenusByIntegrations = computed(() => {
  return filteredMenus.value?.filter((item: MenuItem) => {
    return canAccessMenu(allOrgIntegrationIds.value, item as SidebarMenuItem);
  });
});

const refactoredSideMenu = computed(() => {
  /* let allOrgIntegrationsIds: string[] = [];
  if (isPortalUser.value) {
    getAllOrgIntegrationIds().then((data: string[]) => {
      allOrgIntegrationsIds = data;
    });
  } else {
    allOrgIntegrationsIds = allOrgIntegrationIds.value;
  } */

  if (
    isLarge.value
    && isFeatureIntegrated(['documents'], allOrgIntegrationIds.value)
  ) {
    portalMenus.push('documents');
  }
  const clonedMenus: SidebarMenuItem[] = structuredClone(
    menus
  ) as SidebarMenuItem[];
  const clonedFilteredMenus: SidebarMenuItem[] = structuredClone(
    filteredMenusByIntegrations.value
  ) as SidebarMenuItem[];

  const mobileMenu: SidebarMenuItem[] = isPortalUser.value
    ? [...clonedMenus].filter(menu =>
        portalRouteNamesByIntegrations.value.includes(menu.name as string)
      )
    : [...clonedFilteredMenus].filter(menu =>
        mobileMenus.includes(menu.name as string)
      );

  const nestedMenuNames = [
    'work',
    'tasks',
    'support_tasks',
    'brightdesk',
    'myteam',
    'client_groups'
  ];

  let nestedMenus = mobileMenu.filter(menu =>
    nestedMenuNames.includes(menu.name as string)
  );

  const subMenusToFilter = ['users', 'users_hrms', 'tasks', 'support_tasks'];

  if (!isPortalUser.value && !isLarge.value) {
    subMenusToFilter.push('client-tasks');
  }

  if (isPortalUser.value && isLarge.value) {
    subMenusToFilter.push('mails');
  }

  nestedMenus = nestedMenus.map((menu) => {
    menu.items = menu.items?.filter(item =>
      subMenusToFilter.includes(item.name as string)
    );
    return menu.items;
  }) as unknown as SidebarMenuItem[];

  return mobileMenu.filter((item: SidebarMenuItem) => !item.hide);
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div
    class="menu-wrapper"
    :class="{
      'layout-sidebar-active': appMenuControls.sidebarActive.value,
    }"
    @mouseover.prevent="handleSidebarMouseOver"
    @mouseleave.prevent="handleSidebarMouseLeave"
    @click="onMenuClick"
  >
    <div class="sidebar-logo">
      <router-link :to="isPortalUser ? '/portal' : '/'">
        <img :src="appData.logo" :alt="appData.logoAltText">
      </router-link>
      <!-- <a class="sidebar-pin" @click.prevent="onToggleMenu">
        <span class="pi pi-align-left"></span>
      </a> -->
    </div>
    <div class="layout-menu-container">
      <!-- <CommonLoading :type="'pair-spinner'" /> -->
      <div v-if="loadingMenus" class="skeleton-loading mt-4">
        <ul class="m-0 p-0 px-2 list-none">
          <li class="mb-3">
            <div class="flex align-items-center">
              <Skeleton shape="circle" size="3rem" class="mr-2" />
              <div class="align-self-center" style="flex: 1;">
                <Skeleton width="100%" height="2rem" />
              </div>
            </div>
          </li>
          <li class="mb-3">
            <div class="flex align-items-center">
              <Skeleton shape="circle" size="3rem" class="mr-2" />
              <div class="align-self-center" style="flex: 1;">
                <Skeleton width="100%" height="2rem" />
              </div>
            </div>
          </li>
          <li class="mb-3">
            <div class="flex align-items-center">
              <Skeleton shape="circle" size="3rem" class="mr-2" />
              <div class="align-self-center" style="flex: 1;">
                <Skeleton width="100%" height="2rem" />
              </div>
            </div>
          </li>
        </ul>
      </div>
      <AppSubmenu
        v-else
        class="layout-menu"
        :items="
          isPortalUser || !isLarge
            ? (refactoredSideMenu as MenuItem[])
            : filteredMenusByIntegrations
        "
        :root="true"
        :parent-menu-item-active="true"
        @menuitem-click="onMenuItemClick"
        @root-menuitem-click="(() => onRootMenuItemClick)()"
      />
      <!-- <Button
        v-if="!isPortalUser"
        class="block mx-auto my-4 p-2 flex align-items-center"
        :class="{ 'py-2 px-4': sidebarActive || !isLarge }"
        @click="supportDialog = true"
      >
        <i
          class="pi pi-question-circle text-lg"
          :class="{ ' mr-2': sidebarActive || !isLarge }"
        ></i>
        {{ sidebarActive || !isLarge ? 'Need Help' : '' }}
      </Button> -->
    </div>
  </div>

  <Dialog
    v-model:visible="supportDialog"
    :modal="true"
    append-to="body"
    header="Need Help?"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="supportDialog = false"
  >
    <p class="text-center">
      Contact
      <a class="font-medium underline" href="mailto:help@brightreturn.com.com">help@brightreturn.com</a>
      for assistance.
    </p>
  </Dialog>
</template>
