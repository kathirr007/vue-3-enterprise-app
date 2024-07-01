<script setup lang="ts">
import type { Attachment } from '@/types/attachment.type';
import type { FullNameObj } from '@/types/teams.type';
import { useMutation, useQuery } from 'vue-query';
import router, { isLoggedIn } from '@/router';

const { isPortalUser, updateUserToken, currentUser } = useCurrentUserData();
const { fullName, initials } = useVueFilters();
const { getAttachmentUrl } = useAttachments();

const topUserMenu = ref(null);
const appMenuControls = allMenuControls;
const loggedIn = computed(() => isLoggedIn);

const { data: loggedInUser } = useQuery('logged-in-user', async () => {
  return currentUser.value;
});

const { mutateAsync: logOut } = useMutation(() => useAuthSignOut(), {
  onSuccess: () => {
    resetCurrentUser();
    router.go(0);
  }
});

async function handleLogout() {
  await logOut();
}

onClickOutside(topUserMenu, () => {
  appMenuControls.hideTopDropDownMenus();
});
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-wrapper">
      <div class="layout-topbar-right relative">
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

          <li
            ref="profile"
            class="topbar-item user-profile"
            :class="{
              'active-topmenuitem fadeInDown':
                appMenuControls.topUserMenuActive.value,
            }"
          >
            <a @click.stop.prevent="appMenuControls.toggleTopUserMenu()">
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
            </a>
            <ul ref="topUserMenu" class="fadeInDown">
              <li v-if="loggedIn" tabindex="0" @click="handleLogout">
                <span class="text-sm cursor-pointer font-medium">Logout</span>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
