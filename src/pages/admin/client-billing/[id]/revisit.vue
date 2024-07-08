<script setup lang="ts">
import { useQuery } from 'vue-query';
import type { ClientBillingProfile } from '@/types/client-billing.type';

const { getOne } = useClientBilling();

const router = useRouter();
const route = useRoute();
const { updateBreadcrumb } = useBreadcrumbs();

const clientBillingId = ref<string>(route.params.id as string);
const profileBillingData = ref();

const { data: clientProfileDetails, isLoading: loadindDetails } = useQuery(
  ['client-profile-details', clientBillingId],
  () => {
    if (!clientBillingId.value)
      return;
    return getOne(clientBillingId.value as string);
  },
  {
    onSuccess: (data: ClientBillingProfile) => {
      profileBillingData.value = data;
      updateBreadcrumb({
        breadcrumbs: [
          { label: 'Client Billing', to: { name: 'admin-client-billing' } },
          {
            label: profileBillingData.value?.name,
            to: {
              name: 'admin-client-billing-id',
              params: { id: profileBillingData.value.id }
            }
          },
          { label: 'Revisit' }
        ]
      });
    }
  }
);

const isRevisit = computed(() => {
  return route?.name?.toString().includes('revisit');
});
</script>

<script lang="ts">
export default defineComponent({
  inheritAttrs: false
});
</script>

<template>
  <div v-if="loadindDetails">
    <CommonLoading />
  </div>
  <div
    v-else
    class="bg-white border-2 border-round default-border-color border-round-lg"
  >
    <div class="border-bottom-2 p-3 default-border-color">
      <h3 class="card-title m-0">
        {{ `Revisit ${profileBillingData?.name || ''}` }}
      </h3>
    </div>
    <div class="bg-blue-50 py-6">
      <ClientBillingCreate
        :revisit="isRevisit"
        :clientbilling="profileBillingData"
        @back="router.push({ name: 'admin-client-billing' })"
        @success="router.push({ name: 'admin-client-billing' })"
      />
    </div>
  </div>
</template>
