<!-- eslint-disable @typescript-eslint/no-unused-vars -->
<script setup lang="ts">
import { useMutation, useQuery } from 'vue-query';
import { useRouter } from 'vue-router';
import { isLoggedIn } from '@/router';
import type { FullNameObj } from '@/types/teams.type';
import type { Attachment } from '@/types/attachment.type';
import type { MenuItem } from 'primevue/menuitem';

const emits = defineEmits<{
  (e: 'menu-click', value: Event): void;
  (e: 'menuitem-click', value: Event): void;
  (e: 'root-menuitem-click', value: Event): void;
  (e: 'menu-button-click', value: Event): void;
  (e: 'toggle-menu', value: Event): void;
  (e: 'right-menubutton-click', value: Event): void;
  (e: 'sidebar-mouse-over'): void;
  (e: 'sidebar-mouse-leave'): void;
  (e: 'topbar-search-toggle', value: Event): void;
  (e: 'topbar-search-click', value: Event): void;
  (e: 'topbar-search-hide', value: Event): void;
  (e: 'topbar-usermenu-click', value: Event): void;
  (e: 'update:searchClick', value: Event): void;
  (e: 'logout'): void;
}>();

const appMenuControls = allMenuControls;
const closeDialog = ref(false);
const subscribeDialog = ref(false);
const supportDialog = ref(false);
const desktopInput = ref<HTMLInputElement>();
const phoneInput = ref<HTMLInputElement>();
const topTimerMenu = ref(null);
const forceUpdateKey = ref(1);
const updatingMenus = ref(false);

const { $eventBus } = useMittEventBus();
const isDark = useDark();
const {
  defaultBreakpoints,
  $screens,
  isMedium,
  isLarge,
  isExtraSmall,
  styles
} = useCommonBreakPoints();
const { appData } = useAppData();
const { fullName, initials } = useVueFilters();
const router = useRouter();
const { focused: desktopInputFocused } = useFocus(desktopInput);
const { focused: phoneInputFocused } = useFocus(phoneInput);
const { getTimersList } = useCommonListQueries();
const { getAttachmentUrl } = useAttachments();
const { isPortalUser, currentUser, updateUserToken } = useCurrentUserData();
const {
  canAccessAllMenu,
  isFeatureIntegrated,
  allOrgIntegrationIds,
  featureSubscribed
} = usePermissions(true);
const { getRating } = useOrgOnboarding();

const isGetTimersList = computed(() => !isPortalUser.value);

const { isLoading: loadingTimerList, data: timerListData } = useQuery(
  ['timers-list'],
  async () => {
    if (!isGetTimersList.value)
      return;
    const data = await useTimer().timerList({});
    return data;
  }
);

const { isLoading: loadingRating, isFetching: fetchingRating, data: ratingData } = useQuery(
  ['rating-mobile'],
  () => getRating()
);

const isTimerActive = computed(() => timerListData.value?.isActiveTimer);
const loggedIn = computed(() => isLoggedIn);

const { data: loggedInUser } = useQuery('logged-in-user', async () => {
  return useUserDetails(currentUser.value?.id, isPortalUser.value);
});

onClickOutside(topTimerMenu, () => {
  appMenuControls.hideTopDropDownMenus();
});

function onMenuClick(event: Event) {
  emits('menu-click', event);
}
function onMenuItemClick(value: { originalEvent: Event; item: MenuItem }) {
  appMenuControls.onMenuItemClick(value);
}
function onRootMenuItemClick(event: Event) {
  appMenuControls.toggleMenuActive();
}

function onToggleMenu(event: Event) {
  // emits('toggle-menu', event);
  appMenuControls.toggleMenuClick(true);
  appMenuControls.toggleSidebarStatic();
  appMenuControls.toggleSidebar();
}
function onInputKeydown(event: KeyboardEvent) {
  const key = event.key;
  if (key === 'ESC' || key === 'TAB' || key === 'ENTER') {
    emits('topbar-search-hide', event);
  }
}

const { mutateAsync: logOut } = useMutation(() => useAuthSignOut(), {
  onSuccess: () => {
    resetCurrentUser();
    router.go(0);
  }
});

async function logOutUser() {
  await logOut();
}
function start() {
  if (featureSubscribed('work', 'timer') === false) {
    subscribeDialog.value = true;
    return;
  }
  closeDialog.value = true;
}

watchEffect(() => {
  if (appMenuControls.topbarSearchActive.value) {
    if (window.innerWidth >= 576) {
      desktopInputFocused.value = true;
    }
    else {
      nextTick(() => {
        phoneInputFocused.value = true;
      });
    }
  }
});

onMounted(async () => {
  $eventBus.on('added-new-integration', () => {
    updatingMenus.value = true;
    nextTick(() => {
      forceUpdateKey.value++;
      useTimeoutFn(() => {
        updatingMenus.value = false;
      }, 400);
    });
  });
});

onBeforeMount(() => {
  $eventBus.off('added-new-integration');
});
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-wrapper">
      <!-- Start Mobile Top Bar -->
      <div class="layout-topbar-left">
        <a
          tabindex="0"
          class="menu-button cursor-pointer"
          @click.prevent="appMenuControls.onMenuButtonClick"
        >
          <i class="pi pi-bars" />
        </a>
        <router-link id="logo-link" class="layout-topbar-logo" to="/">
          <img :src="appData.logo" alt="freya-layout">
        </router-link>
      </div>
      <!-- End Mobile Top Bar -->
      <AppMenu
        :key="forceUpdateKey"
        :loading-menus="updatingMenus"
        @click="appMenuControls.hideTopDropDownMenus"
        @menuitem-click="onMenuItemClick"
        @root-menuitem-click="(() => onRootMenuItemClick)()"
        @menu-click="appMenuControls.onMenuClick"
      />

      <div class="layout-topbar-right relative">
        <a
          v-if="isLarge"
          class="sidebar-pin absolute cursor-pointer"
          @click.prevent="onToggleMenu"
        >
          <span
            class="pi text-3xl"
            :class="
              appMenuControls.sidebarStatic.value
                ? 'pi-align-right'
                : 'pi-align-left'
            "
          />
        </a>
        <template v-if="isLarge">
          <CommonLoading v-if="loadingRating || fetchingRating" width="40px" />
          <CommonReviewOverviewCard v-else :average-review="(ratingData?.feedbackRating as number)" :total-reviews="(ratingData?.feedbackCount as number)" class="absolute mb-0 rating-topbar" />
        </template>
        <ul class="layout-topbar-actions">
          <li class="topbar-item">
            <a
              class="cursor-pointer"
              @click.stop.prevent="appMenuControls.toggleDarkTheme()"
            >
              <i
                v-if="appMenuControls.isDarkTheme.value"
                class="pi pi-sun topbar-icon text-xl"
              />
              <i v-else class="pi pi-moon topbar-icon text-xl" />
            </a>
          </li>
          <li v-if="!isPortalUser" class="topbar-item top-notifications">
            <a aria-label="notifications" class="">
              <CommonBellNotifications />
            </a>
          </li>
          <li
            v-if="
              isFeatureIntegrated(['work'], allOrgIntegrationIds)
                && !isPortalUser
            "
            ref="profile"
            class="topbar-item top-timer"
            :class="{
              'active-topmenuitem fadeInDown':
                appMenuControls.topTimerMenuActive.value,
            }"
          >
            <template v-if="isTimerActive && isMedium">
              <CommonTimer :timer-data="timerListData?.activeTimer" units />
            </template>
            <a
              v-if="isTimerActive && !isMedium"
              @click.prevent="appMenuControls.toggleTopTimerMenu"
            >
              <!-- <Icon
                class="transition-all text-2xl w-2rem cursor-pointer text-green-500"
                icon="fa6-regular:circle-play"
              /> -->
              <!-- <i class="topbar-icon pi pi-clock text-xl cursor-pointer"></i> -->

              <Icon
                icon="mdi:stopwatch-stop-outline"
                class="topbar-icon text-xl text-orange-500"
                :style="{ width: '25px', height: '25px' }"
              />
            </a>
            <a v-else-if="!isTimerActive && isMedium" @click.prevent="start">
              <!-- <li
                @click="start"
                v-if="!isTimerActive"
                v-tooltip.bottom="'Start Timer'"
              >
                <i
                  class="pi pi-custom pi-stopwatch  cursor-pointer w-1.5rem h-1.5rem"
                />
              </li>
              <li v-if="!isMedium && isTimerActive">
                <CommonTimer
                  :timerData="timerListData?.activeTimer"
                  units
                  class="ml-2"
                />
              </li> -->
              <i class="topbar-icon pi pi-clock text-xl cursor-pointer" />
              <!-- <Icon icon="mdi:stopwatch-play-outline" class="text-2xl" /> -->
            </a>
            <a
              v-else-if="!isTimerActive && !isMedium"
              @click.prevent="appMenuControls.toggleTopTimerMenu()"
            >
              <!-- <li
                @click="start"
                v-if="!isTimerActive"
                v-tooltip.bottom="'Start Timer'"
              >
                <i
                  class="pi pi-custom pi-stopwatch  cursor-pointer w-1.5rem h-1.5rem"
                />
              </li>
              <li v-if="!isMedium && isTimerActive">
                <CommonTimer
                  :timerData="timerListData?.activeTimer"
                  units
                  class="ml-2"
                />
              </li> -->
              <i class="topbar-icon pi pi-clock text-xl cursor-pointer" />
              <!-- <Icon icon="mdi:stopwatch-play-outline" class="text-2xl" /> -->
            </a>
            <ul ref="topTimerMenu" class="fadeInDown">
              <li v-if="!isTimerActive" @click="start">
                <Icon
                  class="transition-all text-2xl w-2rem cursor-pointer"
                  icon="fa6-regular:circle-play"
                />
                Start Timer
              </li>
              <li v-if="!isMedium && isTimerActive">
                <CommonTimer
                  :timer-data="timerListData?.activeTimer"
                  units
                  day
                />
              </li>
            </ul>
          </li>
          <!-- <li v-if="!isPortalUser" class="topbar-item">
            <a
              aria-label="need help"
              class="block mx-auto my-4 flex align-items-center cursor-pointer"
              @click="supportDialog = true"
              v-tooltip.bottom="'Need Help'"
            >
              <i class="pi topbar-icon pi-question-circle text-xl"></i>
            </a>
          </li> -->

          <li
            v-if="!isPortalUser"
            class="topbar-item"
            :class="{
              'active-topmenuitem fadeInDown':
                appMenuControls.topHelpMenuActive.value,
            }"
          >
            <a
              v-tooltip.bottom="'Need Help'"
              aria-label="need help"
              class="block mx-auto my-4 flex align-items-center cursor-pointer"
              @click.prevent="appMenuControls.toggleTopHelpMenu()"
            >
              <i class="pi topbar-icon pi-question-circle text-xl" /> <span class="sr-only hidden">need help</span>
            </a>
            <ul ref="topTimerMenu" class="fadeInDown">
              <li @click="supportDialog = true">
                <span class="text-sm font-medium cursor-pointer w-full">
                  Contact
                </span>
              </li>
              <li>
                <a
                  href="https://brightreturn.com/kb"
                  class="w-full"
                  target="_blank"
                ><span class="text-sm font-medium cursor-pointer w-full">
                  Help Center
                </span>
                </a>
              </li>
            </ul>
          </li>

          <li
            v-if="
              isFeatureIntegrated(['hrms'], allOrgIntegrationIds)
                && !isPortalUser
            "
            class="topbar-item"
          >
            <a
              aria-label="user-check-in"
              class="block mx-auto my-4 flex align-items-center cursor-pointer"
            >
              <CommonCheckInCheckOut class="topbar-icon" />
            </a>
          </li>
          <li
            ref="profile"
            class="topbar-item user-profile"
            :class="{
              'active-topmenuitem fadeInDown':
                appMenuControls.topUserMenuActive.value,
            }"
          >
            <a @click.prevent="appMenuControls.toggleTopUserMenu()">
              <Avatar
                class="mr-2 relative"
                :class="{ 'bg-primary': !loggedInUser?.picture }"
              >
                <img
                  v-if="loggedInUser?.picture"
                  class="text-sm"
                  :src="`${getAttachmentUrl(
                    (loggedInUser?.picture as Attachment)?.path,
                  )}`"
                  style="vertical-align: middle;"
                  alt="Profile picture"
                >
                <template v-else>
                  {{
                    initials(fullName(loggedInUser as FullNameObj) as string)
                  }}
                </template>
              </Avatar>
              <!-- <img
                :src="`${getAttachmentUrl((loggedInUser?.picture as Attachment)?.path)}`"
                alt="profile picture"
              /> -->
            </a>
            <ul class="fadeInDown">
              <li @click="appMenuControls.navigateTo({ path: '/myaccount' })">
                <span
                  role="link"
                  class="text-sm font-medium cursor-pointer w-full"
                >
                  Profile
                </span>
              </li>
              <li
                v-if="canAccessAllMenu && !isPortalUser"
                @click="appMenuControls.navigateTo({ path: '/settings' })"
              >
                <span
                  class="text-sm font-medium cursor-pointer w-full"
                  role="link"
                >
                  Organization
                </span>
              </li>
              <li
                v-if="isPortalUser"
                @click="router.push({ name: 'portal-accounts' })"
              >
                <span
                  class="text-sm font-medium cursor-pointer w-full"
                  role="link"
                >
                  Accounts
                </span>
              </li>
              <li v-if="loggedIn" tabindex="0" @click="logOutUser">
                <span class="text-sm cursor-pointer font-medium" role="link">Logout</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
    <!-- <CommonBreadcrumbs /> -->
  </div>
  <Dialog
    v-model:visible="closeDialog"
    :modal="true"
    append-to="body"
    header="Start Timer"
    :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
    :style="styles"
    content-class="border-round-bottom-md"
    @hide="closeDialog = false"
  >
    <TimerStart @modal-close="closeDialog = false" />
  </Dialog>
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
      <a class="font-medium underline" href="mailto:help@brightreturn.com">help@brightreturn.com</a>
      for assistance.
    </p>
  </Dialog>
  <CommonSubscribeDialog
    v-if="subscribeDialog"
    :visible="subscribeDialog"
    feature="timer"
    @hide="subscribeDialog = false"
  />
</template>
