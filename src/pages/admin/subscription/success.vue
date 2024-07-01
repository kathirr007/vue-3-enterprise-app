<script setup lang="ts">
import router from '@/router';
import { useQuery, useQueryClient } from 'vue-query';

import dayjs from 'dayjs';

const queryClient = useQueryClient();
const { dateToHumanShort } = useVueFilters();
const { updateUserToken } = useCurrentUserData();
const { getCurrentUser } = useMe();

const openDailog = ref(true);

const { defaultBreakpoints, styles } = useCommonBreakPoints();

const { data: customerDetails, isLoading: customerDetailsIsLoading } = useQuery(
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

const { data: teamUserLimits } = useQuery('outsourced-limit', () => {
  return getResourceLimits({ resource: 'TEAM_MEMBER' });
});

const userLimit = computed(() => {
  return teamUserLimits.value?.[0]?.limit;
});

function handleClose() {
  queryClient.invalidateQueries('customer-details');
  router.push({ name: 'admin-subscription' });
}

const onTrialLabel = computed(() => {
  return customerDetails.value?.onTrial
    ? `You are using trial account going to expire in next <strong>${dayjs(
        customerDetails.value?.subscriptionEndDate
      ).diff(dayjs(), 'day')} days.</strong>`
    : `Your subscription for <strong>${
        userLimit.value
      }</strong> users is currently active, and will renew by <strong>${dateToHumanShort(
        customerDetails?.value?.subscriptionEndDate as string
      )}</strong>.<br/> To upgrade your plan or add more users, click on Upgrade.`;
});
</script>

<template>
  <div>
    <CommonLoading v-if="customerDetailsIsLoading" />
    <div v-else class="card grid m-1">
      <div class="col-12 flex align-items-center flex-column">
        <h2 class="text-center mb-4 underline">
          Current Plan
        </h2>
        <p
          class="text-center text-2xl font-medium mb-3"
          :class="customerDetails?.onTrial ? 'text-red-500' : ''"
          v-html="onTrialLabel"
        />
      </div>
    </div>
    <Dialog
      v-if="!customerDetailsIsLoading"
      v-model:visible="openDailog"
      :modal="true"
      append-to="body"
      header="Congratulations!"
      :breakpoints="{ ...defaultBreakpoints, '960px': '75vw' }"
      :style="styles"
      content-class="border-round-bottom-md"
      @hide="handleClose"
    >
      <div class="text-lg font-medium">
        You have subscribed for <strong>{{ userLimit }}</strong> users. Please
        enable or add users you want to work on BrighReturn.
      </div>
      <Button
        class="mt-4 max-w-max mx-auto block"
        label="Manage Users"
        @click="router.push({ name: 'admin-teams-hrms' })"
      />
    </Dialog>
  </div>
</template>
