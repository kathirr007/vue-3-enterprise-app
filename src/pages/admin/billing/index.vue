<script setup lang="ts">
import router from '@/router';
import { useQuery } from 'vue-query';

const route = useRoute();

const selectedBilling = ref(route.query.billingId as string);

const { getAll } = useClientBilling();
const { featureSubscribed, canAccessAllMenu } = usePermissions();

const { data: billings, isLoading } = useQuery(
  'billing',
  () => {
    return getAll({});
  },
  {
    onSuccess: (data) => {
      if (data.results.length && !selectedBilling.value) {
        router.push({
          query: {
            ...route.query,
            billingId: data.results[0].id
          }
        });
      }
    }
  }
);
</script>

<template>
  <Common426
    v-if="featureSubscribed('billing', 'invoice') === false"
    feature="billing"
  />
  <CommonPage v-else>
    <template #title>
      <Dropdown
        v-model="selectedBilling"
        :options="billings?.results"
        option-label="name"
        option-value="id"
        placeholder="Select Billing"
        :loading="isLoading"
        class="w-96"
        filter
        @change="
          () => {
            router.push({
              query: {
                ...route.query,
                billingId: selectedBilling,
              },
            });
          }
        "
      />
    </template>

    <CommonLoading v-if="isLoading" />
    <div v-else>
      <BillingTabs
        v-if="selectedBilling"
        :billing-id="selectedBilling"
        is-billing-page
        route-name="admin-billing"
      />
      <div v-if="billings?.total === 0">
        <div class="card">
          <div class="card-body">
            <p class="text-center font-medium">
              No billing profile found to show the billing information{{ `${canAccessAllMenu ? ',' : '.'}` }} <router-link v-if="canAccessAllMenu" :to="{ name: 'admin-client-billing-create' }" class="hover:underline">
                Create billing profile here.
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </CommonPage>
</template>

<style lang="scss" scoped></style>
