import type { MenuItem as BreadcrumbMenuitem, MenuItem } from 'primevue/menuitem';
import { useCookies } from '@vueuse/integrations/useCookies';
import router from '@/router';
import type { RouteLocationRaw } from 'vue-router';
import { DomHandler } from 'primevue/utils';
import type { ClientAccessSetting, User } from '@/types/teams.type';
import { Capacitor } from '@capacitor/core';
import type { ConfigKeys, OrgCategoryId } from '@/types/app.type';
import type { LoggedInUserData } from '@/types/me.type';
import type { CommonUserType } from '@/types/common.type';

export const isDevBuild = process.env.NODE_ENV === 'development';
export const isProdBuild
  = process.env.NODE_ENV === 'production'
  && window.location.host.includes('app.');

export const cookies = useCookies([
  'user',
  'isPasswordChangeRequired',
  'planPermission',
  'userType'
]);

const { isFalsy } = useUtilityFns();

export function resetCurrentUser() {
  userToken.value = null;
  userType.value = null;
  // userPlanPerms.value = null;
  userPerms.value = null;
  // currentUser.value = null;
}

export const isNativePlatform = computed(() => Capacitor.isNativePlatform());

export function isObject(item: any) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function mergeDeep(target: any, ...sources: any): any {
  if (!sources.length)
    return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key])
          Object.assign(target, {
            [key]: {}
          });
        mergeDeep(target[key], source[key]);
      }
      else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/* export function currentUserData() {
  const userCookie = cookies.get('user');
  return useStorage('user', { ...userCookie }, localStorage, {
    mergeDefaults: (storageValue, defaults) => {
      if (JSON.stringify(defaults) === '{}')
        return mergeDeep(null, null);
      return mergeDeep(storageValue, defaults);
    }
  });
}

export const currentUser = computed({
  get: () => currentUserData().value,
  set: val => (currentUserData().value = val)
}); */

export const useBrToken = createGlobalState((userToken = null) => {
  return useLocalStorage<any>(
    'userToken',
    userToken !== null
      ? userToken
      : null
  );
});

export const userToken = useBrToken();

export const useCurrentUser = createGlobalState((userData = null) => {
  return useLocalStorage<any>(
    'user',
    userData !== null
      ? userData
      : null
  );
});

// export const currentUser = useCurrentUser();
/* export const currentUser = computed({
  get: () => !isFalsy(useCurrentUser().value) ? JSON.parse(atob(useCurrentUser().value)) : undefined,
  set: (val) => {
    if (isFalsy(val)) {
      useCurrentUser().value = val;
    }
    else {
      useCurrentUser().value = btoa(JSON.stringify(val));
    }
  }
}); */

export const currentUser = computed<User>(() => {
  // return !isFalsy(userToken.value) ? JSON.parse(atob(userToken.value)).user : undefined;
  if (userToken.value) {
    return JSON.parse(atob(userToken.value)).user;
  }
  return undefined;
});

const useUserPermissions = createGlobalState((permissions = null) => {
  return useLocalStorage<any>(
    'userPerms',
    permissions !== null ? permissions : null
  );
});

export const userPerms = useUserPermissions();

/* const useUserPlanPermissions = createGlobalState((permissions = null) => {
  return useLocalStorage<any>(
    'userPlanPerms',
    permissions !== null ? permissions : null
  );
});

export const userPlanPerms = useUserPlanPermissions(); */

export const userPlanPerms = computed(() => {
  return !isFalsy(userToken.value) ? JSON.parse(atob(userToken.value)).planPermission : undefined;
});

export const useCurrentUserPlan = createGlobalState((userData = null) => {
  return useLocalStorage<any>(
    'user',
    userData !== null
      ? userData
      : null
  );
});

export const currentUserPlanPermissions = useCurrentUserPlan();

/* function currentUserData() {
  // const userCookie = cookies.get('user');
  const userData = currentUser.value;
  return useStorage('user', { ...userData }, localStorage, {
    mergeDefaults: (storageValue, defaults) => {
      if (JSON.stringify(defaults) === '{}')
        return mergeDeep(null, null);
      return mergeDeep(storageValue, defaults);
    }
  });
} */

/* export const currentUser = computed<LoggedInUserData | null>({
  get: () => currentUser.value,
  set: (val) => {
    loggedInUserData.value = val;
  }
}); */

// export function currentUserPlan() {
//   const planPermissionsCookie = cookies.get('planPermission');
//   return planPermissionsCookie;
// }

// export const currentUserPlanPermissions = computed(() => {
//   /* const planPermissionsCookie = cookies.get('planPermission');
//   return planPermissionsCookie; */
//   return loggedInUserData.value?.planPermission;
// });

export function generatePortalRouteNames(accessSettings: ClientAccessSetting) {
  if (!accessSettings)
    return [];
  const modPortalAccessSettings: any = ref({
    portal: accessSettings.enablePortal,
    dashboard: accessSettings.enablePortalProjectTracking,
    work: accessSettings.enablePortalTaskTracking,
    brightdesk: accessSettings.enablePortalBrightDesk,
    documents: accessSettings.enablePortalDocuments
  });
  const portalRouteNames: string[] = [];
  for (const key in modPortalAccessSettings.value) {
    if (modPortalAccessSettings.value[key] === 'true') {
      portalRouteNames.push(key);
    }
  }
  return portalRouteNames.includes('portal') ? portalRouteNames : [];
}

export function useUserType(userType?: CommonUserType) {
  const userTypeCookie = cookies.get('userType');
  return useLocalStorage<CommonUserType>('userType', userTypeCookie || userType);
}

export const userType = useUserType();

/* export const userType = computed<CommonUserType>(() => {
  const userTypeCookie = cookies.get('userType');
  return userTypeCookie;
}); */
const isPortalUser = computed(() => {
  return currentUser.value?.type === 'CLIENT_USER' || userType.value === 'CLIENT_USER';
});

export const orgType = computed<OrgCategoryId>(() => {
  return currentUser.value?.org?.category.id as OrgCategoryId;
});

export const orgConfig = computed(() => {
  return isPortalUser.value ? currentUser.value?.client?.org?.category?.config : currentUser.value?.org?.category?.config;
});

export function $tConfig(key: ConfigKeys) {
  return orgConfig.value ? orgConfig.value[key] : '';
}

const isPasswordChangeRequired = computed(() => {
  const isPasswordChange: boolean = cookies.get('isPasswordChangeRequired');
  return isPasswordChange;
});

export const useCurrentUserData = createGlobalState(() => {
  /* const updateCurrentUser = (user: User | null) => {
    currentUser.value
      = user !== null ? { ...currentUser, user } : null;
  }; */
  const updateUserToken = (user: LoggedInUserData | null) => {
    userToken.value
      = user !== null ? btoa(JSON.stringify(user)) : null;
  };

  return {
    currentUser,
    orgType,
    // updateCurrentUser,
    updateUserToken,
    isPortalUser,
    isPasswordChangeRequired,
    currentUserPlanPermissions
  };
});
export function isDesktop() {
  return window.innerWidth > 991;
}
export function isMobile() {
  return window.innerWidth <= 991;
}

export const useLayoutContentClass = createGlobalState(() => {
  const contentClass = ref('');

  return { contentClass };
});
export function useProjectViewMode(mode: 'kanban' | 'list') {
  return useLocalStorage<any>('projectViewMode', mode);
}
export function useDocumentViewMode(mode: 'grid' | 'list') {
  return useLocalStorage<any>('documentViewMode', mode);
}
const useSidebarStaticCtrl = createGlobalState(() => {
  return useLocalStorage<boolean>('sidebarStatic', true);
});
const useTimerActiveCtrl = createGlobalState(() => {
  return useLocalStorage<boolean>('isTimerActive', false);
});
export const useBreadcrumbs = createGlobalState(() => {
  const initialValues: BreadcrumbMenuitem[] = [];
  const breadcrumb = ref(initialValues);

  const updateBreadcrumb = ({
    breadcrumbs,
    item
  }: {
    breadcrumbs: BreadcrumbMenuitem[] | undefined;
    item?: BreadcrumbMenuitem;
  }) => {
    if (breadcrumbs) {
      breadcrumb.value = breadcrumbs as BreadcrumbMenuitem[];
    }
    if (item) {
      breadcrumb.value.push(item);
    }
  };
  return { updateBreadcrumb, breadcrumb };
});

export function useAppData() {
  const appData = ref({
    target: 'BrightReturn',
    appName: 'Bright Return',
    logo: '/images/logos/bright-return.svg',
    logoExtended: '/images/logos/bright-return-2.svg',
    favicon: '/images/logos/bright-return.svg',
    copyright: 'All Rights Reserved - Mudrantar Solutions Pvt Limited',
    currency: 'USD',
    currencySymbol: '$',
    logoAltText: 'Bright Return',
    displayName: 'Bright Return',
    supportEmail: '',
    termsAndConditions: 'https://mudrantar.com/usa/terms-and-conditions.html',
    zohoSupport: ''
  });

  const appMenuControls = allMenuControls;

  const isSidebarActive = computed(() => {
    return unref(appMenuControls.sidebarActive);
  });

  const isSidebarStatic = computed(() => {
    return unref(appMenuControls.sidebarStatic);
  });

  const logoImg = ref(
    !isSidebarActive.value && !isSidebarStatic.value
      ? appData.value.logo
      : appData.value.logoExtended
  );

  const updateLogo = () => {
    if (isSidebarActive.value) {
      logoImg.value = appData.value.logoExtended;
    }
    else {
      logoImg.value = appData.value.logo;
    }
  };

  return {
    appData,
    isSidebarActive,
    logoImg,
    isSidebarStatic,
    updateLogo
  };
}

export const documentViewMode = useDocumentViewMode('list');
export function useMenuControl() {
  const mailLayout = ref(false);
  const toggleEmailLayout = useToggle(mailLayout);
  const menuClick = ref(false);
  const toggleMenuClick = useToggle(menuClick);
  const menuActive = ref(false);
  const toggleMenuActive = useToggle(menuActive);
  const sidebarActive = ref(false);
  const toggleSidebar = useToggle(sidebarActive);
  const sidebarStatic = useSidebarStaticCtrl();
  const toggleSidebarStatic = useToggle(sidebarStatic);
  const staticMenuMobileActive = ref(false);
  const toggleStaticMenuMobile = useToggle(staticMenuMobileActive);
  // const rightPanelActive = ref(false);
  // const toggleRightPanel = useToggle(rightPanelActive);
  const topUserMenuActive = ref(false);
  const toggleTopUserMenu = useToggle(topUserMenuActive);
  const topHelpMenuActive = ref(false);
  const toggleTopHelpMenu = useToggle(topHelpMenuActive);
  const topTimerMenuActive = ref(false);
  const toggleTopTimerMenu = useToggle(topTimerMenuActive);
  const isDarkTheme = useDark();
  const toggleDarkTheme = useToggle(isDarkTheme);
  const isTimerActive = useTimerActiveCtrl();
  const toggleTimerActive = useToggle(isTimerActive);
  const topbarSearchActive = ref(false);
  const toggleTopbarSearch = useToggle(topbarSearchActive);
  const topbarSearchInputActive = ref(false);
  const toggleTopbarSearchInput = useToggle(topbarSearchInputActive);

  const hideTopDropDownMenus = () => {
    toggleTopUserMenu(false);
    toggleTopHelpMenu(false);
    toggleTopTimerMenu(false);
  };
  const blockBodyScroll = () => {
    if (document.body.classList) {
      document.body.classList.add('blocked-scroll');
    }
    else {
      document.body.className += ' blocked-scroll';
    }
  };
  const unblockBodyScroll = () => {
    if (document.body.classList) {
      document.body.classList.remove('blocked-scroll');
    }
    else {
      document.body.className = document.body.className.replace(
        new RegExp(
          `(^|\\b)${'blocked-scroll'.split(' ').join('|')}(\\b|$)`,
          'gi'
        ),
        ' '
      );
    }
  };
  const hideOverlayMenu = () => {
    toggleStaticMenuMobile(false);
    unblockBodyScroll();
  };
  const handleDocumentClick = () => {
    if (!topbarSearchInputActive.value) {
      toggleTopbarSearch(false);
    }

    if (!menuClick.value) {
      if (staticMenuMobileActive.value) {
        hideOverlayMenu();
      }
      unblockBodyScroll();
      toggleMenuClick(false);
    }

    // toggleRightPanel(false);
    toggleStaticMenuMobile(false);
    hideTopDropDownMenus();
    if (!sidebarStatic.value) {
      toggleSidebar(false);
    }
  };
  const onMenuClick = (event: Event) => {
    if (
      DomHandler.hasClass(event.target as HTMLElement, 'layout-menu-container')
    ) {
      // EventBus.emit('reset-active-index');
      menuClick.value = false;
      menuActive.value = false;
    }
    menuClick.value = true;
  };
  const onMenuButtonClick = (event: Event) => {
    menuClick.value = true;

    if (isMobile()) {
      hideTopDropDownMenus();
      toggleStaticMenuMobile();
      if (staticMenuMobileActive.value) {
        blockBodyScroll();
      }
      else {
        unblockBodyScroll();
      }
    }

    event.preventDefault();
  };
  const onMenuItemClick = (value: { originalEvent: Event; item: MenuItem }) => {
    if (!value.item.items) {
      // EventBus.emit('reset-active-index');
      menuActive.value = false;
      hideOverlayMenu();
    }
  };

  const navigateTo = (to: RouteLocationRaw) => {
    router.push(to);
    // router.push()
    handleDocumentClick();
  };

  const documentEl = document.documentElement;

  watchEffect(() => {
    documentEl.style.setProperty(
      '--root-base-color',
      isDarkTheme.value ? '#e9e9e9' : '#293241'
    );
  });

  return {
    mailLayout,
    toggleEmailLayout,
    onMenuItemClick,
    menuClick,
    onMenuButtonClick,
    toggleMenuClick,
    onMenuClick,
    menuActive,
    toggleMenuActive,
    toggleTimerActive,
    isTimerActive,
    topTimerMenuActive,
    toggleTopTimerMenu,
    topUserMenuActive,
    topHelpMenuActive,
    toggleTopUserMenu,
    toggleTopHelpMenu,
    // rightPanelActive,
    // toggleRightPanel,
    isDarkTheme,
    toggleDarkTheme,
    sidebarActive,
    toggleSidebar,
    sidebarStatic,
    toggleSidebarStatic,
    topbarSearchActive,
    toggleTopbarSearch,
    topbarSearchInputActive,
    toggleTopbarSearchInput,
    handleDocumentClick,
    navigateTo,
    hideTopDropDownMenus,
    staticMenuMobileActive,
    toggleStaticMenuMobile
  };
}

export const allMenuControls = useMenuControl();

export function useMenuItems(): MenuItem[] {
  const allMenus = [
    {
      name: 'dashboard',
      label: 'Dashboard',
      iconify: true,
      icon: 'material-symbols:home-outline-rounded',
      iconClass: 'text-2xl',
      to: { name: !isPortalUser.value ? 'index' : 'portal' }
    },
    {
      name: 'work',
      label: 'Work',
      iconify: true,
      icon: 'ps:work-case',
      iconClass: 'text-2xl',
      items: [
        {
          name: 'tasks',
          label: `${isPortalUser.value ? '' : 'My '}Tasks`,
          iconify: true,
          icon: 'fluent:clipboard-task-list-ltr-24-regular',
          iconClass: 'text-2xl',
          to: { name: !isPortalUser.value ? 'admin-tasks' : 'portal-tasks' }
        },
        {
          name: 'assignments',
          label: `Assignments`,
          iconify: true,
          icon: 'fluent:clipboard-task-list-ltr-24-regular',
          iconClass: 'text-2xl',
          to: { name: 'admin-tasks-assignments' }
        },
        {
          name: 'alltasks',
          label: `All Tasks`,
          iconify: true,
          icon: 'fluent:clipboard-task-list-ltr-24-regular',
          iconClass: 'text-2xl',
          to: { name: 'admin-tasks-alltasks' }
        },
        // {
        //   name: 'client-tasks',
        //   label: 'Client Tasks',
        //   iconify: true,
        //   icon: 'fluent:clipboard-task-list-ltr-24-regular',
        //   iconClass: 'text-2xl',
        //   to: { name: 'admin-client-tasks' },
        // },
        {
          name: 'projects',
          label: 'Projects',
          iconify: true,
          icon: 'pajamas:project',
          iconClass: 'text-2xl',
          to: { name: 'admin-projects' }
        },
        {
          name: 'calendar',
          label: 'Calendar',
          iconify: false,
          icon: 'pi pi-calendar',
          iconClass: 'text-2xl',
          to: { name: 'admin-calendar' }
        },
        {
          name: 'timelog',
          label: 'Time Log',
          iconify: false,
          icon: 'pi pi-clock',
          iconClass: 'text-2xl',
          to: { name: 'admin-time-log' }
        }
      ]
    },
    {
      name: 'brightdesk',
      label: 'Bright Desk',
      iconify: true,
      icon: 'fluent:person-support-16-filled',
      iconClass: 'text-2xl',
      items: [
        {
          name: 'support_tasks',
          label: 'Tickets',
          iconify: true,
          icon: 'cil:list-high-priority',
          iconClass: 'text-2xl',
          to: {
            name: !isPortalUser.value ? 'admin-support' : 'portal-support'
          }
        },
        {
          name: 'mails',
          label: 'Mails',
          iconify: true,
          icon: 'ic:round-mail-outline',
          iconClass: 'text-2xl',
          to: { name: !isPortalUser.value ? 'admin-mails' : 'portal-mails' }
          /* items: [
            {
              label: 'Inbox',
              icon: 'pi pi-inbox',
              to: { name: 'admin-mails-type', params: { type: 'inbox' } },
            },
            {
              label: 'Sent Items',
              icon: 'pi rotate-45 pi-send',
              to: { name: 'admin-mails-type', params: { type: 'sent-items' } },
            },
            {
              label: 'Archived',
              icon: 'pi pi-custom pi-archived',
              to: { name: 'admin-mails-type', params: { type: 'archived' } },
            },
          ], */
        }
      ]
    },
    {
      name: 'myclient',
      label: `My ${$tConfig('CLIENT')}`,
      iconify: true,
      icon: 'mdi:user-tie',
      iconClass: 'text-2xl',
      items: [
        {
          name: 'clients',
          label: `${$tConfig('CLIENT')}s`,
          iconify: true,
          icon: 'ph:handshake',
          iconClass: 'text-2xl',
          to: { name: 'admin-clients' }
        },
        {
          name: 'contacts',
          label: `${$tConfig('CONTACT')}s`,
          iconify: true,
          icon: 'typcn:contacts',
          iconClass: 'text-2xl',
          to: { name: 'admin-contacts' }
        },
        {
          name: 'client_groups',
          label: `${$tConfig('CLIENT')} Groups`,
          iconify: true,
          icon: 'ci:users-group',
          iconClass: 'text-2xl',
          to: { name: 'admin-client-groups' }
        }
      ]
    },

    {
      name: 'documents',
      label: 'Documents',
      iconify: true,
      icon: 'heroicons:folder',
      iconClass: 'text-2xl',
      to: { name: 'portal-documents' }
    },
    /* {
      name: 'myteam',
      label: 'My Team',
      iconify: true,
      icon: 'ant-design:team-outlined',
      iconClass: 'text-2xl',
      items: [
        {
          name: 'users',
          label: 'Team',
          iconify: true,
          icon: 'ant-design:team-outlined',
          iconClass: 'text-2xl',
          to: { name: !isPortalUser.value ? 'admin-teams' : 'portal-teams' },
        },
        {
          name: 'users_hrms',
          label: 'HRMS',
          iconify: true,
          icon: 'fluent-mdl2:workforce-management',
          iconClass: 'text-2xl',
          to: { name: 'admin-teams-hrms' },
        },
      ],
    }, */
    {
      name: 'users_hrms',
      label: 'HRMS',
      iconify: true,
      icon: 'fluent-mdl2:workforce-management',
      iconClass: 'text-2xl',
      to: { name: 'admin-teams-hrms' }
    },
    {
      name: 'hrms',
      label: 'HRMS',
      iconify: true,
      icon: 'fluent-mdl2:workforce-management',
      iconClass: 'text-2xl',
      to: { name: 'admin-hrms' }
    },
    {
      name: 'broadcasts',
      label: 'Bulk Email',
      iconify: true,
      icon: 'fluent:arrow-growth-20-filled',
      iconClass: 'text-2xl',
      items: [
        {
          name: 'client_broadcasts',
          label: 'Email to Client',
          iconify: true,
          icon: 'ri:chat-smile-2-fill',
          iconClass: 'text-2xl',
          to: { name: 'admin-broadcasts-type', params: { type: 'client' } }
        },
        {
          name: 'team_broadcasts',
          label: 'Email to Team',
          iconify: true,
          icon: 'uil:chat-bubble-user',
          iconClass: 'text-2xl',
          to: { name: 'admin-broadcasts-type', params: { type: 'team' } }
        }
      ]
    },
    /* {
      name: 'billing',
      label: 'Billing',
      iconify: true,
      icon: 'uil:bill',
      iconClass: 'text-2xl',
      to: { name: 'admin-billing' },
    }, */
    {
      name: 'reports',
      label: 'Reports',
      iconify: true,
      icon: 'icon-park-outline:analysis',
      iconClass: 'text-2xl',
      to: { name: 'admin-reports' }
    },
    {
      name: 'client_billing',
      label: 'Billing',
      iconify: true,
      icon: 'la:file-invoice-dollar',
      iconClass: 'text-2xl',
      to: { name: 'admin-billing' }
    },
    {
      name: 'admin',
      label: 'Administration',
      iconify: true,
      icon: 'material-symbols:admin-panel-settings-outline-rounded',
      iconClass: 'text-2xl',
      to: { name: 'admin-administration' }
    },
    {
      name: 'data_extraction',
      label: 'Extraction',
      iconify: true,
      icon: 'material-symbols:download',
      iconClass: 'text-2xl',
      to: { name: 'admin-extraction' }
    },
    {
      name: 'knowledgeBase',
      label: 'KnowledgeBot',
      iconify: true,
      icon: 'oi:book',
      iconClass: 'text-2xl',
      to: { name: 'admin-knowledge-base' },
      badge: 'Beta'
    }
  ];

  return allMenus;
}

export function useBreadcrumbsItems(): {
  [key: string]: BreadcrumbMenuitem[];
} {
  return {
    'index': [],
    'admin-tasks': [
      {
        label: 'Work'
        // to: { name: 'admin-tasks' },
      },
      {
        label: `${isPortalUser.value ? '' : 'My '}Tasks`,
        to: { name: 'admin-tasks' }
      }
    ],
    'admin-tasks-assignments': [
      {
        label: 'Work'
        // to: { name: 'admin-tasks' },
      },
      {
        label: `Assignments`,
        to: { name: 'admin-tasks-assignments' }
      }
    ],
    'admin-tasks-alltasks': [
      {
        label: 'Work'
      },
      {
        label: `All Tasks`,
        to: { name: 'admin-tasks-alltasks' }
      }
    ],
    // 'admin-client-tasks': [
    //   {
    //     label: 'Work',
    //   },
    //   {
    //     label: 'Client Tasks',
    //     to: { name: 'admin-client-tasks' },
    //   },
    // ],
    'admin-time-log': [
      {
        label: 'Work'
        // to: { name: 'admin-tasks' },
      },
      {
        label: 'Time Log',
        to: { name: 'admin-time-log' }
      }
    ],
    'admin-roles-and-designations': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Roles and Designations'
      }
    ],
    'admin-security': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Security'
      }
    ],
    'admin-projects': [
      {
        label: 'Work'
        // to: { name: 'admin-tasks' },
      },
      {
        label: 'Projects',
        to: { name: 'admin-projects' }
      }
    ],
    'admin-calendar': [
      {
        label: 'Work'
        // to: { name: 'admin-tasks' },
      },
      {
        label: 'Calendar',
        to: { name: 'admin-calendar' }
      }
    ],
    'admin-clients': [
      {
        label: `My ${$tConfig('CLIENT')}`
      },
      {
        label: `${$tConfig('CLIENT')}s`,
        to: { name: 'admin-clients' }
      }
    ],
    'admin-contacts': [
      {
        label: `My ${$tConfig('CLIENT')}`
      },
      {
        label: `${$tConfig('CONTACT')}s`,
        to: { name: 'admin-contacts' }
      }
    ],
    'admin-integrations': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Integrations'
      }
    ],
    'admin-subscription': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Subscriptions'
      }
    ],
    'admin-clients-import': [
      {
        label: `${$tConfig('CLIENT')}s`,
        to: { name: 'admin-clients' }
      },
      {
        label: 'Import'
      }
    ],
    'admin-teams': [
      {
        label: 'My Team'
      },
      {
        label: 'Team',
        to: { name: 'admin-teams' }
      }
    ],
    'admin-teams-hrms': [
      /* {
        label: 'My Team',
      }, */
      {
        label: 'HRMS'
        // to: { name: 'admin-teams-hrms' },
      }
    ],
    'admin-hrms': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'HRMS'
      }
    ],
    'admin-hrms-leavebalance': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'HRMS',
        to: {
          name: 'admin-hrms'
        }
      },
      {
        label: 'Leave Balance',
        to: {
          name: 'admin-hrms',
          query: {
            activeIndex: 1
          }
        }
      },
      {
        label: 'Create Leave balance'
      }
    ],
    'admin-broadcasts-client': [
      {
        label: 'Client Broadcasts',
        to: { name: 'admin-broadcasts-client' }
      }
    ],
    'admin-broadcasts-team': [
      {
        label: 'Team Broadcasts',
        to: { name: 'admin-broadcasts-team' }
      }
    ],
    'admin-services': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Setup Project Template'
      }
    ],
    'admin-services-create': [
      {
        label: 'Setup Project Template',
        to: { name: 'admin-services' }
      },
      {
        label: 'Create'
      }
    ],
    'admin-business-entities': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: `${$tConfig('BUSINESS_ENTITY')}`
      }
    ],
    'admin-brightdirectory': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Bright Directory'
      }
    ],
    'admin-client-billing': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Client Billing'
      }
    ],
    'admin-billing': [
      {
        label: 'Billing'
      }
    ],
    'admin-portal-setting': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Client Portal Setting'
      }
    ],
    'admin-ai-setting': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'AI Setting'
      }
    ],
    'admin-fromemail': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'From Email'
      }
    ],
    'admin-webform-templates': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Webform Templates'
      }
    ],
    'admin-client-feedback': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Client Feedback'
      }
    ],
    'admin-gallery': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      },
      {
        label: 'Document Gallery'
      }
    ],
    'admin-client-billing-create': [
      {
        label: 'Client Billing',
        to: { name: 'admin-client-billing' }
      },
      {
        label: 'Create'
      }
    ],
    'admin-teams-invite': [
      { label: 'HRMS', to: { name: 'admin-teams-hrms' } },
      {
        label: 'Team',
        to: { name: 'admin-teams-hrms', query: { activeIndex: 0 } }
      },
      {
        label: 'Invite Team'
      }
    ],
    'admin-outsourced-teams-invite': [
      { label: 'HRMS', to: { name: 'admin-teams-hrms' } },
      {
        label: 'Outsourced Teams',
        to: { name: 'admin-teams-hrms', query: { activeIndex: 1 } }
      },
      {
        label: 'Invite Team'
      }
    ],
    'settings': [
      {
        label: 'Organization',
        to: { name: 'settings' }
      }
    ],
    'myaccount': [
      {
        label: 'My Account',
        to: { name: 'myaccount' }
      }
    ],
    'admin-reports': [
      {
        label: 'Reports',
        to: { name: 'admin-reports' }
      }
    ],
    'admin-administration': [
      {
        label: 'Administration',
        to: { name: 'admin-administration' }
      }
    ],
    'admin-mails': [
      {
        label: 'Bright Desk'
        // to: { name: 'admin-support' },
      },
      {
        label: 'Mails'
      }
    ],
    'admin-client-groups': [
      {
        label: `My ${$tConfig('CLIENT')}`
      },
      {
        label: `${$tConfig('CLIENT')} Groups`,
        to: { name: 'admin-client-groups' }
      }
    ],
    'admin-support': [
      {
        label: 'Bright Desk'
        // to: { name: 'admin-support' },
      },
      {
        label: 'Tickets',
        to: { name: 'admin-support' }
      }
    ],
    'admin-knowledge-base': [
      {
        label: 'KnowledgeBot'
      }
    ],
    'admin-extraction': [
      {
        label: 'Extraction'
      }
    ],
    'admin-billing-invoices-generate': [
      {
        label: 'Billing',
        to: { name: 'admin-billing' }
      },
      {
        label: 'Invoices',
        to: { name: 'admin-billing', query: { activeIndex: 0 } }
      },
      {
        label: 'Generate'
      }
    ],
    // Portal routes
    'portal': [],
    'portal-support': [
      {
        label: 'Tickets',
        to: { name: 'portal-support' }
      }
    ],
    'portal-tasks': [
      {
        label: 'Tasks',
        to: { name: 'portal-tasks' }
      }
    ],
    'portal-teams': [
      {
        label: 'Teams',
        to: { name: 'portal-teams' }
      }
    ],
    'portal-documents': [
      {
        label: 'Documents',
        to: { name: 'portal-documents' }
      }
    ],
    'portal-schedule-meeting': [
      {
        label: 'Schedule Meeting'
      }
    ]
  };
}
