import { createRouter, createWebHistory } from 'vue-router';
import type { NavigationGuardNext } from 'vue-router';
import { setupLayouts } from 'virtual:generated-layouts';
import { useNProgress } from '@vueuse/integrations/useNProgress';
import generatedRoutes from '~pages';
import { useCookies } from '@vueuse/integrations/useCookies';
import type { ClientAccessSetting } from '@/types/teams.type';
import type { Org } from '@/types/myaccount.type';

const cookies = useCookies(['isloggedin', 'user', 'planPermission', 'userType']);

const internalIntegrationRoutes = reactive<{
  [key: string]: string[];
}>({
  'admin-tasks': ['work'],
  'admin-tasks-assignments': ['work'],
  'admin-tasks-alltasks': ['work'],
  'admin-projects': ['work'],
  'admin-calendar': ['work'],
  'admin-time-log': ['work'],
  'admin-services': ['work'],
  'admin-support': ['brightdesk'],
  'admin-mails': ['brightdesk'],
  // 'admin-teams-hrms': ['hrms'],
  'admin-hrms': ['hrms'],
  'admin-broadcasts-client': ['broadcasts'],
  'admin-broadcasts-team': ['broadcasts'],
  'admin-billing': ['client_billing'],
  'admin-extraction': ['data_extraction'],
  'admin-client-billing': ['client_billing'],
  'admin-portal-setting': ['client_portal'],
  'admin-ai-setting': ['data_extraction', 'smart_folder']
  // 'admin-gallery': ['gallery'],
});

const { initToast } = useToasts();
const { titleCase } = useVueFilters();
const { start: startProgress, done: stopProgress } = useNProgress();
const {
  permissionKeys,
  getPermissions,
  isFeatureIntegrated,
  getAllOrgIntegrationIds
} = usePermissions();
const { isFalsy } = useUtilityFns();
const { getCurrentUser } = useMe();

const routes = setupLayouts(generatedRoutes);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

const isLoggedIn = ref(false);
// const currentUser: User | null = null;
let isSubscriptionActive: boolean | null = null;
let isOnBoardingCompleted: boolean | undefined;

let orgData: Org | undefined;

// const accessiblePortalRoutes = portalRouteNames;

// console.log(accessiblePortalRoutes.value);

router.beforeEach(async (to, from, next) => {
  // Add page loading progress bar
  if (to.path) {
    startProgress();
  }

  isLoggedIn.value = await cookies.get('isloggedin') === 'yes';
  // currentUser = await cookies.get('user');
  if (!isLoggedIn.value) {
    resetCurrentUser();
  }
  if (isLoggedIn.value && isFalsy(userToken.value)) {
    userType.value = (cookies.get('userType'));

    const currentUserData = await getCurrentUser(userType.value === 'CLIENT_USER');
    userToken.value = btoa(JSON.stringify(currentUserData));
    // userPlanPerms.value = btoa(JSON.stringify(currentUserData.planPermission));
    // currentUser.value = currentUserData.user;
  }
  const loggedInUser = currentUser.value || undefined;
  isSubscriptionActive = await cookies.get('isSubscriptionActive');

  const isPortalUser = loggedInUser?.type === 'CLIENT_USER';
  const isOrgUser = loggedInUser?.type === 'ORG_USER';
  const isOutsourcedOrgUser = loggedInUser?.type === 'OUTSOURCED_ORG_USER';
  const isOwner = loggedInUser?.isOwner;
  const isLevel1User = loggedInUser?.orgRole?.name === 'Level 1';
  const isPortalRoute = to.matched.some((record) => {
    return (record.name as string)?.startsWith('portal');
  });

  const portalAccessSettings = loggedInUser?.client?.accessSetting;

  const portalRouteNames = generatePortalRouteNames(
    portalAccessSettings as ClientAccessSetting
  );

  if (isLoggedIn.value && (isOrgUser || isOutsourcedOrgUser) && isOwner) {
    orgData = await useOrgDetails();
  }
  isOnBoardingCompleted = (orgData as Org)?.isOnBoardingCompleted;

  const isInternalIntegrationRoute = to.matched.some(record =>
    Object.prototype.hasOwnProperty.call(
      internalIntegrationRoutes,
      record.name as string
    )
  );

  const isOrgRoute = to.matched.some(
    record =>
      (record.name as string)?.startsWith('admin')
      || record.name === 'index'
      || record.name === 'settings'
  );
  const isOnboardingRoute = to.matched.some(
    record => record.name === 'admin-onboarding'
  );

  const isDashboardRoute = to.matched.some(record => record.name === 'index');
  const isSubscriptionRoute = to.matched.some(
    record => record.name === 'admin-subscription'
  );
  const isSwitchAccountRoute = to.matched.some(
    record => record.name === 'portal-switch-account'
  );

  const authRoute = to.matched.some(record => record.path.includes('auth'));
  const ignoreAuth = to.matched.some(pc => pc.meta.ignoreAuth);
  const isPublic = to.matched.some(pc => pc.meta.isPublic);

  const redirectPortalUser = () => {
    if (to.name === 'index') {
      next({ name: 'portal' });
    }
    if (to.name === 'portal' && !portalRouteNames.includes('dashboard')) {
      const topRouteName = portalRouteNames.filter(
        item => item !== 'portal'
      )[0];
      const getHomeRoute = (routeName: string) => {
        switch (routeName) {
          case 'dashboard':
            return 'portal';
          case 'work':
            return 'portal-tasks';
          case 'brightdesk':
            return 'portal-support';
          case 'documents':
            return 'portal-documents';
          default:
            return 'portal-401';
        }
      };
      next({ name: getHomeRoute(topRouteName) });
    }
    else {
      next();
    }
  };

  if (
    isInternalIntegrationRoute
    && isLoggedIn.value
    && (isOrgUser || isOutsourcedOrgUser)
  ) {
    const allOrgIntegrationsIds = await getAllOrgIntegrationIds();
    // const { allOrgIntegrationIds } = usePermissions(!isPortalUser);
    if (allOrgIntegrationsIds.value.length
      && !isFeatureIntegrated(
        internalIntegrationRoutes[to.name as string],
        allOrgIntegrationsIds.value
      )
    ) {
      const featureName = `${titleCase(
        (to.name as string).split('-').slice(1).join(' ')
      )}`;
      const integrationName: any = titleCase(
        internalIntegrationRoutes[to.name as string]
          .map((item: string) => titleCase(item, '_'))
          .join(' Or ')
      );
      // app.config.globalProperties.$toast.add(
      //   );
      initToast({
        actionType: 'Reject',
        life: 10000,
        summary: 'Feature Not Available',
        detail: `${
          isLevel1User
            ? `Please integrate <strong>${integrationName} module</strong> to access <strong>
              ${titleCase(featureName)}
            </strong>`
            : `Contact admin to access <strong>${titleCase(
                featureName
              )}</strong>`
        }`
      });
      if (isPortalUser) {
        redirectPortalUser();
      }
      else {
        permissionKeys.value.length
        && permissionKeys.value.includes('dashboard')
          ? next({ name: 'index' })
          : allOrgIntegrationsIds.value.includes('work')
            ? next({ name: 'admin-tasks' })
            : next({ name: 'admin-teams-hrms' });
      }
      return;
    }
  }

  if (isLoggedIn.value && isOrgUser && isOwner && !isOnboardingRoute && !isOnBoardingCompleted) {
    next({ name: 'admin-onboarding' });
  }

  if (isOnboardingRoute && isOnBoardingCompleted) {
    next({ name: 'index' });
  }

  if (isLoggedIn.value && (isOrgUser || isOutsourcedOrgUser) && !userPerms.value) {
    const data = await getPermissions();
    userPerms.value = btoa(JSON.stringify(data));
  }

  /* if (
    isLoggedIn.value
    && (!userPlanPerms.value || atob(userPlanPerms.value) === '"undefined"')
  ) {
    // const planCookie = cookies.get('planPermission');
    const planPermission = loggedInUserData.value ? JSON.parse(atob(loggedInUserData.value)).planPermission : undefined;
    userPlanPerms.value = btoa(JSON.stringify(planPermission));
  } */

  if (isPublic) {
    next();
  }
  else if (!ignoreAuth && !isLoggedIn.value) {
    next({ name: 'auth-signin' });
  }
  else if (isLoggedIn.value && authRoute) {
    if (isOrgUser || isOutsourcedOrgUser) {
      goToSubscription(
        authRoute || isSubscriptionRoute || isOnboardingRoute,
        () => next({ name: 'admin-subscription' }),
        () =>
          permissionKeys.value.length
          && permissionKeys.value.includes('dashboard')
            ? next({ name: 'index' })
            : next({ name: 'admin-tasks' })
      );
    }
    if (isPortalUser) {
      if (!isSwitchAccountRoute && !isFalsy(loggedInUser?.client)) {
        next({ name: 'portal' });
      }
      if (isSwitchAccountRoute && !isFalsy(loggedInUser?.client)) {
        redirectPortalUser();
      }
      if (isFalsy(loggedInUser?.client)) {
        next({ name: 'portal-switch-account' });
      }
      else {
        redirectPortalUser();
      }
    }
  }
  else {
    if ((isOrgUser || isOutsourcedOrgUser) && isPortalRoute) {
      goToSubscription(
        authRoute || isSubscriptionRoute || isOnboardingRoute,
        () => next({ name: 'admin-subscription' }),
        () =>
          permissionKeys.value.length
          && permissionKeys.value.includes('dashboard')
            ? next({ name: 'index' })
            : next({ name: 'admin-tasks' })
      );
    }
    else if (isPortalUser && isOrgRoute && !isSwitchAccountRoute) {
      if (isSwitchAccountRoute && !isFalsy(loggedInUser?.client)) {
        redirectPortalUser();
      }
      if (isFalsy(loggedInUser?.client)) {
        next({ name: 'portal-switch-account' });
      }
      else {
        redirectPortalUser();
      }
    }
    else {
      goToSubscription(
        authRoute || isSubscriptionRoute || isOnboardingRoute,
        () => next({ name: 'admin-subscription' }),
        () => {
          if (isDashboardRoute) {
            permissionKeys.value.length
            && permissionKeys.value.includes('dashboard')
              ? next()
              : next({ name: 'admin-tasks' });
          }
          else {
            if (
              isPortalUser
              && !isSwitchAccountRoute
              && isFalsy(loggedInUser?.client)
            ) {
              next({ name: 'portal-switch-account' });
            }
            else if (
              isPortalUser
              && isSwitchAccountRoute
              && !isFalsy(loggedInUser?.client)
            ) {
              redirectPortalUser();
            }
            else if (
              isPortalUser
              && !isSwitchAccountRoute
              && !isFalsy(loggedInUser?.client)
            ) {
              redirectPortalUser();
            }
            else {
              next();
            }
          }
        }
      );
    }
  }
});

function goToSubscription(isSubscriptionPage: boolean,
  subscriptionFunc: NavigationGuardNext,
  elseFunc: NavigationGuardNext) {
  if (
    isSubscriptionActive !== null
    && !isSubscriptionActive
    && !isSubscriptionPage
  ) {
    subscriptionFunc();
  }
  else elseFunc();
}

router.afterEach(() => {
  stopProgress();
});

export default router;

export { isLoggedIn };
