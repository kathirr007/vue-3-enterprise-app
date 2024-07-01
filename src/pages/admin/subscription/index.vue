<script setup lang="ts">
import { useQuery } from 'vue-query';
import dayjs from 'dayjs';

const makeAPICall = ref(false);
const { currentUser, updateUserToken } = useCurrentUserData();
const { getCurrentUser } = useMe();
const { dateToHumanShort, titleCase } = useVueFilters();
const { defaultBreakpoints, styles } = useCommonBreakPoints();

const openFeatureLimitDialog = ref(false);
const isUpgrade = ref(false);
const subscriptionTableRef = ref(null);
// const { data: subscription, isLoading } = useQuery(
//   ['subscriptions', makeAPICall],
//   async () => {
//     if (makeAPICall.value) {
//       const data = await useSubscription();
//       return data;
//     }
//   },
//   {
//     onSuccess: (data) => {
//       if (data) {
//         if (data.subscriptionStatus) {
//           const a = document.createElement('a');
//           a.href = data.url as string;
//           a.target = '_blank';
//           document.body.append(a);
//           a.click();
//           a.remove();
//         }
//       }
//     },
//   }
// );

const {
  data: customerDetails,
  isLoading: customerDetailsIsLoading,
  isFetching: customerDetailsFetching
} = useQuery(
  'customer-details',
  () => {
    return useCustomerDetails();
  },
  {
    onSuccess: async (data) => {
      // userPlanPerms.value = btoa(JSON.stringify(data.planPermission));
      const currentUserData = await getCurrentUser();
      updateUserToken(currentUserData);
    }
  }
);

const userLimit = computed(() => {
  const teamMemberResource = customerDetails.value?.resourceLimits.find(
    (item: any) => item.resource === 'TEAM_MEMBER'
  );
  return teamMemberResource ? teamMemberResource.limit : null;
});

const isSubscriptionExpired = computed(() => {
  return dayjs(customerDetails?.value?.subscriptionEndDate).isBefore(dayjs());
});

const onTrialLabel = computed(() => {
  if (customerDetails.value?.onTrial && isSubscriptionExpired.value)
    return 'Your trial has expired. Subscribe to continue accessing all features.';
  if (!customerDetails.value?.onTrial && isSubscriptionExpired.value)
    return 'Your plan  has expired. Upgrade to continue accessing all features.';
  if (customerDetails.value?.onTrial)
    return `You are using trial account going to expire in next <strong>${dayjs(
      customerDetails.value?.subscriptionEndDate
    ).diff(dayjs(), 'day')} day(s).</strong>`;
  if (customerDetails?.value?.currentPlanId === 'FREEMIUM')
    return '';
  else
    return `Your subscription for <strong>${
      userLimit.value
    }</strong> users is currently active, and will renew by <strong>${dateToHumanShort(
      customerDetails?.value?.subscriptionEndDate as string
    )}</strong>.<br/> To upgrade your plan or add more users, click on Manage.<br/> For more details related to plan comparison please click <a href='https://brightreturn.com/pricing/' target="_blank" class='cursor-pointer underline font-bold' >Here</a>`;
});
function showSubscriptionPlans() {
  openFeatureLimitDialog.value = false;
  (subscriptionTableRef.value as any)?.handleShowSubscriptionPlans();
}
</script>

<template>
  <CommonLoading v-if="customerDetailsIsLoading" />
  <div v-else class="card grid m-1">
    <div v-if="false" class="text-center col-12 md:col-6">
      <h2 class="text-center mb-4 underline">
        Plans
      </h2>
      <h4 class="mb-5">
        <strong>$49</strong> USD per user billed monthly.
      </h4>
      <h4 class="mb-2">
        <strong>$39</strong> USD per user billed annually. Save 20%!
      </h4>
      <em class="text-lg mb-2">If your team comprises <span class="font-semibold">5</span> users who
        are billed at <span class="font-semibold">$2350</span> USD annually.</em>
      <em class="font-medium text-lg block text-primary">
        You save a total of <span class="font-semibold">$600</span> USD per
        year!
      </em>
      <h4 class="mt-5">
        Use code <strong>BRWELCOME</strong> for 30% extra Saving, on annual
        subscription.
      </h4>
    </div>
    <div class="col-12 flex align-items-center flex-column">
      <h2 class="text-center mb-4 underline">
        {{ `${isUpgrade ? 'Upgrade' : 'Current'}` }} Plan
      </h2>
      <p
        class="text-center text-2xl font-medium mb-3"
        :class="
          customerDetails?.onTrial || isSubscriptionExpired
            ? 'text-red-500'
            : ''
        "
        v-html="onTrialLabel"
      />
      <p
        class="text-center text-2xl font-medium mb-3"
        :class="
          customerDetails?.onTrial || isSubscriptionExpired
            ? 'text-red-500'
            : ''
        "
      >
        <span v-if="customerDetails?.currentPlanId === 'FREEMIUM'">
          Your current plan is <strong>Freemium</strong>. To view your usage details, click <span
            class="cursor-pointer underline font-bold text-primary"
            role="link"
            tabindex="0"
            @click="openFeatureLimitDialog = true"
          >here</span>.
          <br>
          <span v-if="!isUpgrade">Click <span class="font-bold">"Upgrade"</span> to expand your limit.</span>
        </span>
        <span v-if="!!customerDetails?.currentPlanId && customerDetails?.currentPlanId !== 'FREEMIUM'">
          Your current plan usage and limit can be checked <span
            class="cursor-pointer underline font-bold text-primary"
            role="link"
            tabindex="0"
            @click="openFeatureLimitDialog = true"
          >
            Here
          </span>
        </span>
      </p>
      <!-- <Button
        class="mt-2"
        v-if="!customerDetails?.onTrial"
        label="Upgrade"
        :loading="isLoading"
        @click="makeAPICall = true"
      /> -->
      <!-- <div v-if="!isLoading && customerDetails?.onTrial" class="mt-5">
        <stripe-pricing-table
          :pricing-table-id="subscription?.pricing_table_id"
          :publishable-key="subscription?.publishable_key"
          :customer-email="currentUser?.email"
          :client-reference-id="currentUser?.id"
        >
        </stripe-pricing-table>
      </div> -->
      <SubscriptionsPricingTable
        ref="subscriptionTableRef"
        :current-plan="customerDetails?.currentPlanId"
        :fetching-status="customerDetailsFetching"
        :loading-status="customerDetailsIsLoading"
        :subscription-status="customerDetails"
        @show-subscription-plans="isUpgrade = true"
        @hide-subscription-plans="isUpgrade = false"
      />
    </div>
  </div>
  <Dialog
    v-model:visible="openFeatureLimitDialog"
    :modal="true"
    append-to="body"
    :breakpoints="defaultBreakpoints"
    header="Feature Limit"
    :style="{ width: '75vw' }"
    content-class="border-round-bottom-md relative"
    class="dialog-custom"
    @hide="openFeatureLimitDialog = false"
  >
    <template #header>
      <div class="flex justify-content-between align-items-center w-full">
        <h3 class="text-xl m-0">
          Feature Limit for {{ titleCase(customerDetails?.currentPlanId as string) }} users
        </h3>
        <Button v-if="customerDetails?.currentPlanId === 'FREEMIUM'" class="mr-4" label="Upgrade" @click="showSubscriptionPlans" />
      </div>
    </template>
    <SubscriptionsFeatureTable :resources="customerDetails?.resourceLimits" />
  </Dialog>
</template>
