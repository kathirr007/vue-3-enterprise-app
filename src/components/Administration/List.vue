<script setup lang="ts">
const { isPortalUser } = useCurrentUserData();
const { allOrgIntegrationIds, isFeatureIntegrated, canDo } = usePermissions(
  !isPortalUser.value
);

const administrationData = reactive<string[] | any[]>([
  {
    id: 1,
    name: 'HRMS',
    route: 'admin-hrms',
    icon: 'fluent-mdl2:workforce-management',
    isInternalIntegration: true,
    featuresName: ['hrms']
  },
  {
    id: 2,
    name: 'Subscription',
    route: 'admin-subscription',
    icon: 'material-symbols:workspace-premium'
  },
  {
    id: 3,
    name: 'Integrations',
    route: 'admin-integrations',
    icon: 'uil:process'
  },
  {
    id: 4,
    name: 'Setup Project Template',
    route: 'admin-services',
    icon: 'mingcute:tool-line',
    isInternalIntegration: true,
    featuresName: ['work']
  },
  {
    id: 5,
    name: `${$tConfig('BUSINESS_ENTITY')}`,
    route: 'admin-business-entities',
    icon: 'ic:round-business'
  },
  {
    id: 6,
    name: 'Roles and Designations',
    route: 'admin-roles-and-designations',
    icon: 'icon-park-outline:user-business'
  },
  {
    id: 7,
    name: 'Security',
    route: 'admin-security',
    icon: 'mdi:security-account-outline'
  },
  {
    id: 8,
    name: 'Bright Directory',
    route: 'admin-brightdirectory',
    icon: 'mdi:web'
  },
  {
    id: 9,
    name: `${$tConfig('CLIENT_BILLING_PROFILE')}`,
    route: 'admin-client-billing',
    icon: 'la:file-invoice-dollar',
    isInternalIntegration: true,
    featuresName: ['client_billing']
  },
  {
    id: 10,
    name: 'Client Portal Setting',
    route: 'admin-portal-setting',
    icon: 'ph:gear',
    isInternalIntegration: true,
    featuresName: ['client_portal']
  },
  {
    id: 11,
    name: 'AI Setting',
    route: 'admin-ai-setting',
    icon: 'ph:gear',
    isInternalIntegration: true,
    featuresName: ['data_extraction', 'smart_folder']
  },
  {
    id: 11,
    name: 'Document Gallery',
    route: 'admin-gallery',
    icon: 'ph:folders'
  },
  {
    id: 11,
    name: 'From Email',
    route: 'admin-fromemail',
    icon: 'ph:envelope-simple'
  },
  {
    id: 12,
    name: 'Webform Templates',
    route: 'admin-webform-templates',
    icon: 'fa6-brands:wpforms'
  },
  {
    id: 13,
    name: `${$tConfig('CLIENT')} Feedback`,
    route: 'admin-client-feedback',
    icon: 'codicon:feedback'
  }
]);

const filteredAdministrationData = computed(() => {
  return administrationData.filter((item: any) => {
    if (item.isInternalIntegration) {
      return isFeatureIntegrated(item.featuresName, allOrgIntegrationIds.value);
    }
    return true;
  })
    .filter((item: any) => {
      if (!canDo('gallery', ['list'])) {
        return item.route !== 'admin-gallery';
      }
      return true;
    });
});
</script>

<template>
  <div
    v-if="(filteredAdministrationData?.length as number) > 0"
    class="display-grid"
  >
    <div
      v-for="(admin, index) in filteredAdministrationData"
      :key="index"
      class="card p-0 box-shadow reports-card h-full relative"
    >
      <router-link
        :to="{ name: `${admin.route}` }"
        class="flex flex-column align-items-center justify-content-center p-3 h-full card-link"
      >
        <Icon :icon="admin.icon" class="flex-none text-7xl tile-icon mb-2" />
        <span class="text-primary font-medium text-xl text-center">{{
          admin.name
        }}</span>
      </router-link>
    </div>
  </div>

  <div v-else class="card">
    <p class="text-center font-medium text-xl">
      No Administration Data Found.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.display-grid {
  display: grid;
  grid-template-columns: repeat(1fr);
  grid-auto-rows: 1fr;
  gap: 30px;

  .reports-card {
    button {
      position: absolute;
      right: 20px;
      bottom: 20px;
    }
  }

  .card-link {
    border-radius: calc(10 / 15.2) * 1rem;
    transition: all 0.25s;

    .tile-icon {
      color: var(--gray-900);
    }

    &:hover {
      .tile-icon {
        color: $primaryColor;
      }

      box-shadow: inset 0 0 0 1px $primaryColor;
    }
  }

  @media screen and (width >= 576px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media screen and (width >= 992px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media screen and (width >= 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media screen and (width >= 1400px) {
    grid-template-columns: repeat(5, 1fr);
  }
}
</style>
