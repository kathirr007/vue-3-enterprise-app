<script setup lang="ts">
import type { User } from '@/types/teams.type';
import { useQuery } from 'vue-query';

const makeAPICall = ref(false);

const { isPortalUser, currentUser } = useCurrentUserData();
const { getCalendlyUrl } = useIntegrations();

const { data: userDetails } = useQuery<User>(
  'user-details',
  async () => {
    return useUserDetails(currentUser.value?.id, isPortalUser.value);
  },
  {
    onSuccess: (data: User) => {
      if (data) {
        makeAPICall.value = true;
      }
    }
  }
);
const { data: calendlyData, isFetching } = useQuery(
  ['calendly-url'],
  async () => {
    const data = await getCalendlyUrl(
      userDetails.value?.userClients[0].client.relationshipManager.id as string,
      isPortalUser.value
    );
    return data;
  },
  {
    enabled: makeAPICall
  }
);
</script>

<template>
  <CommonLoading v-if="isFetching" />
  <IntegrationsCalendlySchedule
    v-if="calendlyData"
    :calendly-url="calendlyData.url"
  />
</template>
