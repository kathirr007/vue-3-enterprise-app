<script setup lang="ts">
import type { CustomerDetails, Plan, planId } from '@/types/subscription.type';
import { useQuery } from 'vue-query';

const props = defineProps<{
  subscriptionStatus?: CustomerDetails;
  fetchingStatus?: boolean;
  loadingStatus?: boolean;
  currentPlan?: planId;
}>();

const emit = defineEmits<{
  (e: 'show-subscription-plans'): void;
  (e: 'hide-subscription-plans'): void;
}>();

const showSubscriptionPlans = ref(false);

const isAnnual = ref<boolean>(
  props.subscriptionStatus?.interval
    ? props.subscriptionStatus?.interval === 'year'
    : true
);
const isAnnualAddon = ref<boolean>(
  props.subscriptionStatus?.interval
    ? props.subscriptionStatus?.interval === 'year'
    : true
);

const {
  data: plans,
  isLoading: loadingPlans,
  isFetching: fetchingPlans
} = useQuery('subscription-plans', () => {
  return getSubscriptionPlans();
});

const normalPlans = computed(() => {
  if (plans.value) {
    return plans.value.filter(plan => plan.id !== 'CONTRACTUAL_TEAM').sort((a, b) => a.order - b.order);
  }
});

const subscriptionPlans = computed(() => {
  if (plans.value) {
    return plans.value.filter(
      plan => plan.id !== 'CONTRACTUAL_TEAM' && plan.id !== 'FREEMIUM'
    )
      .sort((a, b) => a.order - b.order);
  }
});

const addOnPlans = computed(() => {
  if (plans.value) {
    return plans.value.filter(plan => plan.id === 'CONTRACTUAL_TEAM');
  }
});

const currentActivePlan = computed(() => {
  if (props.currentPlan)
    return plans.value?.find(plan => plan.id === props.currentPlan);
});

const userLimit = computed(() => {
  const teamMemberResource = props.subscriptionStatus?.resourceLimits.find(
    (item: any) => item.resource === 'TEAM_MEMBER'
  );
  return teamMemberResource ? teamMemberResource.limit : null;
});

const contractLimit = computed(() => {
  const teamMemberResource = props.subscriptionStatus?.resourceLimits.find(
    (item: any) => item.resource === 'OUTSOURCED_ORG_USER'
  );
  return teamMemberResource ? teamMemberResource.limit : null;
});

function handleShowSubscriptionPlans() {
  emit('show-subscription-plans');
  showSubscriptionPlans.value = true;
}

defineExpose({
  handleShowSubscriptionPlans
});
</script>

<template>
  <CommonLoading
    v-if="fetchingStatus || loadingStatus || loadingPlans || fetchingPlans"
  />
  <div v-else>
    <div
      v-if="!subscriptionStatus?.interval && currentPlan !== 'FREEMIUM'"
      class="text-center mb-5 flex justify-content-center"
    >
      <div
        class="flex m-auto bg-white border-none outline-none align-items-center justify-content-center border-round-3xl lg:mb-10 border shadow-3"
      >
        <button
          class="border-none outline-none px-5 py-3 border-round-3xl font-semibold cursor-pointer"
          :class="
            isAnnual
              ? 'text-white bg-primary shadow-2'
              : 'text-gray-500 bg-white'
          "
          @click="isAnnual = true"
        >
          Yearly
        </button>
        <button
          class="border-none outline-none px-5 py-3 border-round-3xl font-semibold cursor-pointer"
          :class="
            isAnnual
              ? 'text-gray-500 bg-white'
              : 'text-white bg-primary shadow-2'
          "
          @click="isAnnual = false"
        >
          Monthly
        </button>
      </div>
    </div>
    <div v-if="currentPlan && !showSubscriptionPlans">
      <div class="flex w-full justify-content-center mt-4">
        <div class="max-w-20rem lg:max-w-18rem">
          <SubscriptionsPricingTab
            :plan="currentActivePlan as unknown as Plan"
            :starter="(currentActivePlan as unknown as Plan).id === 'STARTER'"
            :enterprise="
              (currentActivePlan as unknown as Plan).id === 'ENTERPRISE'
            "
            :freemium="(currentActivePlan as unknown as Plan).id === 'FREEMIUM'"
            :yearly="isAnnual"
            :current-plan="currentPlan"
            :user-limit="userLimit"
            :on-trial="subscriptionStatus?.onTrial"
            @upgrade="handleShowSubscriptionPlans"
          />
        </div>
      </div>
    </div>
    <div
      v-else-if="showSubscriptionPlans"
      class="flex flex-wrap justify-content-center gap-4"
    >
      <div
        v-for="(plan, index) in subscriptionPlans"
        :key="index"
        class="flex-initial max-w-20rem lg:max-w-18rem"
      >
        <div class="h-full">
          <SubscriptionsPricingTab
            :plan="plan"
            :starter="plan.id === 'STARTER'"
            :enterprise="plan.id === 'ENTERPRISE'"
            :yearly="isAnnual"
            :on-trial="false"
          />
        </div>
      </div>
      <div class="flex w-full">
        <Button class="p-button-text" icon="pi pi-chevron-left" text label="Back" @click="emit('hide-subscription-plans'); showSubscriptionPlans = false" />
      </div>
    </div>
    <div v-else class="flex flex-wrap justify-content-center gap-4">
      <div
        v-for="(plan, index) in normalPlans"
        :key="index"
        class="flex-initial max-w-20rem lg:max-w-18rem"
      >
        <div class="h-full">
          <SubscriptionsPricingTab
            :plan="plan"
            :starter="plan.id === 'STARTER'"
            :enterprise="plan.id === 'ENTERPRISE'"
            :freemium="plan.id === 'FREEMIUM'"
            :yearly="isAnnual"
            :current-plan="currentPlan"
            :user-limit="userLimit"
            :on-trial="subscriptionStatus?.onTrial"
          />
        </div>
      </div>
    </div>
    <Divider
      v-if="!currentPlan || subscriptionStatus?.enableAddOn"
      class="mt-6 mb-4"
    />
    <div v-if="!currentPlan || subscriptionStatus?.enableAddOn">
      <div>
        <h3 class="text-primary font-bold">
          Add Ons
          <h6 class="text-gray-600 inline ml-1">
            (Elevate your plan with powerful enhancements, optimizing
            productivity and value for a tailored experience. )
          </h6>
        </h3>
      </div>
      <div
        v-if="!currentPlan || subscriptionStatus?.enableAddOn"
        class="text-center mb-5 flex justify-content-center"
      >
        <div
          v-if="!subscriptionStatus?.interval"
          class="flex m-auto bg-white border-none outline-none align-items-center justify-content-center border-round-3xl lg:mb-10 border shadow-3"
        >
          <button
            class="border-none outline-none px-5 py-3 border-round-3xl font-semibold cursor-pointer"
            :class="
              isAnnualAddon
                ? 'text-white bg-primary shadow-2'
                : 'text-gray-500 bg-white'
            "
            @click="isAnnualAddon = true"
          >
            Yearly
          </button>
          <button
            class="border-none outline-none px-5 py-3 border-round-3xl font-semibold cursor-pointer"
            :class="
              isAnnualAddon
                ? 'text-gray-500 bg-white'
                : 'text-white bg-primary shadow-2'
            "
            @click="isAnnualAddon = false"
          >
            Monthly
          </button>
        </div>
      </div>
      <div class="flex flex-wrap justify-content-center gap-4 mt-4">
        <div
          v-for="(plan, index) in addOnPlans"
          :key="index"
          class="flex-initial max-w-20rem lg:max-w-18rem"
        >
          <div v-if="plan.id === 'CONTRACTUAL_TEAM'" class="h-full">
            <SubscriptionsPricingTab
              :plan="plan"
              :yearly="isAnnualAddon"
              :has-current-plan="!!currentPlan"
              :current-plan="currentPlan"
              :add-on-status="subscriptionStatus?.enableAddOn"
              :contract-limit="contractLimit"
              :on-trial="subscriptionStatus?.onTrial"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
