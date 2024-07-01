<script setup lang="ts">
import { useQuery } from 'vue-query';

const { featureSubscribed } = usePermissions();
const { hasFeatureAccess } = useClientPortalAccess('brightdesk', 'Mails');

const { data: inboxList, isLoading: gettingInbox } = useQuery('mails', () =>
  useInboxList(true)
);
</script>

<template>
  <Common401 v-if="!hasFeatureAccess" feature="Mails" />
  <Common426
    v-else-if="featureSubscribed('client_portal', 'inbox') === false"
    feature="mails"
  />
  <template v-else>
    <CommonLoading v-if="gettingInbox" />
    <div v-else-if="inboxList?.length">
      <MailsThreadContainer :inbox="inboxList[0]" />
    </div>
    <div v-else class="card">
      <p class="text-center font-medium text-xl">
        Your Organization doesn't have Inbox.
      </p>
    </div>
  </template>
</template>

<style lang="scss" scoped></style>
