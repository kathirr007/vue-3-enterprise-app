<script setup lang="ts">
import { useRouteQuery } from '@vueuse/router';

const clientDetails = inject('clientDetails', undefined);

const route = useRoute();
const clientId = ref(route.params.id as string);
const fileId = useRouteQuery<string>('fileId');
const isSignReq = useRouteQuery<string>('isSignReq');
const isDocumentViewer = useRouteQuery<string>('isDocumentViewer');
const { isPortalUser } = useCurrentUserData();
</script>

<template>
  <PSPDFKitContainer
    v-if="isDocumentViewer === 'true'"
    :client-id="clientId"
    :file-id="fileId"
    :is-sign-req="isSignReq === 'true'"
  />
  <CommonPage v-else :title="`${!isPortalUser ? $tConfig('CLIENT') : ''} eSignature`">
    <template #actions>
      <!-- <Button
            icon="pi pi-plus"
            class="p-button-rounded"
            @click="isOpenSignRequest = true"
            v-tooltip.left="'Sign Request'"
          /> -->
    </template>
    <ClientsESignatureList :client="clientDetails" />
  </CommonPage>
</template>
