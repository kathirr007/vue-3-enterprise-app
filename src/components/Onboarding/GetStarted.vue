<script setup lang="ts">
import type { MetaObj } from '@/types/common.type';
import { useQuery } from 'vue-query';

const { getAllPendingIntegrations } = useOrgIntegrations();
const isDisableCard = true;

const { data: orgDetails, isLoading } = useQuery('org-data', () => {
  return useOrgDetails();
});

const { metaFilter } = useUtilityFns();
const { fullName } = useVueFilters();
const { currentUser } = useCurrentUserData();

const isOnboardingCTAClicked = computed(() => {
  return orgDetails.value
    ? metaFilter(
      orgDetails.value?.meta as unknown as MetaObj[],
      'onboardingCTAClicked'
    ) === 'true'
    : true;
});

const {
  data: pendingOrgIntegrations,
  isLoading: integrationsLoading,
  isFetching: fetchingIntegrations
} = useQuery(
  'pending-org-integrations',
  () => {
    return getAllPendingIntegrations();
  }
);

const totalSteps = computed(() => {
  return pendingOrgIntegrations.value?.reduce((total: any, integration: any) => {
    return total + integration.OrgIntegrationStep.length;
  }, 0) || 0;
});
const completedSteps = computed(() => {
  return pendingOrgIntegrations.value?.reduce((total: any, integration: any) => {
    return total + integration.OrgIntegrationStep.filter((step: any) => step.status === 2).length;
  }, 0) || 0;
});
const progressValue = computed(() => {
  return totalSteps.value > 0 ? Math.floor((completedSteps.value / totalSteps.value) * 100) : 0;
});
</script>

<template>
  <CommonLoading v-if="integrationsLoading" />
  <template v-else>
    <OnboardingCongratsCard
      v-if="!pendingOrgIntegrations?.length && !isOnboardingCTAClicked"
      :org-data="orgDetails"
    />
    <div
      v-else-if="pendingOrgIntegrations?.length"
      class="box-shadow widget-radius card flex flex-column w-full"
    >
      <Panel toggleable class="dashboard-collapsable-panel">
        <template #header>
          <div class="w-full pr-4">
            <div class="w-full m-2 flex flex-col flex-wrap">
              <div class="w-full text-2xl">
                Welcome <span class="font-bold text-primary">{{ fullName(currentUser) }}</span> to BrightReturn
              </div>
              <div class="w-full text-lg font-semibold mt-4">
                Complete following steps in order to get started
              </div>
              <div class="flex flex-column gap-2 w-full">
                <ProgressBar
                  class="w-full mt-2" :pt="{
                    value: { class: 'bg-green-400' },
                  }" :value="progressValue"
                />
                <div class="flex justify-content-between text-primary font-medium text-lg">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
            <div class="text-center get-start-title mb-4">
              <h3 class="mb-0">
                Getting Started
              </h3>
              <div class="text-lg">
                Great to have you onboard! Feel free to explore, or get a head start
                below.
              </div>
            </div>
          </div>
        </template>
        <template #togglericon="{ collapsed }">
          <Button v-tooltip="collapsed ? 'Expand' : 'Collapse'" class="text-2xl" :icon="collapsed ? 'pi pi-chevron-down' : 'pi pi-chevron-up'" rounded aria-label="Toggle" />
        </template>
        <div class="grid mb-4 m-2">
          <OnboardingCards
            :integrations="pendingOrgIntegrations"
            :integrations-loading="integrationsLoading"
            disable-card
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
