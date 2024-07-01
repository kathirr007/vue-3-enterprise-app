<script setup lang="ts">
import router from '@/router';
import type { EntityType } from '@/types/tasks.type';
import type { RouteLocationRaw } from 'vue-router';

type NotificationType = `${EntityType | 'PROJECT'}`;

const { currentUser } = useCurrentUserData();
const { isLarge } = useCommonBreakPoints();
const { getQueryParams, metaFilter } = useUtilityFns();
const { data: filterData, applyFilter, updateDateValue } = useFilterColumns();
const { isFeatureIntegrated, allOrgIntegrationIds } = usePermissions(true);

const appMenuControls = allMenuControls;
const isProdEnv = isProdBuild;

const bellNotification = ref();
const hideNotificationCenter = ref(true);

const bodyEl = document.querySelector('body');

function sessionLoaded() {
  // TODO: If needed
}

const closeNotification = useDebounceFn(() => {
  bellNotification.value.$el.querySelector('i')?.click();
  useTimeoutFn(() => {
    hideNotificationCenter.value = false;
  }, 300);
}, 400);

onMounted(() => {
  if (bellNotification.value) {
    bellNotification.value.$el.querySelector('i')?.click();
    closeNotification();
  }
});

function getRedirectRouteName(val: any) {
  const notificationType: NotificationType = val.payload.type;
  const redirectUrl: string = val.cta.data.url.split('?')[0];
  if (redirectUrl === 'admin-tasks' && notificationType === 'TASK')
    return 'admin-tasks-alltasks';
  if (redirectUrl === 'admin-tasks' && notificationType === 'SUPPORTTASK')
    return 'admin-support';
  return redirectUrl;
}

function onNotificationClick(val: any) {
  bellNotification.value.$el.querySelector('i')?.click();
  const detailsRouteNames = ['id', 'type'];
  const redirectRouteName = getRedirectRouteName(val);
  const detailsRouteParam = `${(redirectRouteName as string).split('-').pop()}`;
  const routeQueryParams = getQueryParams(val.cta.data.url);
  const isDetailsRoute = detailsRouteNames.includes(detailsRouteParam);
  let preparedFilters = '';
  if (val.payload.type === 'TASK' || val.payload.type === 'SUPPORTTASK') {
    /* if (val.payload.type === 'TASK') {
      applyFilter('Status', [val.payload?.statusId]);
    } */
    applyFilter('Type', [val.payload.type]);
    applyFilter('SearchText', val.payload.taskName);
    preparedFilters = useEncodeFilterData(filterData);
  }
  let redirectRoute: RouteLocationRaw = {
    name: redirectRouteName,
    query: {
      ...routeQueryParams,
      notificationId: !redirectRouteName.includes('project')
        ? val.payload.id
        : undefined,
      filters: preparedFilters
    }
  };
  const redirectFeature = routeQueryParams.feature;
  const isWorkIntegrated = isFeatureIntegrated(
    ['work'],
    allOrgIntegrationIds.value
  );
  if (redirectFeature === 'Documents' || redirectFeature === 'eSignature') {
    if (isWorkIntegrated) {
      router.push(redirectRoute);
    }
    else {
      routeQueryParams.activeIndex = routeQueryParams.activeIndex - 2;
      redirectRoute = {
        ...redirectRoute,
        ...routeQueryParams
      };
    }
  }
  if (isDetailsRoute) {
    redirectRoute = {
      ...redirectRoute,
      params: {
        [`${detailsRouteParam}`]: val.payload[`${detailsRouteParam}`]
      }
    };
  }
  if (
    (!isLarge.value && redirectRouteName.includes('project'))
    || redirectRouteName === ''
  ) {
    return false;
  }
  else {
    router.push(redirectRoute);
  }
}
function onActionClicked(val: any) {
  // TODO: If needed
}

// const isDark = useDark();

watchEffect(() => {
  if (hideNotificationCenter.value) {
    bodyEl?.classList.add('hide-notification-center');
  }
  else {
    bodyEl?.classList.remove('hide-notification-center');
  }
});
</script>

<template>
  <NotificationCenterComponent
    ref="bellNotification"
    v-slot="slot"
    :key="appMenuControls.isDarkTheme.value ? 'dark' : 'light'"
    :subscriber-id="currentUser?.id"
    :application-identifier="isProdEnv ? '7xVzaj_cEcTC' : '2wtzwBZ_zZM2'"
    :session-loaded="sessionLoaded"
    :notification-clicked="onNotificationClick"
    :action-clicked="onActionClicked"
    popover-dropdown-class="novu-dropdown-popover"
    :color-scheme="appMenuControls.isDarkTheme.value ? 'dark' : 'light'"
    :theme="appMenuControls.isDarkTheme.value ? 'dark' : 'light'"
  >
    <i
      v-badge="slot.unseenCount"
      class="topbar-icon pi pi-bell text-xl cursor-pointer"
      :class="[
        { 'no-unseen': !slot.unseenCount },
        { 'mr-3': slot.unseenCount },
      ]"
    />
  </NotificationCenterComponent>
</template>

<style lang="scss">
.top-notifications {
  .p-badge {
    top: 5px !important;
    right: 5px !important;
  }
}

.hide-notification-center {
  .v-popper__popper {
    display: none;
  }
}

.no-unseen {
  .p-badge {
    display: none;
  }
}

.v-popper--theme-light .v-popper__inner,
.v-popper--theme-dark .v-popper__inner {
  box-shadow: 0 6px 30px #0000001a !important;
}

.nc-notifications-list-item-button {
  font-family: Lato, Helvetica, sans-serif !important;
}

.css-0 {
  &.v-popper__popper--hidden {
    width: 0% !important;
    height: 0% !important;
  }

  .v-popper__arrow-container {
    display: none !important;
  }

  .nc-footer {
    display: none;
  }
}

:root {
  body > .css-0 {
    * {
      font-family: inherit;
    }

    .mantine-Switch-track {
      background: linear-gradient(217deg, #3b77dd 0%, #002668 100%);
    }

    &.v-popper--theme-dark {
      .nc-layout-wrapper {
        background-color: $primaryColor;

        .nc-header {
          color: #fff !important;

          .nc-header-mark-as-read,
          .nc-header-cog {
            color: #fff !important;
          }
        }

        .nc-notifications-list-item,
        .mantine-Accordion-item {
          background-color: $primaryLightColor;

          &::before,
          .mantine-Switch-track {
            background: linear-gradient(217deg, #3b77dd 0%, #002668 100%);
            // background: linear-gradient(0deg, $blue 0%, $primaryColor 100%);
            // background: linear-gradient(0deg, #ff512f 0%, #dd2476 100%);
          }

          .mantine-UnstyledButton-root {
            &:hover {
              background-color: $primaryLighterColor;
            }
          }

          .mantine-Menu-dropdown,
          .mantine-Menu-arrow {
            background-color: $primaryColor;
            border-color: $primaryColor;

            .mantine-Menu-item {
              &:hover {
                background-color: $primaryLighterColor;
              }
            }
          }

          .mantine-Divider-root {
            border-top-color: #fff;
          }

          .nc-preferences-item-icon,
          .nc-preferences-channel-label {
            // color: rgba(217, 217, 217, 0.5);
          }

          .nc-notifications-list-item-dots-button,
          .nc-preferences-item-channels,
          .mantine-Accordion-chevron svg,
          .nc-preferences-item-success {
            color: #fff;
          }

          .nc-bell-button-dot {
            rect {
              fill: $bodyBackgroundColor;
              stroke: $primaryColor;
            }
          }
        }
      }
    }

    [class*='-timestamp'] {
      color: black;
    }

    @media screen and (width <= 768px) {
      top: 62px !important;
      right: 10px !important;
      left: unset !important;
      transform: unset !important;

      notification-center-content-component {
        > div {
          width: 100% !important;
          min-width: 300px;
          max-width: 375px;
        }
      }
    }
  }

  &.dark {
    body > .css-0 [class*='-timestamp'] {
      color: rgb(255 255 255);
    }
  }
}
</style>
