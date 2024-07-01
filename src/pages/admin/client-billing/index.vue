<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const { canDo, featureSubscribed } = usePermissions();
const { pluralize } = useVueFilters();
const router = useRouter();
const isQuickStart = useRouteQuery<string>('quickstart');

onBeforeMount(() => {
  if (isQuickStart.value && canDo('client_billing', 'create')) {
    router.push({
      name: 'admin-client-billing-create'
    });
  }
});
</script>

<template>
  <Common426
    v-if="featureSubscribed('billing', 'billing_profile') === false"
    feature="billing profile"
  />
  <!-- <CommonPage v-else :title="`${pluralize($tConfig('CLIENT_BILLING_PROFILE'))}`">
    <template #actions>
      <Button
        v-if="canDo('client_billing', 'create')"
        v-tooltip.left="`Add Billing Profile`"
        icon="pi pi-plus"
        class="p-button-rounded"
        :disabled="disableCreate"
        @click="
          router.push({
            name: 'admin-client-billing-create',
          })
        "
      />
    </template>

    <ClientBillingList v-if="canDo('client_billing', 'list')" />
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        You don't have access of the Client Billing list.
      </p>
    </div>
  </CommonPage> -->
  <ClientBillingList v-else />
</template>

<style lang="scss" scoped></style>
