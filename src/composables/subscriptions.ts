import $api from '@/plugins/api';
import {
  type CustomerDetails,
  type Plan,
  ResourceType,
  type SessionPayload,
  type Subscription
} from '@/types/subscription.type';
import type { MaybeRef } from 'vue';
import { useQuery } from 'vue-query';

export async function useSubscription() {
  const { data } = await $api.get<Subscription>(
    'subscriptions/stripe/session/url'
  );

  return data;
}
export async function useCustomerDetails() {
  const { data } = await $api.get<CustomerDetails>('subscriptions');
  return data;
}

export async function getSubscriptionPlans() {
  const { data } = await $api.get<Plan[]>('subscriptions/subscription/plans');
  return data;
}

export async function startStripeSession(payload: SessionPayload) {
  const { data } = await $api.post('subscriptions/stripe/session/url', payload);
  return data;
}

export async function startStripeAddOn(payload: SessionPayload) {
  const { data } = await $api.post('subscriptions/stripe/addon', payload);
  return data;
}

export async function getResourceLimits({
  filters,
  resource,
  isPortalUser
}: {
  filters?: string;
  resource?: string;
  isPortalUser?: boolean;
}) {
  const { data } = await $api.get(`subscriptions/${isPortalUser ? 'portal/' : ''}resources`, {
    params: {
      filters,
      resource
    }
  });
  return data;
}

export function useUsageLimit({
  filters,
  resource,
  isPortalUser,
  enabled = ref(true),
  queryKey
}: {
  filters?: string;
  resource?: keyof typeof ResourceType;
  isPortalUser?: boolean;
  enabled?: MaybeRef<boolean>;
  queryKey?: string;
}) {
  const { data: usageLimits, isLoading, isFetching } = useQuery([queryKey || 'resource-usage-limit'], () => {
    return getResourceLimits({ resource: ResourceType[resource as keyof typeof ResourceType], filters, isPortalUser });
  }, {
    enabled
  });

  const resourceUsage = computed(() => {
    const limitComputed = usageLimits.value?.[0].limit === -1 ? 0 : usageLimits.value?.[0].limit;
    const usageComputed = usageLimits.value?.[0].orgSubscriptionResourceUsages && usageLimits.value?.[0].orgSubscriptionResourceUsages.length > 0 ? usageLimits.value?.[0].orgSubscriptionResourceUsages?.[0].usage : 0;
    return { limit: limitComputed, usage: usageComputed };
  });

  return {
    usageLimits, isLoading, isFetching, resourceUsage, limit: resourceUsage.value.limit, usage: resourceUsage.value.usage
  };
}
