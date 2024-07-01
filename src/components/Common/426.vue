<script setup lang="ts">
const props = defineProps<{
  feature?: string;
  integration?: string;
}>();

const router = useRouter();
const { titleCase } = useVueFilters();
const { canAccessAllMenu } = usePermissions();
const { isPortalUser } = useCurrentUserData();
function handleUpgrade() {
  router.push({ name: 'admin-subscription' });
}
function handleIntegrate() {
  router.push({ name: 'admin-integrations' });
}
</script>

<template>
  <div class="blur-container">
    <div class="blurred-overlay">
      <div class="text-center py-4 flex flex-column gap-2 lg:gap-3">
        <h1 class="text-red-500 font-bold text-3xl lg:text-5xl">
          {{ feature ? 'Upgrade' : 'Integration' }} Required
        </h1>
        <div v-if="canAccessAllMenu && !isPortalUser">
          <div v-if="feature">
            <p class="text-gray-700 font-semibold text-sm lg:text-lg">
              To access the
              <span class="text-primary font-bold">{{
                titleCase(feature || 'feature')
              }}</span>, please upgrade your subscription plan.
            </p>
            <Button @click="handleUpgrade">
              Upgrade
            </Button>
          </div>
          <div v-if="integration">
            <p class="text-gray-700 font-semibold text-lg">
              To access the feature, please integrate the
              <span class="text-primary font-bold">{{
                titleCase(integration || 'integration')
              }}</span>
            </p>
            <Button @click="handleIntegrate">
              Integrate
            </Button>
          </div>
        </div>
        <div v-else>
          <div v-if="feature">
            <p class="text-gray-700 font-semibold text-lg">
              To access the
              <span class="text-primary font-bold">{{
                titleCase(feature || 'feature')
              }}</span>, please contact your admin to upgrade the subscription plan.
            </p>
          </div>
          <div v-if="integration">
            <p class="text-gray-700 font-semibold text-lg">
              To access the feature, please contact your admin to integrate the
              <span class="text-primary font-bold">{{
                titleCase(integration || 'integration')
              }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blur-container {
  position: relative;
  background-image: url('/images/pixel_result.png');
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;

  /* height: 100%; */

  /* width: 100%; */
  border-radius: 10px;
}

.blurred-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  text-align: center;
  backdrop-filter: blur(30px);
}
</style>
