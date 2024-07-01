import type { useBaseQuery } from 'vue-query/lib/vue/useBaseQuery';
<script setup lang="ts">
import type { MetaObj } from '@/types/common.type';
import { useQuery } from 'vue-query';

const { getAllPendingIntegrations } = useOrgIntegrations();
const { getOneCategory } = useOrgOnboarding();
const { currentUser } = useCurrentUserData();
const { fullName } = useVueFilters();
const isDisableCard = true;

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});

const { metaFilter } = useUtilityFns();

const isOnboardingCTAClicked = computed(() => {
  return orgDetails.value
    ? metaFilter(
      orgDetails.value?.meta as unknown as MetaObj[],
      'onboardingCTAClicked'
    ) === 'true'
    : true;
});

const { data: categoryData, isLoading: categoryLoading } = useQuery('category-data', () => {
  return getOneCategory(orgType.value);
});
</script>

<template>
  <CommonLoading v-if="categoryLoading" />
  <template v-else>
    <div class="box-shadow widget-radius card flex flex-column w-full">
      <Panel toggleable class="dashboard-collapsable-panel">
        <template #header>
          <div class="get-start-title pr-4 w-full">
            <p class="mb-0 text-2xl">
              Hey <span class="font-bold text-primary">{{ fullName(currentUser) }}</span>, What would you like to do today?
            </p>
            <!-- <div class="text-lg">
              Follow our quick start guide to streamline your onboarding process and unlock the full potential of BrightReturn.
            </div> -->
          </div>
        </template>
        <template #togglericon="{ collapsed }">
          <Button v-tooltip="collapsed ? 'Expand' : 'Collapse'" class="text-2xl" :icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'" rounded aria-label="Toggle" />
        </template>
        <div class="grid m-2">
          <QuickStartCards
            :integrations="categoryData?.quickStartIntegrations"
            :integrations-loading="categoryLoading"
            quickstart
            class="col-12"
          />
        </div>
      </Panel>
    </div>
  </template>
</template>

<style lang="scss" scoped>
:deep(.p-panel) {
  &.no-border,
  &.dashboard-collapsable-panel {
    position: relative;

    .p-panel-header,
    .p-panel-content {
      border: none;
    }

    .p-panel-icons {
      position: absolute;
      top: 1rem;
      right: 0;
    }
  }
}
</style>
